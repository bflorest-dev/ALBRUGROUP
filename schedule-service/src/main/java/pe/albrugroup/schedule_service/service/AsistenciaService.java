package pe.albrugroup.schedule_service.service;

import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.ExcepcionHorario;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.HorarioDetalle;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;
import pe.albrugroup.schedule_service.entity.enums.TipoExcepcionHorario;
import pe.albrugroup.schedule_service.entity.request.asistencia.ConsultaMonitoreoRequest;
import pe.albrugroup.schedule_service.entity.request.asistencia.MovimientoAsistenciaRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.EstadoActualResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.EstadoMonitorResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.HistorialAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.ResumenAsistenciaResponse;
import pe.albrugroup.schedule_service.exception.BadRequestException;
import pe.albrugroup.schedule_service.exception.NotFoundException;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.service.mapper.AsistenciaMapper;
import pe.albrugroup.schedule_service.usecase.IAsistencia;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AsistenciaService implements IAsistencia {

    private final AsistenciaRepository asistenciaRepository;
    private final ExcepcionHorarioRepository excepcionHorarioRepository;
    private final HorarioService horarioService;
    private final AsistenciaMapper mapper;
    private final CurrentUser currentUser;

    @Override
    @Transactional
    public DetalleAsistenciaResponse registrarIngreso(MovimientoAsistenciaRequest request) {
        Asistencia asistencia = getOrCreateAsistencia(currentUser.empleadoID(), request.getFechaHora());
        if (asistencia.getFechaHoraIngreso() != null) {
            throw new BadRequestException("El ingreso ya fue registrado para la fecha");
        }
        asistencia.setFechaHoraIngreso(request.getFechaHora());
        asistencia.setEstadoActual(EstadoAsistencia.ONLINE);
        return mapper.toDetalleResponse(asistenciaRepository.save(asistencia));
    }

    @Override
    @Transactional
    public DetalleAsistenciaResponse registrarSalida(MovimientoAsistenciaRequest request) {
        Asistencia asistencia = getAsistenciaOperativa(currentUser.empleadoID(), request.getFechaHora().toLocalDate());
        if (asistencia.getFechaHoraIngreso() == null) {
            throw new BadRequestException("No existe ingreso registrado para la fecha");
        }
        if (asistencia.getFechaHoraSalida() != null) {
            throw new BadRequestException("La salida ya fue registrada para la fecha");
        }
        if (asistencia.getEstadoActual() == EstadoAsistencia.ALMUERZO || asistencia.getEstadoActual() == EstadoAsistencia.SERVICIOS) {
            throw new BadRequestException("No se puede registrar salida con una pausa activa");
        }

        asistencia.setFechaHoraSalida(request.getFechaHora());
        asistencia.setEstadoActual(EstadoAsistencia.OFFLINE);
        recalcularMinutos(asistencia);
        return mapper.toDetalleResponse(asistenciaRepository.save(asistencia));
    }

    @Override
    @Transactional
    public DetalleAsistenciaResponse iniciarAlmuerzo(MovimientoAsistenciaRequest request) {
        Asistencia asistencia = getAsistenciaOperativa(currentUser.empleadoID(), request.getFechaHora().toLocalDate());
        validarEstadoOnline(asistencia);
        if (asistencia.getFechaHoraInicioAlmuerzo() != null) {
            throw new BadRequestException("El almuerzo ya fue iniciado para la fecha");
        }
        asistencia.setFechaHoraInicioAlmuerzo(request.getFechaHora());
        asistencia.setEstadoActual(EstadoAsistencia.ALMUERZO);
        return mapper.toDetalleResponse(asistenciaRepository.save(asistencia));
    }

    @Override
    @Transactional
    public DetalleAsistenciaResponse finalizarAlmuerzo(MovimientoAsistenciaRequest request) {
        Asistencia asistencia = getAsistenciaOperativa(currentUser.empleadoID(), request.getFechaHora().toLocalDate());
        if (asistencia.getEstadoActual() != EstadoAsistencia.ALMUERZO || asistencia.getFechaHoraInicioAlmuerzo() == null) {
            throw new BadRequestException("No existe un almuerzo activo");
        }
        asistencia.setFechaHoraFinAlmuerzo(request.getFechaHora());
        asistencia.setMinutosAlmuerzoTomados((int) Duration.between(
                asistencia.getFechaHoraInicioAlmuerzo(),
                asistencia.getFechaHoraFinAlmuerzo()
        ).toMinutes());
        asistencia.setEstadoActual(EstadoAsistencia.ONLINE);
        return mapper.toDetalleResponse(asistenciaRepository.save(asistencia));
    }

    @Override
    @Transactional
    public DetalleAsistenciaResponse iniciarServicios(MovimientoAsistenciaRequest request) {
        Asistencia asistencia = getAsistenciaOperativa(currentUser.empleadoID(), request.getFechaHora().toLocalDate());
        validarEstadoOnline(asistencia);
        if (asistencia.getFechaHoraInicioServiciosActual() != null) {
            throw new BadRequestException("Ya existe un tiempo de servicios en curso");
        }
        asistencia.setFechaHoraInicioServiciosActual(request.getFechaHora());
        asistencia.setEstadoActual(EstadoAsistencia.SERVICIOS);
        return mapper.toDetalleResponse(asistenciaRepository.save(asistencia));
    }

    @Override
    @Transactional
    public DetalleAsistenciaResponse finalizarServicios(MovimientoAsistenciaRequest request) {
        Asistencia asistencia = getAsistenciaOperativa(currentUser.empleadoID(), request.getFechaHora().toLocalDate());
        if (asistencia.getEstadoActual() != EstadoAsistencia.SERVICIOS || asistencia.getFechaHoraInicioServiciosActual() == null) {
            throw new BadRequestException("No existe un tiempo de servicios en curso");
        }
        int minutos = (int) Duration.between(asistencia.getFechaHoraInicioServiciosActual(), request.getFechaHora()).toMinutes();
        asistencia.setMinutosServiciosAcumulados(asistencia.getMinutosServiciosAcumulados() + Math.max(minutos, 0));
        asistencia.setFechaHoraInicioServiciosActual(null);
        asistencia.setExcedioServicios(asistencia.getMinutosServiciosAcumulados() > asistencia.getMinutosServiciosPermitidos());
        asistencia.setEstadoActual(EstadoAsistencia.ONLINE);
        return mapper.toDetalleResponse(asistenciaRepository.save(asistencia));
    }

    @Override
    @Transactional(readOnly = true)
    public EstadoActualResponse getEstadoActual(LocalDate fecha) {
        return getEstadoActual(currentUser.empleadoID(), fecha);
    }

    @Override
    @Transactional(readOnly = true)
    public EstadoActualResponse getEstadoActual(Long idEmpleado, LocalDate fecha) {
        LocalDate consulta = fecha != null ? fecha : LocalDate.now();
        Asistencia asistencia = getAsistenciaOperativa(idEmpleado, consulta);
        return EstadoActualResponse.builder()
                .idEmpleado(idEmpleado)
                .fecha(consulta)
                .estadoActual(asistencia.getEstadoActual())
                .desde(getDesdeEstado(asistencia))
                .minutosServiciosPermitidos(asistencia.getMinutosServiciosPermitidos())
                .minutosServiciosAcumulados(asistencia.getMinutosServiciosAcumulados())
                .minutosServiciosEnCurso(calcularMinutosServiciosEnCurso(asistencia, LocalDateTime.now()))
                .excedioServicios(asistencia.getExcedioServicios())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DetalleAsistenciaResponse getAsistenciaDia(LocalDate fecha) {
        return getAsistenciaDia(currentUser.empleadoID(), fecha);
    }

    @Override
    @Transactional(readOnly = true)
    public DetalleAsistenciaResponse getAsistenciaDia(Long idEmpleado, LocalDate fecha) {
        return mapper.toDetalleResponse(getAsistenciaOperativa(idEmpleado, fecha));
    }

    @Override
    @Transactional(readOnly = true)
    public ResumenAsistenciaResponse getResumenSemanal(LocalDate fecha) {
        return getResumenSemanal(currentUser.empleadoID(), fecha);
    }

    @Override
    @Transactional(readOnly = true)
    public ResumenAsistenciaResponse getResumenSemanal(Long idEmpleado, LocalDate fecha) {
        LocalDate referencia = fecha != null ? fecha : LocalDate.now();
        LocalDate desde = referencia.minusDays(referencia.getDayOfWeek().getValue() - 1L);
        return construirResumen(idEmpleado, desde, desde.plusDays(6));
    }

    @Override
    @Transactional(readOnly = true)
    public ResumenAsistenciaResponse getResumenMensual(LocalDate fecha) {
        return getResumenMensual(currentUser.empleadoID(), fecha);
    }

    @Override
    @Transactional(readOnly = true)
    public ResumenAsistenciaResponse getResumenMensual(Long idEmpleado, LocalDate fecha) {
        LocalDate referencia = fecha != null ? fecha : LocalDate.now();
        YearMonth yearMonth = YearMonth.from(referencia);
        return construirResumen(idEmpleado, yearMonth.atDay(1), yearMonth.atEndOfMonth());
    }

    @Override
    @Transactional(readOnly = true)
    public List<HistorialAsistenciaResponse> getHistorial(LocalDate desde, LocalDate hasta) {
        return getHistorial(currentUser.empleadoID(), desde, hasta);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HistorialAsistenciaResponse> getHistorial(Long idEmpleado, LocalDate desde, LocalDate hasta) {
        LocalDate inicio = desde != null ? desde : LocalDate.now().minusDays(30);
        LocalDate fin = hasta != null ? hasta : LocalDate.now();
        return asistenciaRepository.findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(idEmpleado, inicio, fin)
                .stream()
                .map(mapper::toHistorialResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EstadoMonitorResponse> getEstadosMonitor(ConsultaMonitoreoRequest request) {
        LocalDate consulta = request.getFecha() != null ? request.getFecha() : LocalDate.now();
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
                .map(idEmpleado -> construirEstadoMonitor(idEmpleado, consulta, asistenciasPorEmpleado.get(idEmpleado)))
                .toList();
    }

    private Asistencia getOrCreateAsistencia(Long idEmpleado, LocalDateTime fechaHora) {
        return asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, fechaHora.toLocalDate())
                .orElseGet(() -> crearAsistencia(idEmpleado, fechaHora.toLocalDate()));
    }

    private Asistencia crearAsistencia(Long idEmpleado, LocalDate fecha) {
        Horario horario = horarioService.getHorarioById(horarioService.getHorarioVigente(idEmpleado, fecha).getId());
        ProgramacionDiaria programacion = resolverProgramacion(horario, fecha);
        if (!programacion.laborable()) {
            throw new BadRequestException("La fecha consultada no es laborable para el horario vigente");
        }

        return asistenciaRepository.save(Asistencia.builder()
                .idEmpleado(idEmpleado)
                .idHorario(horario.getId())
                .fecha(fecha)
                .estadoActual(EstadoAsistencia.OFFLINE)
                .entradaProgramada(programacion.horaEntrada())
                .salidaProgramada(programacion.horaSalida())
                .inicioAlmuerzoProgramado(programacion.inicioAlmuerzo())
                .finAlmuerzoProgramado(programacion.finAlmuerzo())
                .minutosObjetivoDia(programacion.minutosObjetivo())
                .minutosTrabajados(0)
                .minutosBalance(0)
                .minutosAlmuerzoTomados(0)
                .minutosServiciosPermitidos(horario.getMinutosServicios())
                .minutosServiciosAcumulados(0)
                .excedioServicios(Boolean.FALSE)
                .build());
    }

    private ProgramacionDiaria resolverProgramacion(Horario horario, LocalDate fecha) {
        ExcepcionHorario excepcion = excepcionHorarioRepository.findByHorarioIdAndFecha(horario.getId(), fecha).orElse(null);
        if (excepcion != null) {
            if (excepcion.getTipo() == TipoExcepcionHorario.DIA_LIBRE) {
                return ProgramacionDiaria.builder().laborable(false).minutosObjetivo(0).build();
            }
            return ProgramacionDiaria.builder()
                    .laborable(excepcion.getLaborable() == null || excepcion.getLaborable())
                    .horaEntrada(excepcion.getHoraEntrada())
                    .horaSalida(excepcion.getHoraSalida())
                    .inicioAlmuerzo(excepcion.getInicioAlmuerzo())
                    .finAlmuerzo(excepcion.getFinAlmuerzo())
                    .minutosObjetivo(calcularMinutosObjetivo(
                            excepcion.getHoraEntrada(),
                            excepcion.getHoraSalida(),
                            excepcion.getInicioAlmuerzo(),
                            excepcion.getFinAlmuerzo()))
                    .build();
        }

        Dia dia = mapearDia(fecha.getDayOfWeek());
        HorarioDetalle detalle = horario.getDetalles().stream()
                .filter(value -> value.getDia() == dia)
                .findFirst()
                .orElseThrow(() -> new NotFoundException("No existe detalle de horario para el dia", dia));

        if (!detalle.getLaborable()) {
            return ProgramacionDiaria.builder().laborable(false).minutosObjetivo(0).build();
        }

        return ProgramacionDiaria.builder()
                .laborable(true)
                .horaEntrada(detalle.getHoraEntrada())
                .horaSalida(detalle.getHoraSalida())
                .inicioAlmuerzo(detalle.getInicioAlmuerzo())
                .finAlmuerzo(detalle.getFinAlmuerzo())
                .minutosObjetivo(calcularMinutosObjetivo(
                        detalle.getHoraEntrada(),
                        detalle.getHoraSalida(),
                        detalle.getInicioAlmuerzo(),
                        detalle.getFinAlmuerzo()))
                .build();
    }

    private Asistencia getAsistenciaOperativa(Long idEmpleado, LocalDate fecha) {
        return asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, fecha)
                .orElseThrow(() -> new NotFoundException("Asistencia no encontrada para la fecha", fecha));
    }

    private EstadoMonitorResponse construirEstadoMonitor(Long idEmpleado, LocalDate fecha, Asistencia asistencia) {
        if (asistencia != null) {
            return EstadoMonitorResponse.builder()
                    .idEmpleado(idEmpleado)
                    .fecha(fecha)
                    .idHorario(asistencia.getIdHorario())
                    .entradaProgramada(asistencia.getEntradaProgramada())
                    .salidaProgramada(asistencia.getSalidaProgramada())
                    .tieneHorarioVigente(true)
                    .laborableHoy(true)
                    .esperadoHoy(true)
                    .tieneRegistroHoy(asistencia.getFechaHoraIngreso() != null)
                    .estadoActual(asistencia.getEstadoActual())
                    .desde(getDesdeEstado(asistencia))
                    .minutosServiciosPermitidos(asistencia.getMinutosServiciosPermitidos())
                    .minutosServiciosAcumulados(asistencia.getMinutosServiciosAcumulados())
                    .minutosServiciosEnCurso(calcularMinutosServiciosEnCurso(asistencia, LocalDateTime.now()))
                    .excedioServicios(asistencia.getExcedioServicios())
                    .operativo(esOperativo(asistencia.getEstadoActual()))
                    .build();
        }

        try {
            Horario horario = horarioService.getHorarioById(horarioService.getHorarioVigente(idEmpleado, fecha).getId());
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

    private void validarEstadoOnline(Asistencia asistencia) {
        if (asistencia.getFechaHoraIngreso() == null) {
            throw new BadRequestException("No existe ingreso registrado para la fecha");
        }
        if (asistencia.getFechaHoraSalida() != null) {
            throw new BadRequestException("La jornada ya fue cerrada para la fecha");
        }
        if (asistencia.getEstadoActual() != EstadoAsistencia.ONLINE) {
            throw new BadRequestException("El empleado debe estar ONLINE para realizar esta accion");
        }
    }

    private void recalcularMinutos(Asistencia asistencia) {
        long minutosJornada = Duration.between(asistencia.getFechaHoraIngreso(), asistencia.getFechaHoraSalida()).toMinutes();
        int trabajados = (int) Math.max(minutosJornada - asistencia.getMinutosAlmuerzoTomados() - asistencia.getMinutosServiciosAcumulados(), 0);
        asistencia.setMinutosTrabajados(trabajados);
        asistencia.setMinutosBalance(trabajados - asistencia.getMinutosObjetivoDia());
    }

    private int calcularMinutosObjetivo(LocalTime entrada, LocalTime salida, LocalTime inicioAlmuerzo, LocalTime finAlmuerzo) {
        if (entrada == null || salida == null) {
            return 0;
        }
        int minutosBase = (int) Duration.between(entrada, salida).toMinutes();
        int minutosAlmuerzo = inicioAlmuerzo != null && finAlmuerzo != null
                ? (int) Duration.between(inicioAlmuerzo, finAlmuerzo).toMinutes()
                : 0;
        return Math.max(minutosBase - minutosAlmuerzo, 0);
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

    private ResumenAsistenciaResponse construirResumen(Long idEmpleado, LocalDate desde, LocalDate hasta) {
        List<Asistencia> asistencias = asistenciaRepository.findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(idEmpleado, desde, hasta);
        return ResumenAsistenciaResponse.builder()
                .idEmpleado(idEmpleado)
                .desde(desde)
                .hasta(hasta)
                .diasConRegistro(asistencias.size())
                .diasCerrados((int) asistencias.stream().filter(asistencia -> asistencia.getFechaHoraSalida() != null).count())
                .minutosObjetivo(asistencias.stream().mapToInt(Asistencia::getMinutosObjetivoDia).sum())
                .minutosTrabajados(asistencias.stream().mapToInt(Asistencia::getMinutosTrabajados).sum())
                .minutosBalance(asistencias.stream().mapToInt(Asistencia::getMinutosBalance).sum())
                .minutosServiciosPermitidos(asistencias.stream().mapToInt(Asistencia::getMinutosServiciosPermitidos).sum())
                .minutosServiciosAcumulados(asistencias.stream().mapToInt(Asistencia::getMinutosServiciosAcumulados).sum())
                .build();
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

    private boolean esOperativo(EstadoAsistencia estado) {
        return estado == EstadoAsistencia.ONLINE;
    }

    @Builder
    private record ProgramacionDiaria(
            boolean laborable,
            LocalTime horaEntrada,
            LocalTime horaSalida,
            LocalTime inicioAlmuerzo,
            LocalTime finAlmuerzo,
            int minutosObjetivo
    ) {}
}
