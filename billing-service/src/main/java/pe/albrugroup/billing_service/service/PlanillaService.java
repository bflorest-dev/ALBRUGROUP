package pe.albrugroup.billing_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.billing_service.entity.AdelantoSueldo;
import pe.albrugroup.billing_service.entity.BonoAdicionalEmpleado;
import pe.albrugroup.billing_service.entity.DetallePlanilla;
import pe.albrugroup.billing_service.entity.MatrizCalculoPlanilla;
import pe.albrugroup.billing_service.entity.PlanillaEmpleado;
import pe.albrugroup.billing_service.entity.PlanillaGeneral;
import pe.albrugroup.billing_service.entity.TramoPlanillaEmpleado;
import pe.albrugroup.billing_service.entity.enums.Concepto;
import pe.albrugroup.billing_service.entity.enums.Estado;
import pe.albrugroup.billing_service.entity.enums.ModalidadTrabajo;
import pe.albrugroup.billing_service.entity.enums.TipoDocumento;
import pe.albrugroup.billing_service.entity.enums.TipoMovimiento;
import pe.albrugroup.billing_service.entity.enums.TipoPlanilla;
import pe.albrugroup.billing_service.entity.request.AdelantoSueldoRequest;
import pe.albrugroup.billing_service.entity.request.BonoAdicionalRequest;
import pe.albrugroup.billing_service.entity.response.AdelantoSueldoResponse;
import pe.albrugroup.billing_service.entity.response.BonoAdicionalResponse;
import pe.albrugroup.billing_service.entity.response.DetallePlanillaResponse;
import pe.albrugroup.billing_service.entity.response.PlanillaAjustesResponse;
import pe.albrugroup.billing_service.entity.response.PlanillaEmpleadoResponse;
import pe.albrugroup.billing_service.entity.response.PlanillaGeneralResponse;
import pe.albrugroup.billing_service.entity.response.TramoPlanillaEmpleadoResponse;
import pe.albrugroup.billing_service.exception.BillingException;
import pe.albrugroup.billing_service.integration.LeadPlanillaClient;
import pe.albrugroup.billing_service.integration.RrhhPlanillaClient;
import pe.albrugroup.billing_service.integration.SchedulePlanillaClient;
import pe.albrugroup.billing_service.repository.AdelantoSueldoRepository;
import pe.albrugroup.billing_service.repository.BonoAdicionalEmpleadoRepository;
import pe.albrugroup.billing_service.repository.PlanillaGeneralRepository;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class PlanillaService {

    private final PlanillaGeneralRepository planillaGeneralRepository;
    private final AdelantoSueldoRepository adelantoSueldoRepository;
    private final BonoAdicionalEmpleadoRepository bonoAdicionalEmpleadoRepository;
    private final RrhhPlanillaClient rrhhClient;
    private final SchedulePlanillaClient scheduleClient;
    private final LeadPlanillaClient leadClient;
    private final PlanillaPolicyService policy;
    private final MatrizPlanillaService matrizPlanillaService;
    private final Clock clock = Clock.systemUTC();

    @Value("${billing.timezone:America/Lima}")
    private String timezone;

    @Transactional
    public PlanillaGeneralResponse calcular(Integer anio, Integer mes) {
        YearMonth periodo = validarPeriodoCerrado(anio, mes);
        MatrizCalculoPlanilla matriz = matrizPlanillaService.obtenerActiva();
        planillaGeneralRepository.findByAnioAndMesAndTipoPlanilla(anio, mes, TipoPlanilla.REGULAR)
                .ifPresent(planilla -> {
                    if (planilla.getEstado() != Estado.REVISION) {
                        throw new BillingException(HttpStatus.CONFLICT, "La planilla ya fue aprobada o pagada y no puede recalcularse");
                    }
                    planillaGeneralRepository.delete(planilla);
                    planillaGeneralRepository.flush();
                });

        List<RrhhPlanillaClient.EmpleadoPlanillaDto> empleados = Objects.requireNonNullElse(
                rrhhClient.obtenerEmpleadosConContratos(anio, mes),
                List.of()
        );
        List<Long> idsEmpleados = empleados.stream().map(RrhhPlanillaClient.EmpleadoPlanillaDto::idEmpleado).toList();
        Map<Long, List<SchedulePlanillaClient.IncidenciaDiaDto>> incidencias = Objects.requireNonNullElse(
                        scheduleClient.obtenerIncidencias(anio, mes, idsEmpleados),
                        List.<SchedulePlanillaClient.EmpleadoIncidenciasDto>of()
                ).stream()
                .collect(Collectors.toMap(
                        SchedulePlanillaClient.EmpleadoIncidenciasDto::idEmpleado,
                        dto -> Objects.requireNonNullElse(dto.incidencias(), List.of())
                ));
        Map<Long, Integer> ventas = Objects.requireNonNullElse(
                        leadClient.obtenerVentasValidas(anio, mes),
                        List.<LeadPlanillaClient.VentasValidasDto>of()
                ).stream()
                .collect(Collectors.toMap(LeadPlanillaClient.VentasValidasDto::idEmpleado, LeadPlanillaClient.VentasValidasDto::ventasValidas));
        Map<Long, BigDecimal> adelantos = adelantoSueldoRepository.findByAnioAndMes(anio, mes).stream()
                .collect(Collectors.groupingBy(
                        AdelantoSueldo::getIdEmpleado,
                        Collectors.reducing(BigDecimal.ZERO, AdelantoSueldo::getMonto, BigDecimal::add)
                ));
        Map<Long, BigDecimal> bonosAdicionales = bonoAdicionalEmpleadoRepository.findByAnioAndMes(anio, mes).stream()
                .collect(Collectors.groupingBy(
                        BonoAdicionalEmpleado::getIdEmpleado,
                        Collectors.reducing(BigDecimal.ZERO, BonoAdicionalEmpleado::getMonto, BigDecimal::add)
                ));

        PlanillaGeneral planilla = PlanillaGeneral.builder()
                .anio(anio)
                .mes(mes)
                .tipoPlanilla(TipoPlanilla.REGULAR)
                .estado(Estado.REVISION)
                .moneda("PEN")
                .versionCalculo(1)
                .matrizCalculo(matriz)
                .totalGastoPlanilla(PlanillaPolicyService.money(BigDecimal.ZERO))
                .totalDescuentos(PlanillaPolicyService.money(BigDecimal.ZERO))
                .totalBonificaciones(PlanillaPolicyService.money(BigDecimal.ZERO))
                .cantidadEmpleados(0)
                .build();

        List<PlanillaEmpleado> filas = empleados.stream()
                .map(empleado -> calcularEmpleado(
                        planilla,
                        periodo,
                        empleado,
                        incidencias.getOrDefault(empleado.idEmpleado(), List.of()),
                        ventas.getOrDefault(empleado.idEmpleado(), 0),
                        adelantos.getOrDefault(empleado.idEmpleado(), BigDecimal.ZERO),
                        bonosAdicionales.getOrDefault(empleado.idEmpleado(), BigDecimal.ZERO),
                        matriz
                ))
                .toList();

        planilla.getEmpleados().addAll(filas);
        recalcularTotales(planilla);
        return toResponse(planillaGeneralRepository.save(planilla));
    }

    @Transactional(readOnly = true)
    public PlanillaGeneralResponse obtener(Integer anio, Integer mes) {
        return planillaGeneralRepository.findByAnioAndMesAndTipoPlanilla(anio, mes, TipoPlanilla.REGULAR)
                .map(this::toResponse)
                .orElseThrow(() -> new BillingException(HttpStatus.NOT_FOUND, "No existe planilla calculada para el periodo solicitado"));
    }

    @Transactional
    public PlanillaGeneralResponse aprobar(Long id) {
        PlanillaGeneral planilla = planillaGeneralRepository.findById(id)
                .orElseThrow(() -> new BillingException(HttpStatus.NOT_FOUND, "Planilla no encontrada"));
        if (planilla.getEstado() != Estado.REVISION) {
            throw new BillingException(HttpStatus.CONFLICT, "Solo una planilla en revision puede aprobarse");
        }
        recalcularTotales(planilla);
        planilla.setEstado(Estado.APROBADO);
        planilla.setApprovedAt(java.time.Instant.now(clock));
        planilla.setApprovedBy("SYSTEM");
        return toResponse(planilla);
    }

    @Transactional
    public AdelantoSueldoResponse registrarAdelanto(AdelantoSueldoRequest request) {
        validarPlanillaEditableParaAjuste(request.anio(), request.mes(), "No se puede registrar adelanto en una planilla aprobada o pagada");
        AdelantoSueldo adelanto = AdelantoSueldo.builder()
                .idEmpleado(request.idEmpleado())
                .anio(request.anio())
                .mes(request.mes())
                .monto(PlanillaPolicyService.money(request.monto()))
                .descripcion(request.descripcion())
                .registradoPor("SYSTEM")
                .build();
        return toResponse(adelantoSueldoRepository.save(adelanto));
    }

    @Transactional
    public BonoAdicionalResponse registrarBonoAdicional(BonoAdicionalRequest request) {
        validarPlanillaEditableParaAjuste(request.anio(), request.mes(), "No se puede registrar bono adicional en una planilla aprobada o pagada");
        BonoAdicionalEmpleado bono = BonoAdicionalEmpleado.builder()
                .idEmpleado(request.idEmpleado())
                .anio(request.anio())
                .mes(request.mes())
                .monto(PlanillaPolicyService.money(request.monto()))
                .comentario(request.comentario())
                .registradoPor("SYSTEM")
                .build();
        return toResponse(bonoAdicionalEmpleadoRepository.save(bono));
    }

    @Transactional(readOnly = true)
    public PlanillaAjustesResponse obtenerAjustes(Long idPlanilla) {
        PlanillaGeneral planilla = planillaGeneralRepository.findById(idPlanilla)
                .orElseThrow(() -> new BillingException(HttpStatus.NOT_FOUND, "Planilla no encontrada"));
        List<Long> idsEmpleados = planilla.getEmpleados().stream().map(PlanillaEmpleado::getIdEmpleado).toList();
        List<AdelantoSueldoResponse> adelantos = adelantoSueldoRepository.findByAnioAndMes(planilla.getAnio(), planilla.getMes()).stream()
                .filter(item -> idsEmpleados.contains(item.getIdEmpleado()))
                .map(this::toResponse)
                .toList();
        List<BonoAdicionalResponse> bonos = bonoAdicionalEmpleadoRepository.findByAnioAndMes(planilla.getAnio(), planilla.getMes()).stream()
                .filter(item -> idsEmpleados.contains(item.getIdEmpleado()))
                .map(this::toResponse)
                .toList();
        return new PlanillaAjustesResponse(planilla.getId(), planilla.getAnio(), planilla.getMes(), adelantos, bonos);
    }

    private PlanillaEmpleado calcularEmpleado(
            PlanillaGeneral planilla,
            YearMonth periodo,
            RrhhPlanillaClient.EmpleadoPlanillaDto empleado,
            List<SchedulePlanillaClient.IncidenciaDiaDto> incidencias,
            int ventasValidas,
            BigDecimal adelanto,
            BigDecimal bonoAdicional,
            MatrizCalculoPlanilla matriz
    ) {
        List<TramoTemporal> tramos = empleado.contratos().stream()
                .map(contrato -> crearTramoTemporal(periodo, contrato, incidencias, matriz))
                .sorted(Comparator.comparing(TramoTemporal::fechaDesdeTramo))
                .toList();
        if (tramos.isEmpty()) {
            throw new BillingException(HttpStatus.UNPROCESSABLE_ENTITY, "Empleado sin contratos solapados al periodo: " + empleado.idEmpleado());
        }

        TramoTemporal dominante = tramos.stream()
                .max(Comparator.comparing(TramoTemporal::diasValidos).thenComparing(TramoTemporal::fechaHastaTramo))
                .orElseThrow();
        int tardanzas = tramos.stream().mapToInt(TramoTemporal::tardanzas).sum();
        int faltas = tramos.stream().mapToInt(TramoTemporal::faltas).sum();
        int minutosExtra = tramos.stream().mapToInt(TramoTemporal::minutosExtra).sum();
        int diasValidos = tramos.stream().mapToInt(TramoTemporal::diasValidos).sum();
        BigDecimal sueldoAfecto = sum(tramos, TramoTemporal::sueldoAfecto);
        BigDecimal descuentoTardanzas = sum(tramos, TramoTemporal::descuentoTardanzas);
        BigDecimal descuentoFaltas = sum(tramos, TramoTemporal::descuentoFaltas);
        BigDecimal pagoExtras = sum(tramos, TramoTemporal::pagoExtras);
        BigDecimal bonoProductividad = policy.bonoProductividad(matriz, dominante.modalidad(), ventasValidas);
        BigDecimal bonoPuntualidad = policy.bonoPuntualidad(matriz, dominante.modalidad(), tardanzas);
        BigDecimal bonoCapacitacion = policy.bonoCapacitacion(matriz, empleado.primerContratoInicio() != null
                && YearMonth.from(empleado.primerContratoInicio()).equals(periodo));
        BigDecimal totalDescuento = PlanillaPolicyService.money(descuentoTardanzas.add(descuentoFaltas).add(adelanto));
        BigDecimal totalBonificaciones = PlanillaPolicyService.money(bonoProductividad.add(bonoPuntualidad).add(bonoCapacitacion).add(bonoAdicional).add(pagoExtras));
        BigDecimal remuneracionNeta = PlanillaPolicyService.money(sueldoAfecto.subtract(totalDescuento).add(totalBonificaciones));

        PlanillaEmpleado fila = PlanillaEmpleado.builder()
                .planillaGeneral(planilla)
                .idEmpleado(empleado.idEmpleado())
                .nombres(valor(empleado.nombres()))
                .apellidos(valor(empleado.apellidos()))
                .tipoDocumento(parseTipoDocumento(empleado.tipoDocumento()))
                .numeroDocumento(valor(empleado.numeroDocumento()))
                .modalidadDominante(dominante.modalidad())
                .multipleTramos(tramos.size() > 1)
                .sueldoBasico(dominante.sueldoBasico())
                .diasMes(periodo.lengthOfMonth())
                .diasHabiles(policy.diasHabiles(periodo))
                .pagoDiaHabil(dominante.pagoDiaHabil())
                .fechaIngreso(tramos.stream().map(TramoTemporal::fechaInicioContrato).min(LocalDate::compareTo).orElse(periodo.atDay(1)))
                .fechaBaja(calcularFechaBaja(tramos, periodo))
                .diasValidos(diasValidos)
                .sueldoAfecto(sueldoAfecto)
                .tardanzas(tardanzas)
                .faltasInjustificadas(faltas)
                .descuentoTardanzas(descuentoTardanzas)
                .descuentoFaltas(descuentoFaltas)
                .adelantoSueldo(PlanillaPolicyService.money(adelanto))
                .totalDescuento(totalDescuento)
                .ventasValidas(ventasValidas)
                .bonoProductividad(bonoProductividad)
                .bonoPuntualidad(bonoPuntualidad)
                .bonoCapacitacion(bonoCapacitacion)
                .bonoAdicional(PlanillaPolicyService.money(bonoAdicional))
                .minutosExtras(minutosExtra)
                .pagoExtras(pagoExtras)
                .totalBonificaciones(totalBonificaciones)
                .remuneracionNeta(remuneracionNeta)
                .build();

        List<TramoPlanillaEmpleado> tramosPersistidos = tramos.stream()
                .map(tramo -> tramo.toEntity(fila))
                .toList();
        fila.getTramos().addAll(tramosPersistidos);
        fila.getDetalles().add(detalle(fila, null, Concepto.SUELDO_AFECTO, TipoMovimiento.INGRESO, "Sueldo afecto", null, BigDecimal.valueOf(diasValidos), dominante.pagoDiaHabil(), sueldoAfecto, "BILLING"));
        fila.getDetalles().add(detalle(fila, null, Concepto.DESCUENTO_TARDANZAS, TipoMovimiento.DESCUENTO, "Descuento por tardanzas", null, BigDecimal.valueOf(tardanzas), null, descuentoTardanzas, "SCHEDULE"));
        fila.getDetalles().add(detalle(fila, null, Concepto.DESCUENTO_FALTAS, TipoMovimiento.DESCUENTO, "Descuento por faltas", null, BigDecimal.valueOf(faltas), dominante.pagoDiaHabil(), descuentoFaltas, "SCHEDULE"));
        fila.getDetalles().add(detalle(fila, null, Concepto.ADELANTO_SUELDO, TipoMovimiento.DESCUENTO, "Adelantos de sueldo", null, BigDecimal.ONE, null, adelanto, "BILLING"));
        fila.getDetalles().add(detalle(fila, null, Concepto.BONO_PRODUCTIVIDAD, TipoMovimiento.INGRESO, "Bono de productividad", null, BigDecimal.valueOf(ventasValidas), null, bonoProductividad, "LEAD"));
        fila.getDetalles().add(detalle(fila, null, Concepto.BONO_PUNTUALIDAD, TipoMovimiento.INGRESO, "Bono de puntualidad", null, BigDecimal.valueOf(tardanzas), null, bonoPuntualidad, "SCHEDULE"));
        fila.getDetalles().add(detalle(fila, null, Concepto.BONO_CAPACITACION, TipoMovimiento.INGRESO, "Bono de capacitacion", null, BigDecimal.ONE, null, bonoCapacitacion, "RRHH"));
        fila.getDetalles().add(detalle(fila, null, Concepto.BONO_ADICIONAL, TipoMovimiento.INGRESO, "Bonos adicionales manuales", null, BigDecimal.ONE, null, bonoAdicional, "BILLING"));
        fila.getDetalles().add(detalle(fila, null, Concepto.HORAS_EXTRA, TipoMovimiento.INGRESO, "Pago por horas extra completas", null, BigDecimal.valueOf(Math.floorDiv(minutosExtra, 60)), null, pagoExtras, "SCHEDULE"));
        return fila;
    }

    private TramoTemporal crearTramoTemporal(
            YearMonth periodo,
            RrhhPlanillaClient.ContratoPlanillaDto contrato,
            List<SchedulePlanillaClient.IncidenciaDiaDto> incidencias,
            MatrizCalculoPlanilla matriz
    ) {
        LocalDate inicioMes = periodo.atDay(1);
        LocalDate finMes = periodo.atEndOfMonth();
        LocalDate desde = contrato.fechaInicio().isAfter(inicioMes) ? contrato.fechaInicio() : inicioMes;
        LocalDate hasta = contrato.fechaFin() != null && contrato.fechaFin().isBefore(finMes) ? contrato.fechaFin() : finMes;
        ModalidadTrabajo modalidad = parseModalidad(contrato.modalidad());
        int diasHabiles = policy.diasHabiles(periodo);
        BigDecimal pagoDiaHabil = policy.pagoDiaHabil(contrato.sueldoBasico(), diasHabiles);
        int diasValidos = policy.diasHabilesEntre(desde, hasta);
        List<SchedulePlanillaClient.IncidenciaDiaDto> delTramo = incidencias.stream()
                .filter(incidencia -> !incidencia.fecha().isBefore(desde) && !incidencia.fecha().isAfter(hasta))
                .toList();
        int tardanzas = (int) delTramo.stream().filter(SchedulePlanillaClient.IncidenciaDiaDto::tardanza).count();
        int faltas = (int) delTramo.stream().filter(SchedulePlanillaClient.IncidenciaDiaDto::falta).count();
        int minutosExtra = delTramo.stream().mapToInt(i -> nvl(i.minutosExtra())).sum();
        BigDecimal descuentoTardanzas = delTramo.stream()
                .filter(SchedulePlanillaClient.IncidenciaDiaDto::tardanza)
                .map(i -> policy.descuentoTardanza(matriz, nvl(i.minutosTarde())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal descuentoFaltas = PlanillaPolicyService.money(pagoDiaHabil.multiply(BigDecimal.valueOf(faltas)));
        BigDecimal sueldoAfecto = policy.sueldoAfecto(pagoDiaHabil, diasValidos);
        BigDecimal pagoExtras = policy.pagoExtras(matriz, pagoDiaHabil, modalidad, minutosExtra);
        return new TramoTemporal(
                contrato.idContrato(),
                contrato.fechaInicio(),
                contrato.fechaFin(),
                desde,
                hasta,
                modalidad,
                PlanillaPolicyService.money(contrato.sueldoBasico()),
                policy.horasDia(matriz, modalidad),
                diasValidos,
                pagoDiaHabil,
                sueldoAfecto,
                tardanzas,
                faltas,
                PlanillaPolicyService.money(descuentoTardanzas),
                descuentoFaltas,
                minutosExtra,
                pagoExtras
        );
    }

    private void recalcularTotales(PlanillaGeneral planilla) {
        planilla.setCantidadEmpleados(planilla.getEmpleados().size());
        planilla.setTotalGastoPlanilla(sum(planilla.getEmpleados(), PlanillaEmpleado::getRemuneracionNeta));
        planilla.setTotalDescuentos(sum(planilla.getEmpleados(), PlanillaEmpleado::getTotalDescuento));
        planilla.setTotalBonificaciones(sum(planilla.getEmpleados(), PlanillaEmpleado::getTotalBonificaciones));
    }

    private YearMonth validarPeriodoCerrado(Integer anio, Integer mes) {
        YearMonth periodo = YearMonth.of(anio, mes);
        YearMonth actual = YearMonth.now(ZoneId.of(timezone));
        if (!periodo.isBefore(actual)) {
            throw new BillingException(HttpStatus.BAD_REQUEST, "Solo se puede calcular un mes ya cerrado");
        }
        return periodo;
    }

    private void validarPlanillaEditableParaAjuste(Integer anio, Integer mes, String mensajeCerrada) {
        PlanillaGeneral planilla = planillaGeneralRepository.findByAnioAndMesAndTipoPlanilla(anio, mes, TipoPlanilla.REGULAR)
                .orElseThrow(() -> new BillingException(HttpStatus.NOT_FOUND, "Primero calcula la planilla del periodo para registrar ajustes"));
        if (planilla.getEstado() != Estado.REVISION) {
            throw new BillingException(HttpStatus.CONFLICT, mensajeCerrada);
        }
    }

    private LocalDate calcularFechaBaja(List<TramoTemporal> tramos, YearMonth periodo) {
        boolean continua = tramos.stream().anyMatch(tramo -> tramo.fechaFinContrato() == null || tramo.fechaFinContrato().isAfter(periodo.atEndOfMonth()));
        if (continua) {
            return null;
        }
        return tramos.stream()
                .map(TramoTemporal::fechaFinContrato)
                .filter(Objects::nonNull)
                .max(LocalDate::compareTo)
                .orElse(null);
    }

    private DetallePlanilla detalle(PlanillaEmpleado fila, TramoPlanillaEmpleado tramo, Concepto concepto, TipoMovimiento tipo, String descripcion, LocalDate fecha, BigDecimal cantidad, BigDecimal tarifa, BigDecimal monto, String fuente) {
        return DetallePlanilla.builder()
                .planillaEmpleado(fila)
                .tramoPlanillaEmpleado(tramo)
                .concepto(concepto)
                .tipoMovimiento(tipo)
                .descripcion(descripcion)
                .fechaReferencia(fecha)
                .cantidad(cantidad)
                .tarifa(tarifa)
                .monto(PlanillaPolicyService.money(monto))
                .fuente(fuente)
                .build();
    }

    private PlanillaGeneralResponse toResponse(PlanillaGeneral planilla) {
        return new PlanillaGeneralResponse(
                planilla.getId(),
                planilla.getAnio(),
                planilla.getMes(),
                planilla.getTipoPlanilla(),
                planilla.getEstado(),
                planilla.getMoneda(),
                planilla.getVersionCalculo(),
                planilla.getTotalGastoPlanilla(),
                planilla.getTotalDescuentos(),
                planilla.getTotalBonificaciones(),
                planilla.getCantidadEmpleados(),
                planilla.getApprovedAt(),
                planilla.getApprovedBy(),
                matrizPlanillaService.toResponse(planilla.getMatrizCalculo()),
                planilla.getEmpleados().stream().map(this::toResponse).toList()
        );
    }

    private PlanillaEmpleadoResponse toResponse(PlanillaEmpleado empleado) {
        return new PlanillaEmpleadoResponse(
                empleado.getId(),
                empleado.getIdEmpleado(),
                empleado.getNombres(),
                empleado.getApellidos(),
                empleado.getTipoDocumento(),
                empleado.getNumeroDocumento(),
                empleado.getModalidadDominante(),
                empleado.isMultipleTramos(),
                empleado.getSueldoBasico(),
                empleado.getDiasMes(),
                empleado.getDiasHabiles(),
                empleado.getPagoDiaHabil(),
                empleado.getFechaIngreso(),
                empleado.getFechaBaja(),
                empleado.getDiasValidos(),
                empleado.getSueldoAfecto(),
                empleado.getTardanzas(),
                empleado.getFaltasInjustificadas(),
                empleado.getDescuentoTardanzas(),
                empleado.getDescuentoFaltas(),
                empleado.getAdelantoSueldo(),
                empleado.getTotalDescuento(),
                empleado.getVentasValidas(),
                empleado.getBonoProductividad(),
                empleado.getBonoPuntualidad(),
                empleado.getBonoCapacitacion(),
                empleado.getBonoAdicional(),
                empleado.getMinutosExtras(),
                empleado.getPagoExtras(),
                empleado.getTotalBonificaciones(),
                empleado.getRemuneracionNeta(),
                empleado.getTramos().stream().map(this::toResponse).toList(),
                empleado.getDetalles().stream().map(this::toResponse).toList()
        );
    }

    private TramoPlanillaEmpleadoResponse toResponse(TramoPlanillaEmpleado tramo) {
        return new TramoPlanillaEmpleadoResponse(
                tramo.getId(),
                tramo.getIdContrato(),
                tramo.getFechaInicioContrato(),
                tramo.getFechaFinContrato(),
                tramo.getFechaDesdeTramo(),
                tramo.getFechaHastaTramo(),
                tramo.getModalidadTrabajo(),
                tramo.getSueldoBasico(),
                tramo.getHorasDia(),
                tramo.getDiasValidos(),
                tramo.getPagoDiaHabil(),
                tramo.getSueldoAfecto(),
                tramo.getTardanzas(),
                tramo.getFaltasInjustificadas(),
                tramo.getDescuentoTardanzas(),
                tramo.getDescuentoFaltas(),
                tramo.getMinutosExtras(),
                tramo.getPagoExtras()
        );
    }

    private DetallePlanillaResponse toResponse(DetallePlanilla detalle) {
        return new DetallePlanillaResponse(
                detalle.getId(),
                detalle.getTramoPlanillaEmpleado() == null ? null : detalle.getTramoPlanillaEmpleado().getId(),
                detalle.getConcepto(),
                detalle.getTipoMovimiento(),
                detalle.getDescripcion(),
                detalle.getFechaReferencia(),
                detalle.getCantidad(),
                detalle.getTarifa(),
                detalle.getMonto(),
                detalle.getFuente()
        );
    }

    private AdelantoSueldoResponse toResponse(AdelantoSueldo adelanto) {
        return new AdelantoSueldoResponse(
                adelanto.getId(),
                adelanto.getIdEmpleado(),
                adelanto.getAnio(),
                adelanto.getMes(),
                adelanto.getMonto(),
                adelanto.getDescripcion(),
                adelanto.getRegistradoPor(),
                adelanto.getRegistradoAt()
        );
    }

    private BonoAdicionalResponse toResponse(BonoAdicionalEmpleado bono) {
        return new BonoAdicionalResponse(
                bono.getId(),
                bono.getIdEmpleado(),
                bono.getAnio(),
                bono.getMes(),
                bono.getMonto(),
                bono.getComentario(),
                bono.getRegistradoPor(),
                bono.getRegistradoAt()
        );
    }

    private ModalidadTrabajo parseModalidad(String value) {
        return switch (value) {
            case "PART_TIME", "PARTTIME" -> ModalidadTrabajo.PARTTIME;
            case "SEMI_FULL", "SEMIFULLTIME" -> ModalidadTrabajo.SEMIFULLTIME;
            case "FULL_TIME", "FULLTIME" -> ModalidadTrabajo.FULLTIME;
            case "SUPER_FULL", "SUPERFULLTIME" -> ModalidadTrabajo.SUPERFULLTIME;
            default -> throw new BillingException(HttpStatus.UNPROCESSABLE_ENTITY, "Modalidad no soportada para planilla: " + value);
        };
    }

    private TipoDocumento parseTipoDocumento(String value) {
        try {
            return TipoDocumento.valueOf(value);
        } catch (Exception ignored) {
            return TipoDocumento.DNI;
        }
    }

    private int nvl(Integer value) {
        return value == null ? 0 : value;
    }

    private String valor(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private <T> BigDecimal sum(List<T> items, Function<T, BigDecimal> mapper) {
        return PlanillaPolicyService.money(items.stream().map(mapper).reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    private record TramoTemporal(
            Long idContrato,
            LocalDate fechaInicioContrato,
            LocalDate fechaFinContrato,
            LocalDate fechaDesdeTramo,
            LocalDate fechaHastaTramo,
            ModalidadTrabajo modalidad,
            BigDecimal sueldoBasico,
            Integer horasDia,
            Integer diasValidos,
            BigDecimal pagoDiaHabil,
            BigDecimal sueldoAfecto,
            Integer tardanzas,
            Integer faltas,
            BigDecimal descuentoTardanzas,
            BigDecimal descuentoFaltas,
            Integer minutosExtra,
            BigDecimal pagoExtras
    ) {
        TramoPlanillaEmpleado toEntity(PlanillaEmpleado fila) {
            return TramoPlanillaEmpleado.builder()
                    .planillaEmpleado(fila)
                    .idContrato(idContrato)
                    .fechaInicioContrato(fechaInicioContrato)
                    .fechaFinContrato(fechaFinContrato)
                    .fechaDesdeTramo(fechaDesdeTramo)
                    .fechaHastaTramo(fechaHastaTramo)
                    .modalidadTrabajo(modalidad)
                    .sueldoBasico(sueldoBasico)
                    .horasDia(horasDia)
                    .diasValidos(diasValidos)
                    .pagoDiaHabil(pagoDiaHabil)
                    .sueldoAfecto(sueldoAfecto)
                    .tardanzas(tardanzas)
                    .faltasInjustificadas(faltas)
                    .descuentoTardanzas(descuentoTardanzas)
                    .descuentoFaltas(descuentoFaltas)
                    .minutosExtras(minutosExtra)
                    .pagoExtras(pagoExtras)
                    .build();
        }
    }
}
