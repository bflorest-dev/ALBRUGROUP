package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.configuration.ScheduleEngineProperties;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.ExcepcionHorario;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.HorarioDetalle;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;
import pe.albrugroup.schedule_service.entity.enums.TipoExcepcionHorario;
import pe.albrugroup.schedule_service.entity.request.asistencia.ConsultaMonitoreoRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.EstadoMonitorResponse;
import pe.albrugroup.schedule_service.entity.response.horario.JornadaEfectivaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.TramoJornadaResponse;
import pe.albrugroup.schedule_service.exception.NotFoundException;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AttendanceMonitorResolver {

    private final AsistenciaRepository asistenciaRepository;
    private final ExcepcionHorarioRepository excepcionHorarioRepository;
    private final HorarioRepository horarioRepository;
    private final JornadaEfectivaResolver jornadaEfectivaResolver;
    private final ScheduleEngineProperties scheduleEngineProperties;

    @Transactional(readOnly = true)
    public List<EstadoMonitorResponse> getEstadosMonitor(ConsultaMonitoreoRequest request) {
        LocalDate consulta = OperationalDateTime.resolveDate(request.getFecha());
        List<Long> empleadoIds = request.getEmpleadoIds().stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (empleadoIds.isEmpty()) {
            return List.of();
        }

        Map<Long, Asistencia> asistenciasPorEmpleado = asistenciaRepository.findByIdEmpleadoInAndFecha(empleadoIds, consulta)
                .stream()
                .collect(LinkedHashMap::new, (map, asistencia) -> map.put(asistencia.getIdEmpleado(), asistencia), Map::putAll);

        return empleadoIds.stream()
                .map(idEmpleado -> buildEstadoMonitor(idEmpleado, consulta, asistenciasPorEmpleado.get(idEmpleado)))
                .toList();
    }

    @Transactional(readOnly = true)
    public EstadoMonitorResponse resolveEstadoMonitor(Long idEmpleado, LocalDate fecha) {
        LocalDate consulta = OperationalDateTime.resolveDate(fecha);
        Asistencia asistencia = asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, consulta).orElse(null);
        return buildEstadoMonitor(idEmpleado, consulta, asistencia);
    }

    private EstadoMonitorResponse buildEstadoMonitor(Long idEmpleado, LocalDate fecha, Asistencia asistencia) {
        if (asistencia != null) {
            JornadaEfectivaResponse jornada = resolverJornadaNueva(idEmpleado, fecha);
            TramoJornadaResponse tramo = jornada == null ? null
                    : jornada.getTramoActual() != null ? jornada.getTramoActual() : jornada.getProximoTramo();
            return EstadoMonitorResponse.builder()
                    .idEmpleado(idEmpleado)
                    .fecha(fecha)
                    .idHorario(asistencia.getIdHorario())
                    .entradaProgramada(tramo == null ? asistencia.getEntradaProgramada() : tramo.getInicio().toLocalTime())
                    .salidaProgramada(tramo == null ? asistencia.getSalidaProgramada() : tramo.getFin().toLocalTime())
                    .tieneHorarioVigente(true)
                    .laborableHoy(jornada == null || !jornada.getTramos().isEmpty())
                    .esperadoHoy(jornada == null || !jornada.getTramos().isEmpty())
                    .tieneRegistroHoy(asistencia.getFechaHoraIngreso() != null)
                    .estadoActual(asistencia.getEstadoActual())
                    .desde(getDesdeEstado(asistencia))
                    .minutosServiciosPermitidos(asistencia.getMinutosServiciosPermitidos())
                    .minutosServiciosAcumulados(asistencia.getMinutosServiciosAcumulados())
                    .minutosServiciosEnCurso(calcularMinutosServiciosEnCurso(asistencia, OperationalDateTime.nowLocalDateTime()))
                    .excedioServicios(asistencia.getExcedioServicios())
                    .operativo(esOperativo(idEmpleado, fecha, asistencia.getEstadoActual()))
                    .build();
        }

        try {
            JornadaEfectivaResponse jornada = resolverJornadaNueva(idEmpleado, fecha);
            if (jornada != null) {
                TramoJornadaResponse tramo = jornada.getTramoActual() != null
                        ? jornada.getTramoActual() : jornada.getProximoTramo();
                if (tramo == null && !jornada.getTramos().isEmpty()) {
                    tramo = jornada.getTramos().getLast();
                }
                boolean esperado = !jornada.getTramos().isEmpty();
                return EstadoMonitorResponse.builder()
                        .idEmpleado(idEmpleado)
                        .fecha(fecha)
                        .idHorario(jornada.getIdHorario())
                        .entradaProgramada(tramo == null ? null : tramo.getInicio().toLocalTime())
                        .salidaProgramada(tramo == null ? null : tramo.getFin().toLocalTime())
                        .tieneHorarioVigente(true)
                        .laborableHoy(esperado)
                        .esperadoHoy(esperado)
                        .tieneRegistroHoy(false)
                        .estadoActual(EstadoAsistencia.OFFLINE)
                        .minutosServiciosPermitidos(0)
                        .minutosServiciosAcumulados(0)
                        .minutosServiciosEnCurso(0)
                        .excedioServicios(false)
                        .operativo(false)
                        .build();
            }
            Horario horario = horarioRepository.findHorarioVigente(idEmpleado, fecha)
                    .orElseThrow(() -> new NotFoundException("Horario vigente no encontrado", idEmpleado));
            ProgramacionDiaria programacion = resolverProgramacion(horario, fecha);
            boolean esperadoHoy = programacion.laborable();
            return EstadoMonitorResponse.builder()
                    .idEmpleado(idEmpleado)
                    .fecha(fecha)
                    .idHorario(horario.getId())
                    .entradaProgramada(programacion.horaEntrada())
                    .salidaProgramada(programacion.horaSalida())
                    .tieneHorarioVigente(true)
                    .laborableHoy(esperadoHoy)
                    .esperadoHoy(esperadoHoy)
                    .tieneRegistroHoy(false)
                    .estadoActual(EstadoAsistencia.OFFLINE)
                    .desde(null)
                    .minutosServiciosPermitidos(horario.getMinutosServicios())
                    .minutosServiciosAcumulados(0)
                    .minutosServiciosEnCurso(0)
                    .excedioServicios(false)
                    .operativo(false)
                    .build();
        } catch (NotFoundException e) {
            return EstadoMonitorResponse.builder()
                    .idEmpleado(idEmpleado)
                    .fecha(fecha)
                    .tieneHorarioVigente(false)
                    .laborableHoy(false)
                    .esperadoHoy(false)
                    .tieneRegistroHoy(false)
                    .estadoActual(EstadoAsistencia.OFFLINE)
                    .desde(null)
                    .minutosServiciosPermitidos(0)
                    .minutosServiciosAcumulados(0)
                    .minutosServiciosEnCurso(0)
                    .excedioServicios(false)
                    .operativo(false)
                    .build();
        }
    }

    private JornadaEfectivaResponse resolverJornadaNueva(Long idEmpleado, LocalDate fecha) {
        if (!scheduleEngineProperties.enabledForOperationalReads(fecha)) {
            return null;
        }
        return jornadaEfectivaResolver.resolver(idEmpleado, fecha);
    }

    private ProgramacionDiaria resolverProgramacion(Horario horario, LocalDate fecha) {
        ExcepcionHorario excepcion = excepcionHorarioRepository.findByHorarioIdAndFecha(horario.getId(), fecha).orElse(null);
        if (excepcion != null) {
            if (excepcion.getTipo() == TipoExcepcionHorario.DIA_LIBRE) {
                return ProgramacionDiaria.builder().laborable(false).build();
            }
            return ProgramacionDiaria.builder()
                    .laborable(excepcion.getLaborable() == null || excepcion.getLaborable())
                    .horaEntrada(excepcion.getHoraEntrada())
                    .horaSalida(excepcion.getHoraSalida())
                    .build();
        }

        Dia dia = mapearDia(fecha.getDayOfWeek());
        HorarioDetalle detalle = horario.getDetalles().stream()
                .filter(value -> value.getDia() == dia)
                .findFirst()
                .orElseThrow(() -> new NotFoundException("No existe detalle de horario para el dia", dia));

        if (!detalle.getLaborable()) {
            return ProgramacionDiaria.builder().laborable(false).build();
        }

        return ProgramacionDiaria.builder()
                .laborable(true)
                .horaEntrada(detalle.getHoraEntrada())
                .horaSalida(detalle.getHoraSalida())
                .build();
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

    private int calcularMinutosServiciosEnCurso(Asistencia asistencia, LocalDateTime ahora) {
        if (asistencia.getFechaHoraInicioServiciosActual() == null) {
            return 0;
        }
        return (int) Duration.between(asistencia.getFechaHoraInicioServiciosActual(), ahora).toMinutes();
    }

    private LocalDateTime getDesdeEstado(Asistencia asistencia) {
        return switch (asistencia.getEstadoActual()) {
            case ONLINE -> asistencia.getFechaHoraIngreso();
            case ALMUERZO -> asistencia.getFechaHoraInicioAlmuerzo();
            case SERVICIOS -> asistencia.getFechaHoraInicioServiciosActual();
            default -> asistencia.getFechaHoraSalida();
        };
    }

    /**
     * Operativo = jornada de hoy abierta y en curso (ONLINE). Coherente con el gate del empleado:
     * se mantiene true aunque ya haya pasado la hora de salida, hasta que marque OFFLINE o el cierre
     * automatico cierre la jornada. Asi el monitoreo de supervisores/GTR refleja a quien sigue
     * trabajando despues de su salida en vez de marcarlo como no operativo.
     */
    private boolean esOperativo(Long idEmpleado, LocalDate fecha, EstadoAsistencia estado) {
        return estado == EstadoAsistencia.ONLINE
                && fecha.equals(OperationalDateTime.nowLocalDateTime().toLocalDate());
    }

    @lombok.Builder
    private record ProgramacionDiaria(
            boolean laborable,
            LocalTime horaEntrada,
            LocalTime horaSalida
    ) {}
}
