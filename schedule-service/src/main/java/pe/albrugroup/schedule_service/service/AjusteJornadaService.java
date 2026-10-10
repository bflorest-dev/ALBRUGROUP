package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.configuration.ScheduleEngineProperties;
import pe.albrugroup.schedule_service.entity.AjusteJornada;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.DiaNoLaborable;
import pe.albrugroup.schedule_service.entity.ExcepcionHorario;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.HorarioDetalle;
import pe.albrugroup.schedule_service.entity.enums.AlcanceDiaNoLaborable;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.EstadoAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.OrigenAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.RazonAjuste;
import pe.albrugroup.schedule_service.entity.enums.TipoExcepcionHorario;
import pe.albrugroup.schedule_service.entity.request.horario.AjusteJornadaRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarAjusteRequest;
import pe.albrugroup.schedule_service.entity.response.horario.*;
import pe.albrugroup.schedule_service.exception.BadRequestException;
import pe.albrugroup.schedule_service.exception.NotFoundException;
import pe.albrugroup.schedule_service.repository.AjusteJornadaRepository;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.DiaNoLaborableRepository;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AjusteJornadaService {

    private final AjusteJornadaRepository ajusteRepository;
    private final HorarioRepository horarioRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final ExcepcionHorarioRepository excepcionHorarioRepository;
    private final DiaNoLaborableRepository diaNoLaborableRepository;
    private final JornadaEfectivaResolver jornadaResolver;
    private final AttendanceRealtimeNotifier realtimeNotifier;
    private final CurrentUser currentUser;
    private final ScheduleEngineProperties properties;
    private final Clock operationalClock;

    @Transactional(readOnly = true)
    public JornadaEfectivaResponse getJornada(Long idEmpleado, LocalDate fecha) {
        return jornadaResolver.resolver(idEmpleado, fecha == null ? LocalDate.now(operationalClock) : fecha);
    }

    @Transactional(readOnly = true)
    public JornadaEfectivaPeriodoResponse getJornadaPeriodo(Long idEmpleado, LocalDate desde, LocalDate hasta) {
        validarPeriodo(desde, hasta);

        List<Horario> horarios = horarioRepository.findHorariosEnRango(idEmpleado, desde, hasta);
        List<Long> idHorarios = horarios.stream().map(Horario::getId).toList();
        List<AjusteJornada> ajustes = ajusteRepository
                .findByIdEmpleadoAndFechaOperativaBetweenAndEstado(
                        idEmpleado, desde, hasta, EstadoAjusteJornada.ACTIVO);
        List<ExcepcionHorario> excepciones = idHorarios.isEmpty()
                ? List.of()
                : excepcionHorarioRepository.findByHorarioIdInAndFechaBetween(idHorarios, desde, hasta);
        List<DiaNoLaborable> diasNoLaborables = diaNoLaborableRepository.findByFechaBetween(desde, hasta);
        List<Asistencia> asistencias = asistenciaRepository
                .findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(idEmpleado, desde, hasta);

        Map<LocalDate, List<AjusteJornada>> ajustesPorFecha = ajustes.stream()
                .collect(Collectors.groupingBy(AjusteJornada::getFechaOperativa));
        Map<Long, Map<LocalDate, ExcepcionHorario>> excepcionesPorHorario = excepciones.stream()
                .collect(Collectors.groupingBy(
                        excepcion -> excepcion.getHorario().getId(),
                        Collectors.toMap(ExcepcionHorario::getFecha, Function.identity())
                ));
        Map<LocalDate, List<DiaNoLaborable>> diasNoLaborablesPorFecha = diasNoLaborables.stream()
                .collect(Collectors.groupingBy(DiaNoLaborable::getFecha));
        Map<LocalDate, Asistencia> asistenciasPorFecha = asistencias.stream()
                .collect(Collectors.toMap(Asistencia::getFecha, Function.identity()));

        List<JornadaEfectivaPeriodoDiaResponse> dias = new ArrayList<>();
        for (LocalDate fecha = desde; !fecha.isAfter(hasta); fecha = fecha.plusDays(1)) {
            Horario horario = horarioVigente(horarios, fecha);
            dias.add(construirDiaPeriodo(
                    fecha,
                    horario,
                    ajustesPorFecha.getOrDefault(fecha, List.of()),
                    horario == null
                            ? null
                            : excepcionesPorHorario
                            .getOrDefault(horario.getId(), Map.of())
                            .get(fecha),
                    resolverDiaNoLaborable(diasNoLaborablesPorFecha.getOrDefault(fecha, List.of()), idEmpleado),
                    asistenciasPorFecha.get(fecha)
            ));
        }

        return JornadaEfectivaPeriodoResponse.builder()
                .idEmpleado(idEmpleado)
                .desde(desde)
                .hasta(hasta)
                .dias(dias)
                .build();
    }

    private void validarPeriodo(LocalDate desde, LocalDate hasta) {
        if (desde == null || hasta == null) {
            throw new BadRequestException("Debes indicar el inicio y fin del periodo");
        }
        if (desde.isAfter(hasta)) {
            throw new BadRequestException("El inicio del periodo no puede ser posterior al fin");
        }
        if (ChronoUnit.DAYS.between(desde, hasta) + 1 > 7) {
            throw new BadRequestException("El periodo no puede superar siete días");
        }
    }

    private JornadaEfectivaPeriodoDiaResponse construirDiaPeriodo(
            LocalDate fecha,
            Horario horario,
            List<AjusteJornada> ajustes,
            ExcepcionHorario excepcion,
            DiaNoLaborable diaNoLaborable,
            Asistencia asistencia
    ) {
        if (horario == null) {
            return JornadaEfectivaPeriodoDiaResponse.builder()
                    .fecha(fecha)
                    .esHoy(esHoy(fecha))
                    .estado("SIN_HORARIO")
                    .jornadaEfectiva(JornadaPeriodoEfectivaResponse.builder()
                            .laborable(false)
                            .tramos(List.of())
                            .build())
                    .almuerzo(AlmuerzoPeriodoResponse.builder()
                            .modificado(false)
                            .build())
                    .cambios(List.of())
                    .build();
        }

        HorarioDetalle detalleBase = detalleBase(horario, fecha);
        JornadaEfectivaResponse efectiva = jornadaResolver.resolver(
                horario, fecha, ajustes, diaNoLaborable, excepcion);
        boolean laborableEfectiva = !efectiva.getTramos().isEmpty();
        HorarioBasePeriodoResponse horarioBase = toHorarioBase(detalleBase);
        AlmuerzoPeriodoResponse almuerzo = resolverAlmuerzo(
                detalleBase, excepcion, asistencia, laborableEfectiva);

        return JornadaEfectivaPeriodoDiaResponse.builder()
                .fecha(fecha)
                .esHoy(esHoy(fecha))
                .idHorario(horario.getId())
                .estado(estadoDia(detalleBase, laborableEfectiva, diaNoLaborable, excepcion))
                .horarioBase(horarioBase)
                .jornadaEfectiva(toJornadaPeriodoEfectiva(efectiva, ajustes))
                .almuerzo(almuerzo)
                .cambios(construirCambios(fecha, ajustes, excepcion, diaNoLaborable, asistencia, almuerzo))
                .build();
    }

    private boolean esHoy(LocalDate fecha) {
        return fecha.equals(LocalDate.now(operationalClock));
    }

    private Horario horarioVigente(List<Horario> horarios, LocalDate fecha) {
        return horarios.stream()
                .filter(horario -> !horario.getFechaInicio().isAfter(fecha))
                .filter(horario -> horario.getFechaFin() == null || !horario.getFechaFin().isBefore(fecha))
                .max(Comparator.comparing(Horario::getFechaInicio))
                .orElse(null);
    }

    private DiaNoLaborable resolverDiaNoLaborable(List<DiaNoLaborable> candidatos, Long idEmpleado) {
        return candidatos.stream()
                .filter(item -> item.getAlcance() == AlcanceDiaNoLaborable.EMPLEADO)
                .filter(item -> Objects.equals(item.getRefId(), idEmpleado))
                .findFirst()
                .orElseGet(() -> candidatos.stream()
                        .filter(item -> item.getAlcance() == AlcanceDiaNoLaborable.GLOBAL)
                        .findFirst()
                        .orElse(null));
    }

    private HorarioDetalle detalleBase(Horario horario, LocalDate fecha) {
        Dia dia = JornadaEfectivaResolver.mapearDia(fecha.getDayOfWeek());
        return horario.getDetalles().stream()
                .filter(detalle -> detalle.getDia() == dia)
                .findFirst()
                .orElseThrow(() -> new NotFoundException("No existe detalle de horario para el dia", dia));
    }

    private HorarioBasePeriodoResponse toHorarioBase(HorarioDetalle detalle) {
        boolean laborable = Boolean.TRUE.equals(detalle.getLaborable());
        return HorarioBasePeriodoResponse.builder()
                .laborable(laborable)
                .inicio(laborable ? detalle.getHoraEntrada() : null)
                .fin(laborable ? detalle.getHoraSalida() : null)
                .almuerzoInicio(laborable ? detalle.getInicioAlmuerzo() : null)
                .almuerzoFin(laborable ? detalle.getFinAlmuerzo() : null)
                .build();
    }

    private JornadaPeriodoEfectivaResponse toJornadaPeriodoEfectiva(
            JornadaEfectivaResponse efectiva,
            List<AjusteJornada> ajustes
    ) {
        Map<Long, AjusteJornada> ajustesPorId = ajustes.stream()
                .filter(ajuste -> ajuste.getId() != null)
                .collect(Collectors.toMap(AjusteJornada::getId, Function.identity()));
        List<TramoJornadaPeriodoResponse> tramos = efectiva.getTramos().stream()
                .map(tramo -> {
                    AjusteJornada ajuste = tramo.getIdAjuste() == null
                            ? null
                            : ajustesPorId.get(tramo.getIdAjuste());
                    return TramoJornadaPeriodoResponse.builder()
                            .idAjuste(tramo.getIdAjuste())
                            .inicio(tramo.getInicio())
                            .fin(tramo.getFin())
                            .origen(tramo.getOrigen())
                            .razon(ajuste == null ? null : ajuste.getRazon())
                            .esBaseEfectiva(tramo.getBase())
                            .motivo(ajuste == null ? tramo.getMotivo() : ajuste.getMotivo())
                            .build();
                })
                .toList();
        return JornadaPeriodoEfectivaResponse.builder()
                .laborable(!tramos.isEmpty())
                .tramos(tramos)
                .build();
    }

    private String estadoDia(
            HorarioDetalle detalleBase,
            boolean laborableEfectiva,
            DiaNoLaborable diaNoLaborable,
            ExcepcionHorario excepcion
    ) {
        if (laborableEfectiva) {
            return "CON_HORARIO";
        }
        if (!Boolean.TRUE.equals(detalleBase.getLaborable()) && diaNoLaborable == null && excepcion == null) {
            return "DESCANSO_BASE";
        }
        return "DIA_LIBRE";
    }

    private AlmuerzoPeriodoResponse resolverAlmuerzo(
            HorarioDetalle detalleBase,
            ExcepcionHorario excepcion,
            Asistencia asistencia,
            boolean laborableEfectiva
    ) {
        LocalTime baseInicio = Boolean.TRUE.equals(detalleBase.getLaborable())
                ? detalleBase.getInicioAlmuerzo()
                : null;
        LocalTime baseFin = Boolean.TRUE.equals(detalleBase.getLaborable())
                ? detalleBase.getFinAlmuerzo()
                : null;
        LocalTime efectivoInicio = baseInicio;
        LocalTime efectivoFin = baseFin;
        String fuente = null;

        if (laborableEfectiva) {
            if (asistencia != null
                    && (asistencia.getInicioAlmuerzoProgramado() != null
                    || asistencia.getFinAlmuerzoProgramado() != null)) {
                efectivoInicio = asistencia.getInicioAlmuerzoProgramado();
                efectivoFin = asistencia.getFinAlmuerzoProgramado();
                fuente = "ASISTENCIA";
            } else if (excepcion != null
                    && (excepcion.getInicioAlmuerzo() != null || excepcion.getFinAlmuerzo() != null)) {
                efectivoInicio = excepcion.getInicioAlmuerzo();
                efectivoFin = excepcion.getFinAlmuerzo();
                fuente = "EXCEPCION_HORARIO";
            }
        } else {
            efectivoInicio = null;
            efectivoFin = null;
        }

        boolean modificado = !Objects.equals(baseInicio, efectivoInicio)
                || !Objects.equals(baseFin, efectivoFin);
        return AlmuerzoPeriodoResponse.builder()
                .inicioBase(baseInicio)
                .finBase(baseFin)
                .inicioEfectivo(efectivoInicio)
                .finEfectivo(efectivoFin)
                .modificado(modificado)
                .fuente(modificado ? fuente : null)
                .build();
    }

    private List<CambioJornadaPeriodoResponse> construirCambios(
            LocalDate fecha,
            List<AjusteJornada> ajustes,
            ExcepcionHorario excepcion,
            DiaNoLaborable diaNoLaborable,
            Asistencia asistencia,
            AlmuerzoPeriodoResponse almuerzo
    ) {
        List<CambioJornadaPeriodoResponse> cambios = new ArrayList<>();
        ajustes.forEach(ajuste -> cambios.add(CambioJornadaPeriodoResponse.builder()
                .id(ajuste.getId())
                .tipo("AJUSTE_JORNADA")
                .codigo(ajuste.getRazon() == null ? ajuste.getOrigen().name() : ajuste.getRazon().name())
                .fuente("AJUSTE_JORNADA")
                .inicio(ajuste.getInicio())
                .fin(ajuste.getFin())
                .laborable(true)
                .origen(ajuste.getOrigen())
                .razon(ajuste.getRazon())
                .motivo(ajuste.getMotivo())
                .build()));

        if (diaNoLaborable != null) {
            cambios.add(CambioJornadaPeriodoResponse.builder()
                    .id(diaNoLaborable.getId())
                    .tipo("DIA_NO_LABORABLE")
                    .codigo(diaNoLaborable.getTipo().name())
                    .fuente("DIA_NO_LABORABLE")
                    .laborable(diaNoLaborable.getLaborable())
                    .tipoDiaNoLaborable(diaNoLaborable.getTipo())
                    .alcance(diaNoLaborable.getAlcance())
                    .motivo(diaNoLaborable.getMotivo())
                    .build());
        }

        if (excepcion != null) {
            cambios.add(CambioJornadaPeriodoResponse.builder()
                    .id(excepcion.getId())
                    .tipo("EXCEPCION_HORARIO")
                    .codigo(excepcion.getTipo().name())
                    .fuente("EXCEPCION_HORARIO")
                    .inicio(fechaHora(fecha, excepcion.getHoraEntrada()))
                    .fin(fechaHora(fecha, excepcion.getHoraSalida()))
                    .almuerzoInicio(excepcion.getInicioAlmuerzo())
                    .almuerzoFin(excepcion.getFinAlmuerzo())
                    .laborable(excepcion.getLaborable())
                    .tipoExcepcion(excepcion.getTipo())
                    .motivo(excepcion.getMotivo())
                    .build());
        }

        if (Boolean.TRUE.equals(almuerzo.getModificado())) {
            cambios.add(CambioJornadaPeriodoResponse.builder()
                    .id(asistencia == null ? null : asistencia.getId())
                    .tipo("CAMBIO_ALMUERZO")
                    .codigo("ALMUERZO_PROGRAMADO")
                    .fuente(almuerzo.getFuente())
                    .almuerzoInicio(almuerzo.getInicioEfectivo())
                    .almuerzoFin(almuerzo.getFinEfectivo())
                    .motivo("Almuerzo programado modificado")
                    .build());
        }

        cambios.sort(Comparator.comparing(
                CambioJornadaPeriodoResponse::getInicio,
                Comparator.nullsLast(Comparator.naturalOrder())
        ));
        return cambios;
    }

    private LocalDateTime fechaHora(LocalDate fecha, java.time.LocalTime hora) {
        return hora == null ? null : LocalDateTime.of(fecha, hora);
    }

    @Transactional(readOnly = true)
    public PreviewAjusteJornadaResponse preview(Long idEmpleado, AjusteJornadaRequest request) {
        ValidatedAdjustment validated = validarYNormalizar(idEmpleado, request);
        List<AjusteJornada> activos = ajusteRepository
                .findByIdEmpleadoAndFechaOperativaAndEstadoOrderByInicioAsc(
                        idEmpleado, validated.fecha(), EstadoAjusteJornada.ACTIVO);
        return construirPreview(idEmpleado, request, validated, activos);
    }

    @Transactional
    public AjusteJornadaResponse registrar(Long idEmpleado, AjusteJornadaRequest request) {
        if (!properties.enabledForNewWrites()) {
            throw new BadRequestException("El nuevo registro de ajustes aun no esta habilitado");
        }
        ValidatedAdjustment validated = validarYNormalizar(idEmpleado, request);
        horarioRepository.findByIdForUpdate(validated.horario().getId())
                .orElseThrow(() -> new NotFoundException(Horario.class, validated.horario().getId()));
        List<AjusteJornada> activos = ajusteRepository
                .findForUpdateByIdEmpleadoAndFechaOperativaAndEstado(
                        idEmpleado, validated.fecha(), EstadoAjusteJornada.ACTIVO);
        List<AjusteJornada> reemplazados = activos.stream()
                .filter(item -> JornadaEfectivaResolver.overlaps(
                        item.getInicio(), item.getFin(), validated.inicio(), validated.fin()))
                .toList();

        AjusteJornada nuevo = ajusteRepository.save(AjusteJornada.builder()
                .idEmpleado(idEmpleado)
                .horario(validated.horario())
                .fechaOperativa(validated.fecha())
                .inicio(validated.inicio())
                .fin(validated.fin())
                .estado(EstadoAjusteJornada.ACTIVO)
                .origen(validated.origen())
                .motivo(request.getMotivo().trim())
                .creadoPor(currentUser.empleadoID())
                .build());

        reemplazados.forEach(anterior -> {
            anterior.setEstado(EstadoAjusteJornada.REEMPLAZADO);
            anterior.setReemplazadoPor(nuevo);
        });
        ajusteRepository.saveAll(reemplazados);
        actualizarTramoActivo(idEmpleado, validated);
        publicarCambio(idEmpleado, validated.fecha());
        return toResponse(nuevo);
    }

    /**
     * Registro de ajuste v2: con RAZON explicita + autorizacion fina (rol + razon + limite). Convive con
     * {@link #registrar}. La mecanica (origen, overlap-replace) se reusa; se agrega razon y rolAutor.
     * El efecto en la marcacion (refresco de snapshot / horas extra) se maneja en 3.2.b.
     */
    @Transactional
    public AjusteJornadaResponse registrarV2(Long idEmpleado, RegistrarAjusteRequest request) {
        AjusteJornadaRequest base = AjusteJornadaRequest.builder()
                .inicio(request.getInicio()).fin(request.getFin()).motivo(request.getMotivo()).build();
        ValidatedAdjustment validated = validarYNormalizar(idEmpleado, base);

        // Desplazamiento del base (para el limite del corrimiento por supervisor).
        JornadaEfectivaResolver.BaseDiaria baseDiaria = jornadaResolver.resolverBase(validated.horario(), validated.fecha());
        long desplazamientoMin = baseDiaria.laborable() && baseDiaria.inicio() != null
                ? Math.abs(Duration.between(baseDiaria.inicio(), validated.inicio()).toMinutes())
                : 0;
        validarAutorizacionAjuste(request.getRazon(), desplazamientoMin);
        if (request.getRazon() == RazonAjuste.COMPENSACION) {
            validarCompensacion(idEmpleado, validated);
        }

        horarioRepository.findByIdForUpdate(validated.horario().getId())
                .orElseThrow(() -> new NotFoundException(Horario.class, validated.horario().getId()));
        List<AjusteJornada> activos = ajusteRepository
                .findForUpdateByIdEmpleadoAndFechaOperativaAndEstado(
                        idEmpleado, validated.fecha(), EstadoAjusteJornada.ACTIVO);
        List<AjusteJornada> reemplazados = activos.stream()
                .filter(item -> JornadaEfectivaResolver.overlaps(
                        item.getInicio(), item.getFin(), validated.inicio(), validated.fin()))
                .toList();

        // Defensa en profundidad (el frontend ya lo impide): un ajuste ADITIVO (horas extra / compensacion)
        // NO puede solaparse con el horario base ni con otro tramo activo. El solape solo es valido para el
        // corrimiento (REEMPLAZO_BASE), que reemplaza el base a proposito. Sin esto, un pedido de horas extra
        // que se solapa se reclasificaba silenciosamente como corrimiento y pisaba el base.
        boolean aditiva = request.getRazon() == RazonAjuste.AMPLIACION_OPERATIVA
                || request.getRazon() == RazonAjuste.COMPENSACION;
        if (aditiva) {
            if (validated.origen() == OrigenAjusteJornada.REEMPLAZO_BASE) {
                throw new BadRequestException(
                        "Un tramo de horas extra o compensación no puede solaparse con el horario base");
            }
            if (!reemplazados.isEmpty()) {
                throw new BadRequestException(
                        "El tramo no puede solaparse con otro tramo ya registrado ese día");
            }
        }

        AjusteJornada nuevo = ajusteRepository.save(AjusteJornada.builder()
                .idEmpleado(idEmpleado)
                .horario(validated.horario())
                .fechaOperativa(validated.fecha())
                .inicio(validated.inicio())
                .fin(validated.fin())
                .estado(EstadoAjusteJornada.ACTIVO)
                .origen(validated.origen())
                .razon(request.getRazon())
                .rolAutor(currentUser.rolActivo())
                .motivo(request.getMotivo().trim())
                .creadoPor(currentUser.empleadoID())
                .build());

        reemplazados.forEach(anterior -> {
            anterior.setEstado(EstadoAjusteJornada.REEMPLAZADO);
            anterior.setReemplazadoPor(nuevo);
        });
        ajusteRepository.saveAll(reemplazados);
        publicarCambio(idEmpleado, validated.fecha());
        return toResponse(nuevo);
    }

    /**
     * Autorizacion fina por razon (Fork 6): el permiso grueso EXTEND_HORARIO ya se valido en el
     * controller; aqui se aplican las reglas de rol + limite que un permiso booleano no expresa.
     */
    private void validarAutorizacionAjuste(RazonAjuste razon, long desplazamientoMin) {
        switch (razon) {
            case AMPLIACION_OPERATIVA -> { /* cualquiera con EXTEND_HORARIO */ }
            case CORRIMIENTO_COMPENSABLE -> {
                if (!currentUser.tienePermiso("AJUSTAR_JORNADA_COMPENSABLE")) {
                    throw new BadRequestException("No cuenta con permiso para aplicar una tardanza compensable");
                }
                if (desplazamientoMin > 60
                        && !currentUser.tienePermiso("AJUSTAR_JORNADA_SIN_LIMITE")) {
                    throw new BadRequestException("El corrimiento supera el límite permitido de 1 hora");
                }
            }
            case CORRIMIENTO_JUSTIFICADA -> {
                if (!currentUser.tienePermiso("AJUSTAR_JORNADA_JUSTIFICADA")) {
                    throw new BadRequestException("No cuenta con permiso para aplicar una tardanza justificada");
                }
            }
            case COMPENSACION -> {
                if (!currentUser.tienePermiso("PROGRAMAR_COMPENSACION")) {
                    throw new BadRequestException("No cuenta con permiso para programar horas de compensación");
                }
            }
        }
    }

    /**
     * Precondicion de compensacion (§2.1): tramo ADITIVO (no reemplaza el base), el empleado DEBE horas
     * ese mes, y lo programado no excede el deficit pendiente. El deficit se DERIVA de los balances
     * diarios negativos del mes; lo ya reservado por otras compensaciones activas se descuenta. Regla
     * mensual: el deficit se calcula sobre el mes de la fecha, asi que compensar en un mes sin deficit
     * (p. ej. el mes siguiente) se rechaza solo.
     */
    private void validarCompensacion(Long idEmpleado, ValidatedAdjustment validated) {
        if (validated.origen() == OrigenAjusteJornada.REEMPLAZO_BASE) {
            throw new BadRequestException("La compensacion se agrega fuera del horario; no reemplaza el base");
        }
        java.time.YearMonth mes = java.time.YearMonth.from(validated.fecha());
        int deficitBruto = deficitBrutoMes(idEmpleado, mes);
        if (deficitBruto <= 0) {
            throw new BadRequestException("El empleado no debe horas este mes; no hay deficit que compensar");
        }
        int pendiente = deficitBruto - compensacionPlaneadaMes(idEmpleado, mes);
        if (pendiente <= 0) {
            throw new BadRequestException("El deficit del mes ya esta cubierto por compensaciones programadas");
        }
        int nuevo = (int) Duration.between(validated.inicio(), validated.fin()).toMinutes();
        if (nuevo > pendiente) {
            throw new BadRequestException(
                    "La compensacion (" + nuevo + " min) excede el deficit pendiente del mes (" + pendiente + " min)");
        }
    }

    /** Deficit del mes en minutos (positivo): suma de los balances diarios negativos. */
    private int deficitBrutoMes(Long idEmpleado, java.time.YearMonth mes) {
        return asistenciaRepository
                .findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(idEmpleado, mes.atDay(1), mes.atEndOfMonth()).stream()
                .mapToInt(a -> Math.max(-safe(a.getMinutosBalance()), 0))
                .sum();
    }

    /** Minutos ya reservados por tramos de COMPENSACION activos del mes (por su ventana programada). */
    private int compensacionPlaneadaMes(Long idEmpleado, java.time.YearMonth mes) {
        return ajusteRepository
                .findByIdEmpleadoAndFechaOperativaBetweenAndEstado(
                        idEmpleado, mes.atDay(1), mes.atEndOfMonth(), EstadoAjusteJornada.ACTIVO).stream()
                .filter(a -> a.getRazon() == RazonAjuste.COMPENSACION)
                .mapToInt(a -> (int) Duration.between(a.getInicio(), a.getFin()).toMinutes())
                .sum();
    }

    private int safe(Integer valor) {
        return valor == null ? 0 : valor;
    }

    @Transactional(readOnly = true)
    public List<AjusteJornadaResponse> listar(Long idEmpleado, LocalDate fecha) {
        LocalDate consulta = fecha == null ? LocalDate.now(operationalClock) : fecha;
        return ajusteRepository.findByIdEmpleadoAndFechaOperativaOrderByCreatedAtDesc(idEmpleado, consulta)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public AjusteJornadaResponse cancelar(Long idEmpleado, Long idAjuste) {
        AjusteJornada ajuste = ajusteRepository.findByIdAndIdEmpleado(idAjuste, idEmpleado)
                .orElseThrow(() -> new NotFoundException(AjusteJornada.class, idAjuste));
        if (ajuste.getEstado() != EstadoAjusteJornada.ACTIVO) {
            throw new BadRequestException("El ajuste ya no esta activo");
        }
        Asistencia asistencia = asistenciaRepository
                .findByIdEmpleadoAndFecha(idEmpleado, ajuste.getFechaOperativa()).orElse(null);
        if (asistencia != null && asistencia.getFechaHoraIngreso() != null
                && asistencia.getFechaHoraSalida() == null
                && JornadaEfectivaResolver.overlaps(
                ajuste.getInicio(), ajuste.getFin(),
                LocalDateTime.of(ajuste.getFechaOperativa(), asistencia.getEntradaProgramada()),
                LocalDateTime.of(ajuste.getFechaOperativa(), asistencia.getSalidaProgramada()))) {
            throw new BadRequestException("No se puede cancelar el tramo que el empleado esta trabajando");
        }
        ajuste.setEstado(EstadoAjusteJornada.CANCELADO);
        AjusteJornada saved = ajusteRepository.save(ajuste);
        publicarCambio(idEmpleado, ajuste.getFechaOperativa());
        return toResponse(saved);
    }

    /**
     * Restablece una fecha sin tocar marcaciones reales ni reglas globales.
     * La validacion de la asistencia activa se hace antes de cualquier escritura para que la operacion
     * sea atomica si el tramo esta siendo trabajado.
     */
    @Transactional
    public void restablecerDia(Long idEmpleado, LocalDate fecha) {
        LocalDate hoy = LocalDate.now(operationalClock);
        if (fecha == null) {
            throw new BadRequestException("Debes indicar la fecha que deseas restablecer");
        }
        if (fecha.isBefore(hoy)) {
            throw new BadRequestException("Solo puedes restablecer hoy o una fecha futura");
        }

        List<AjusteJornada> activos = ajusteRepository
                .findForUpdateByIdEmpleadoAndFechaOperativaAndEstado(
                        idEmpleado, fecha, EstadoAjusteJornada.ACTIVO);
        Asistencia asistencia = asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, fecha).orElse(null);
        validarQueNoSeEsteTrabajando(activos, asistencia);

        activos.forEach(ajuste -> ajuste.setEstado(EstadoAjusteJornada.CANCELADO));
        if (!activos.isEmpty()) {
            ajusteRepository.saveAll(activos);
        }

        horarioRepository.findHorarioVigente(idEmpleado, fecha).ifPresent(horario ->
                excepcionHorarioRepository.findByHorarioIdAndFecha(horario.getId(), fecha)
                        .ifPresent(excepcionHorarioRepository::delete)
        );

        diaNoLaborableRepository
                .findFirstByAlcanceAndRefIdAndFecha(AlcanceDiaNoLaborable.EMPLEADO, idEmpleado, fecha)
                .ifPresent(diaNoLaborableRepository::delete);

        if (asistencia != null
                && (asistencia.getInicioAlmuerzoProgramado() != null
                || asistencia.getFinAlmuerzoProgramado() != null)) {
            asistencia.setInicioAlmuerzoProgramado(null);
            asistencia.setFinAlmuerzoProgramado(null);
            asistenciaRepository.save(asistencia);
        }

        realtimeNotifier.publishAfterCommit(
                "HORARIO_RESTABLECIDO", "HORARIO", idEmpleado, fecha, null);
    }

    private void validarQueNoSeEsteTrabajando(List<AjusteJornada> ajustes, Asistencia asistencia) {
        if (asistencia == null
                || asistencia.getFechaHoraIngreso() == null
                || asistencia.getFechaHoraSalida() != null
                || asistencia.getEntradaProgramada() == null
                || asistencia.getSalidaProgramada() == null) {
            return;
        }
        LocalDate fecha = asistencia.getFecha();
        LocalDateTime inicioActivo = LocalDateTime.of(fecha, asistencia.getEntradaProgramada());
        LocalDateTime finActivo = LocalDateTime.of(fecha, asistencia.getSalidaProgramada());
        boolean afectaTramoActual = ajustes.stream().anyMatch(ajuste -> JornadaEfectivaResolver.overlaps(
                ajuste.getInicio(), ajuste.getFin(), inicioActivo, finActivo));
        if (afectaTramoActual) {
            throw new BadRequestException("No se puede restablecer el día porque el empleado está trabajando ese tramo");
        }
    }

    private PreviewAjusteJornadaResponse construirPreview(
            Long idEmpleado,
            AjusteJornadaRequest request,
            ValidatedAdjustment validated,
            List<AjusteJornada> activos
    ) {
        JornadaEfectivaResponse anterior = jornadaResolver.resolver(
                validated.horario(), validated.fecha(), activos);
        List<Long> reemplazados = activos.stream()
                .filter(item -> JornadaEfectivaResolver.overlaps(
                        item.getInicio(), item.getFin(), validated.inicio(), validated.fin()))
                .map(AjusteJornada::getId)
                .toList();
        List<AjusteJornada> simulados = new ArrayList<>(activos.stream()
                .filter(item -> !reemplazados.contains(item.getId())).toList());
        simulados.add(AjusteJornada.builder()
                .idEmpleado(idEmpleado)
                .fechaOperativa(validated.fecha())
                .inicio(validated.inicio())
                .fin(validated.fin())
                .origen(validated.origen())
                .estado(EstadoAjusteJornada.ACTIVO)
                .motivo(request.getMotivo().trim())
                .build());
        simulados.sort(Comparator.comparing(AjusteJornada::getInicio));

        return PreviewAjusteJornadaResponse.builder()
                .idEmpleado(idEmpleado)
                .inicioSolicitado(request.getInicio())
                .finSolicitado(request.getFin())
                .inicioAplicado(validated.inicio())
                .finAplicado(validated.fin())
                .resultado(validated.origen().name())
                .normalizacion(validated.normalizacion())
                .ajustesReemplazados(reemplazados)
                .jornadaAnterior(anterior)
                .jornadaResultante(jornadaResolver.resolver(validated.horario(), validated.fecha(), simulados))
                .build();
    }

    private ValidatedAdjustment validarYNormalizar(Long idEmpleado, AjusteJornadaRequest request) {
        LocalDateTime inicio = request.getInicio();
        LocalDateTime fin = request.getFin();
        if (!inicio.toLocalDate().equals(fin.toLocalDate())) {
            throw new BadRequestException("Por ahora el inicio y fin deben pertenecer al mismo dia");
        }
        if (!fin.isAfter(inicio)) {
            throw new BadRequestException("La hora de fin debe ser posterior a la hora de inicio");
        }
        LocalDate hoy = LocalDate.now(operationalClock);
        LocalDate fecha = inicio.toLocalDate();
        if (fecha.isBefore(hoy)) {
            throw new BadRequestException("Solo se pueden registrar ajustes para hoy o una fecha futura");
        }
        if (fecha.isBefore(properties.getEffectiveFrom())) {
            throw new BadRequestException("La fecha es anterior al inicio del nuevo sistema de jornadas");
        }

        Horario horario = horarioRepository.findHorarioVigente(idEmpleado, fecha)
                .orElseThrow(() -> new NotFoundException("Horario vigente no encontrado", idEmpleado));
        JornadaEfectivaResolver.BaseDiaria base = jornadaResolver.resolverBase(horario, fecha);
        OrigenAjusteJornada origen = !base.laborable()
                ? OrigenAjusteJornada.JORNADA_EXTRAORDINARIA
                : JornadaEfectivaResolver.overlaps(inicio, fin, base.inicio(), base.fin())
                ? OrigenAjusteJornada.REEMPLAZO_BASE
                : OrigenAjusteJornada.TRAMO_ADICIONAL;

        String normalizacion = null;
        Asistencia asistencia = asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, fecha).orElse(null);
        if (asistencia != null && asistencia.getFechaHoraIngreso() != null
                && asistencia.getFechaHoraSalida() == null) {
            LocalDateTime inicioActivo = LocalDateTime.of(fecha, asistencia.getEntradaProgramada());
            LocalDateTime finActivo = LocalDateTime.of(fecha, asistencia.getSalidaProgramada());
            if (JornadaEfectivaResolver.overlaps(inicio, fin, inicioActivo, finActivo)) {
                if (!fin.isAfter(LocalDateTime.now(operationalClock))) {
                    throw new BadRequestException("El nuevo fin debe ser posterior a la hora actual");
                }
                if (!inicio.equals(inicioActivo)) {
                    inicio = inicioActivo;
                    normalizacion = "Se conservo la hora programada del tramo que ya habia iniciado";
                }
            }
        }
        return new ValidatedAdjustment(horario, fecha, inicio, fin, origen, normalizacion);
    }

    private void publicarCambio(Long idEmpleado, LocalDate fecha) {
        realtimeNotifier.publishAfterCommit(
                "AJUSTE_JORNADA_AFECTADO", "AJUSTE", idEmpleado, fecha, null);
        realtimeNotifier.publishAfterCommit(
                "EXCEPCION_HORARIO_AFECTADA", "EXCEPCION", idEmpleado, fecha, null);
    }

    private void actualizarTramoActivo(Long idEmpleado, ValidatedAdjustment validated) {
        Asistencia asistencia = asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, validated.fecha())
                .orElse(null);
        if (asistencia == null || asistencia.getFechaHoraIngreso() == null || asistencia.getFechaHoraSalida() != null) {
            return;
        }
        LocalDateTime inicioActivo = LocalDateTime.of(validated.fecha(), asistencia.getEntradaProgramada());
        LocalDateTime finActivo = LocalDateTime.of(validated.fecha(), asistencia.getSalidaProgramada());
        if (!JornadaEfectivaResolver.overlaps(
                validated.inicio(), validated.fin(), inicioActivo, finActivo)) {
            return;
        }
        asistencia.setEntradaProgramada(validated.inicio().toLocalTime());
        asistencia.setSalidaProgramada(validated.fin().toLocalTime());
        int objetivo = (int) java.time.Duration.between(validated.inicio(), validated.fin()).toMinutes();
        asistencia.setMinutosObjetivoDia(objetivo);
        asistencia.setMinutosBalance(asistencia.getMinutosTrabajados() - objetivo);
        asistenciaRepository.save(asistencia);
    }

    private AjusteJornadaResponse toResponse(AjusteJornada ajuste) {
        return AjusteJornadaResponse.builder()
                .id(ajuste.getId())
                .idEmpleado(ajuste.getIdEmpleado())
                .idHorario(ajuste.getHorario().getId())
                .fecha(ajuste.getFechaOperativa())
                .inicio(ajuste.getInicio())
                .fin(ajuste.getFin())
                .estado(ajuste.getEstado())
                .origen(ajuste.getOrigen())
                .motivo(ajuste.getMotivo())
                .creadoPor(ajuste.getCreadoPor())
                .reemplazadoPorId(ajuste.getReemplazadoPor() == null ? null : ajuste.getReemplazadoPor().getId())
                .createdAt(ajuste.getCreatedAt())
                .build();
    }

    private record ValidatedAdjustment(
            Horario horario,
            LocalDate fecha,
            LocalDateTime inicio,
            LocalDateTime fin,
            OrigenAjusteJornada origen,
            String normalizacion
    ) {
    }
}
