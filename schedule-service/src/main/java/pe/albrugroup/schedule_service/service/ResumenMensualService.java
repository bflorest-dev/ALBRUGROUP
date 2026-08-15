package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.entity.AjusteJornada;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.ResumenAsistenciaMensual;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.EstadoAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.EstadoDia;
import pe.albrugroup.schedule_service.entity.enums.RazonAjuste;
import pe.albrugroup.schedule_service.entity.response.asistencia.ResumenMensualResponse;
import pe.albrugroup.schedule_service.exception.BadRequestException;
import pe.albrugroup.schedule_service.repository.AjusteJornadaRepository;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;
import pe.albrugroup.schedule_service.repository.ResumenAsistenciaMensualRepository;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Cierre / reporte mensual (Fase 3.4.a). Materializa perezosamente el {@link ResumenAsistenciaMensual}
 * de un mes PASADO al primer acceso (cierre automatico a fin de mes) y lo devuelve inmutable; el mes en
 * curso/futuro no tiene resumen final (se consulta en vivo por {@code /asistencia/mes}). Los hechos se
 * DERIVAN de los dias (Fork 4: el status del dia no es columna). Sin dinero: el ms de calculo aplica
 * tarifas/descuentos sobre este snapshot (hand-off por API, no DB compartida).
 */
@Service
@RequiredArgsConstructor
public class ResumenMensualService {

    private final ResumenAsistenciaMensualRepository resumenRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final AjusteJornadaRepository ajusteRepository;
    private final HorarioRepository horarioRepository;
    private final JornadaEfectivaResolver jornadaResolver;
    private final ParametroAsistenciaResolver parametroResolver;

    /**
     * Resumen cerrado de (empleado, anio, mes). Mes en curso/futuro -> excepcion. Mes pasado con
     * snapshot -> lo devuelve; sin snapshot -> calcula, persiste (cierre perezoso) y devuelve.
     */
    @Transactional
    public ResumenMensualResponse obtener(Long idEmpleado, int anio, int mes) {
        YearMonth periodo = YearMonth.of(anio, mes);
        if (!periodo.isBefore(OperationalDateTime.currentMonth())) {
            throw new BadRequestException(
                    "El mes en curso o futuro no tiene resumen final; consulta el mes en vivo en /asistencia/mes");
        }
        return toResponse(resumenRepository.findByIdEmpleadoAndAnioAndMes(idEmpleado, anio, mes)
                .orElseGet(() -> materializar(idEmpleado, periodo)));
    }

    /**
     * Reabre y recalcula el resumen de un mes cerrado (correccion, caso raro): borra el snapshot y lo
     * recomputa desde los hechos. El snapshot es materializado, no legalmente inmutable.
     */
    @Transactional
    public ResumenMensualResponse recalcular(Long idEmpleado, int anio, int mes) {
        YearMonth periodo = YearMonth.of(anio, mes);
        if (!periodo.isBefore(OperationalDateTime.currentMonth())) {
            throw new BadRequestException("Solo se puede recalcular un mes ya cerrado (pasado)");
        }
        resumenRepository.deleteByIdEmpleadoAndAnioAndMes(idEmpleado, anio, mes);
        resumenRepository.flush();
        return toResponse(materializar(idEmpleado, periodo));
    }

    private ResumenAsistenciaMensual materializar(Long idEmpleado, YearMonth periodo) {
        ResumenAsistenciaMensual calculado = calcular(idEmpleado, periodo);
        try {
            return resumenRepository.saveAndFlush(calculado);
        } catch (DataIntegrityViolationException carreraDeCierre) {
            // Otro acceso concurrente ya lo cerro (uk_resumen_mensual): reusar el suyo.
            return resumenRepository.findByIdEmpleadoAndAnioAndMes(
                            idEmpleado, periodo.getYear(), periodo.getMonthValue())
                    .orElseThrow(() -> carreraDeCierre);
        }
    }

    private ResumenAsistenciaMensual calcular(Long idEmpleado, YearMonth periodo) {
        LocalDate desde = periodo.atDay(1);
        LocalDate hasta = periodo.atEndOfMonth();

        Map<LocalDate, Asistencia> asistenciasPorFecha = asistenciaRepository
                .findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(idEmpleado, desde, hasta).stream()
                .collect(Collectors.toMap(Asistencia::getFecha, a -> a, (a, b) -> a));
        Map<LocalDate, List<AjusteJornada>> ajustesPorFecha = ajusteRepository
                .findByIdEmpleadoAndFechaOperativaBetweenAndEstado(
                        idEmpleado, desde, hasta, EstadoAjusteJornada.ACTIVO).stream()
                .collect(Collectors.groupingBy(AjusteJornada::getFechaOperativa));
        int tolerancia = parametroResolver.resolve(List.of()).toleranciaTardanzaMin();

        int diasLaborables = 0, diasPresente = 0, diasTardanza = 0, diasCompensable = 0, diasJustificada = 0, diasFalta = 0;
        int minutosObjetivo = 0, minutosTrabajados = 0, minutosExtra = 0, sumaBalance = 0, sumaCompensados = 0;

        for (LocalDate fecha = desde; !fecha.isAfter(hasta); fecha = fecha.plusDays(1)) {
            boolean laborable = jornadaResolver.resolverSiExiste(idEmpleado, fecha)
                    .map(j -> Boolean.TRUE.equals(j.getLaborableBase()))
                    .orElse(false);
            if (!laborable) {
                continue; // NO_LABORABLE: no cuenta como falta ni afecta balance.
            }
            diasLaborables++;
            Asistencia asistencia = asistenciasPorFecha.get(fecha);
            minutosObjetivo += asistencia != null
                    ? safe(asistencia.getMinutosObjetivoDia())
                    : objetivoNetoBase(idEmpleado, fecha);

            if (asistencia == null || asistencia.getFechaHoraIngreso() == null
                    || asistencia.getFechaHoraSalida() == null) {
                diasFalta++;
                continue; // FALTA: sin marca de ingreso O sin marca de salida (OFFLINE manual).
            }
            minutosTrabajados += safe(asistencia.getMinutosTrabajados());
            minutosExtra += safe(asistencia.getMinutosExtra());
            sumaCompensados += safe(asistencia.getMinutosCompensados());
            sumaBalance += safe(asistencia.getMinutosBalance()); // cada dia <= 0

            switch (clasificar(asistencia, ajustesPorFecha.get(fecha), tolerancia)) {
                case PRESENTE -> diasPresente++;
                case TARDANZA -> diasTardanza++;
                case TARDANZA_COMPENSABLE -> { diasTardanza++; diasCompensable++; }
                case TARDANZA_JUSTIFICADA -> { diasTardanza++; diasJustificada++; }
                case FALTA, NO_LABORABLE -> { /* no alcanzable aqui */ }
            }
        }

        // Compensacion (3.4.b): el tiempo trabajado en tramos COMPENSACION neutraliza el deficit del
        // mes, TOPADO al deficit (el exceso se ignora, no da positivo ni pasa a horas extra).
        int deficitBruto = -sumaBalance; // sumaBalance <= 0
        int minutosCompensados = Math.min(sumaCompensados, deficitBruto);
        int balanceFinal = Math.min(sumaBalance + minutosCompensados, 0);

        return ResumenAsistenciaMensual.builder()
                .idEmpleado(idEmpleado)
                .anio(periodo.getYear())
                .mes(periodo.getMonthValue())
                .fechaCierre(OperationalDateTime.now())
                .cerradoPor(null) // cierre automatico perezoso (no explicito)
                .diasLaborables(diasLaborables)
                .diasPresente(diasPresente)
                .diasTardanza(diasTardanza)
                .diasTardanzaCompensable(diasCompensable)
                .diasTardanzaJustificada(diasJustificada)
                .diasFalta(diasFalta)
                .minutosObjetivo(minutosObjetivo)
                .minutosTrabajados(minutosTrabajados)
                .balanceFinal(balanceFinal)
                .minutosExtra(minutosExtra)
                .minutosCompensados(minutosCompensados)
                .cantidadTardanzas(diasTardanza)
                .build();
    }

    /**
     * Status del dia para un dia trabajado (ya se descarto NO_LABORABLE y FALTA). El corrimiento manda
     * sobre la marca: un dia con ajuste de corrimiento es COMPENSADA/JUSTIFICADA aunque la marca sobre
     * el horario ya desplazado sea puntual (el status lo fija la razon, no el reloj).
     */
    private EstadoDia clasificar(Asistencia asistencia, List<AjusteJornada> ajustesDelDia, int tolerancia) {
        if (tieneRazon(ajustesDelDia, RazonAjuste.CORRIMIENTO_JUSTIFICADA)) {
            return EstadoDia.TARDANZA_JUSTIFICADA;
        }
        if (tieneRazon(ajustesDelDia, RazonAjuste.CORRIMIENTO_COMPENSABLE)) {
            return EstadoDia.TARDANZA_COMPENSABLE;
        }
        return esTardanza(asistencia, tolerancia) ? EstadoDia.TARDANZA : EstadoDia.PRESENTE;
    }

    private boolean tieneRazon(List<AjusteJornada> ajustes, RazonAjuste razon) {
        return ajustes != null && ajustes.stream().anyMatch(a -> a.getRazon() == razon);
    }

    private boolean esTardanza(Asistencia asistencia, int tolerancia) {
        if (asistencia.getFechaHoraIngreso() == null || asistencia.getEntradaProgramada() == null) {
            return false;
        }
        return asistencia.getFechaHoraIngreso().toLocalTime()
                .isAfter(asistencia.getEntradaProgramada().plusMinutes(tolerancia));
    }

    /** Objetivo NETO de un dia laborable sin asistencia (falta): ventana base menos almuerzo programado. */
    private int objetivoNetoBase(Long idEmpleado, LocalDate fecha) {
        Horario horario = horarioRepository.findHorarioVigente(idEmpleado, fecha).orElse(null);
        if (horario == null) {
            return 0;
        }
        JornadaEfectivaResolver.BaseDiaria base = jornadaResolver.resolverBase(horario, fecha);
        if (!base.laborable() || base.inicio() == null || base.fin() == null) {
            return 0;
        }
        int ventana = (int) Duration.between(base.inicio(), base.fin()).toMinutes();
        return Math.max(ventana - almuerzoProgramadoMin(horario, fecha), 0);
    }

    private int almuerzoProgramadoMin(Horario horario, LocalDate fecha) {
        Dia dia = mapearDia(fecha.getDayOfWeek());
        return horario.getDetalles().stream()
                .filter(d -> d.getDia() == dia)
                .findFirst()
                .filter(d -> d.getInicioAlmuerzo() != null && d.getFinAlmuerzo() != null)
                .map(d -> (int) Duration.between(d.getInicioAlmuerzo(), d.getFinAlmuerzo()).toMinutes())
                .orElse(0);
    }

    private Dia mapearDia(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> Dia.LUNES;
            case TUESDAY -> Dia.MARTES;
            case WEDNESDAY -> Dia.MIERCOLES;
            case THURSDAY -> Dia.JUEVES;
            case FRIDAY -> Dia.VIERNES;
            case SATURDAY -> Dia.SABADO;
            case SUNDAY -> Dia.DOMINGO;
        };
    }

    private int safe(Integer valor) {
        return valor == null ? 0 : valor;
    }

    private ResumenMensualResponse toResponse(ResumenAsistenciaMensual r) {
        return ResumenMensualResponse.builder()
                .idEmpleado(r.getIdEmpleado())
                .anio(r.getAnio())
                .mes(r.getMes())
                .fechaCierre(r.getFechaCierre())
                .diasLaborables(r.getDiasLaborables())
                .diasPresente(r.getDiasPresente())
                .diasTardanza(r.getDiasTardanza())
                .diasTardanzaCompensable(r.getDiasTardanzaCompensable())
                .diasTardanzaJustificada(r.getDiasTardanzaJustificada())
                .diasFalta(r.getDiasFalta())
                .minutosObjetivo(r.getMinutosObjetivo())
                .minutosTrabajados(r.getMinutosTrabajados())
                .balanceFinal(r.getBalanceFinal())
                .minutosExtra(r.getMinutosExtra())
                .minutosCompensados(r.getMinutosCompensados())
                .cantidadTardanzas(r.getCantidadTardanzas())
                .build();
    }
}
