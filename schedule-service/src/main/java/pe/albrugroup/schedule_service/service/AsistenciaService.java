package pe.albrugroup.schedule_service.service;

import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.AsistenciaTramo;
import pe.albrugroup.schedule_service.entity.ExcepcionHorario;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.HorarioDetalle;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;
import pe.albrugroup.schedule_service.entity.enums.OrigenTramo;
import pe.albrugroup.schedule_service.entity.enums.TipoExcepcionHorario;
import pe.albrugroup.schedule_service.entity.request.asistencia.ConsultaCumplimientoRequest;
import pe.albrugroup.schedule_service.entity.request.asistencia.ConsultaMonitoreoRequest;
import pe.albrugroup.schedule_service.entity.request.asistencia.MovimientoAsistenciaRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarAmpliacionRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.AsistenciaDiaCalendarioResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.AsistenciaMesResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoDetalleDiaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoDetalleEmpleadoResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoDetalleResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoResumenEmpleadoResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoResumenResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.EstadoMonitorResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.TramoAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.AmpliacionContextoResponse;
import pe.albrugroup.schedule_service.entity.response.horario.AmpliacionHorarioResponse;
import pe.albrugroup.schedule_service.exception.BadRequestException;
import pe.albrugroup.schedule_service.exception.ConflictException;
import pe.albrugroup.schedule_service.exception.NotFoundException;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.AsistenciaTramoRepository;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.service.mapper.AsistenciaMapper;
import pe.albrugroup.schedule_service.service.mapper.HorarioMapper;
import pe.albrugroup.schedule_service.usecase.IAsistencia;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AsistenciaService implements IAsistencia {

    private final AsistenciaRepository asistenciaRepository;
    private final AsistenciaTramoRepository asistenciaTramoRepository;
    private final ExcepcionHorarioRepository excepcionHorarioRepository;
    private final HorarioService horarioService;
    private final AttendanceMonitorResolver attendanceMonitorResolver;
    private final AttendanceRealtimeNotifier attendanceRealtimeNotifier;
    private final AsistenciaMapper mapper;
    private final HorarioMapper horarioMapper;
    private final CurrentUser currentUser;

    @Override
    @Transactional
    public DetalleAsistenciaResponse registrarIngreso(MovimientoAsistenciaRequest request) {
        LocalDateTime fechaHoraOperativa = OperationalDateTime.nowLocalDateTime();
        validarMovimientoDentroDeHorario(currentUser.empleadoID(), fechaHoraOperativa);
        Asistencia asistencia = getOrCreateAsistencia(currentUser.empleadoID(), fechaHoraOperativa);
        EstadoAsistencia estadoAnterior = asistencia.getEstadoActual();
        if (asistencia.getFechaHoraIngreso() != null) {
            throw new BadRequestException("El ingreso ya fue registrado para la fecha");
        }
        asistencia.setFechaHoraIngreso(fechaHoraOperativa);
        asistencia.setEstadoActual(EstadoAsistencia.ONLINE);
        Asistencia savedAsistencia = asistenciaRepository.save(asistencia);
        attendanceRealtimeNotifier.publishAfterCommit(
                "ASISTENCIA_REGISTRO_CREADO",
                "INGRESO",
                savedAsistencia.getIdEmpleado(),
                savedAsistencia.getFecha(),
                estadoAnterior
        );
        return toDetalleOperativoResponse(savedAsistencia);
    }

    @Override
    @Transactional
    public DetalleAsistenciaResponse registrarSalida(MovimientoAsistenciaRequest request) {
        LocalDateTime fechaHoraOperativa = OperationalDateTime.nowLocalDateTime();
        validarSalidaPermitida(currentUser.empleadoID(), fechaHoraOperativa);
        Asistencia asistencia = getAsistenciaOperativa(currentUser.empleadoID(), fechaHoraOperativa.toLocalDate());
        EstadoAsistencia estadoAnterior = asistencia.getEstadoActual();
        if (asistencia.getFechaHoraIngreso() == null) {
            throw new BadRequestException("No existe ingreso registrado para la fecha");
        }
        if (asistencia.getFechaHoraSalida() != null) {
            throw new BadRequestException("La salida ya fue registrada para la fecha");
        }
        if (asistencia.getEstadoActual() == EstadoAsistencia.ALMUERZO || asistencia.getEstadoActual() == EstadoAsistencia.SERVICIOS) {
            throw new BadRequestException("No se puede registrar salida con una pausa activa");
        }

        // La hora de salida registrada se topa en la salida programada: si marca OFFLINE despues de
        // su horario (se le permite seguir trabajando), no se guarda tiempo extra que afecte calculos.
        LocalDateTime topeSalida = resolverTopeSalidaProgramada(asistencia.getIdEmpleado(), asistencia.getFecha());
        LocalDateTime salidaEfectiva = topeSalida != null && fechaHoraOperativa.isAfter(topeSalida)
                ? topeSalida
                : fechaHoraOperativa;
        asistencia.setFechaHoraSalida(salidaEfectiva);
        asistencia.setEstadoActual(EstadoAsistencia.OFFLINE);
        recalcularMinutos(asistencia);
        Asistencia savedAsistencia = asistenciaRepository.save(asistencia);
        attendanceRealtimeNotifier.publishAfterCommit(
                "ASISTENCIA_ESTADO_CAMBIADO",
                "SALIDA",
                savedAsistencia.getIdEmpleado(),
                savedAsistencia.getFecha(),
                estadoAnterior
        );
        return toDetalleOperativoResponse(savedAsistencia);
    }

    @Override
    @Transactional
    public DetalleAsistenciaResponse iniciarAlmuerzo(MovimientoAsistenciaRequest request) {
        LocalDateTime fechaHoraOperativa = OperationalDateTime.nowLocalDateTime();
        validarMovimientoDentroDeHorario(currentUser.empleadoID(), fechaHoraOperativa);
        Asistencia asistencia = getAsistenciaOperativa(currentUser.empleadoID(), fechaHoraOperativa.toLocalDate());
        EstadoAsistencia estadoAnterior = asistencia.getEstadoActual();
        validarEstadoOnline(asistencia);
        if (asistencia.getFechaHoraInicioAlmuerzo() != null) {
            throw new BadRequestException("El almuerzo ya fue iniciado para la fecha");
        }
        asistencia.setFechaHoraInicioAlmuerzo(fechaHoraOperativa);
        asistencia.setEstadoActual(EstadoAsistencia.ALMUERZO);
        Asistencia savedAsistencia = asistenciaRepository.save(asistencia);
        attendanceRealtimeNotifier.publishAfterCommit(
                "ASISTENCIA_ESTADO_CAMBIADO",
                "ALMUERZO_INICIO",
                savedAsistencia.getIdEmpleado(),
                savedAsistencia.getFecha(),
                estadoAnterior
        );
        return toDetalleOperativoResponse(savedAsistencia);
    }

    @Override
    @Transactional
    public DetalleAsistenciaResponse finalizarAlmuerzo(MovimientoAsistenciaRequest request) {
        LocalDateTime fechaHoraOperativa = OperationalDateTime.nowLocalDateTime();
        validarMovimientoDentroDeHorario(currentUser.empleadoID(), fechaHoraOperativa);
        Asistencia asistencia = getAsistenciaOperativa(currentUser.empleadoID(), fechaHoraOperativa.toLocalDate());
        EstadoAsistencia estadoAnterior = asistencia.getEstadoActual();
        if (asistencia.getEstadoActual() != EstadoAsistencia.ALMUERZO || asistencia.getFechaHoraInicioAlmuerzo() == null) {
            throw new BadRequestException("No existe un almuerzo activo");
        }
        asistencia.setFechaHoraFinAlmuerzo(fechaHoraOperativa);
        asistencia.setMinutosAlmuerzoTomados((int) Duration.between(
                asistencia.getFechaHoraInicioAlmuerzo(),
                asistencia.getFechaHoraFinAlmuerzo()
        ).toMinutes());
        asistencia.setEstadoActual(EstadoAsistencia.ONLINE);
        Asistencia savedAsistencia = asistenciaRepository.save(asistencia);
        attendanceRealtimeNotifier.publishAfterCommit(
                "ASISTENCIA_ESTADO_CAMBIADO",
                "ALMUERZO_FIN",
                savedAsistencia.getIdEmpleado(),
                savedAsistencia.getFecha(),
                estadoAnterior
        );
        return toDetalleOperativoResponse(savedAsistencia);
    }

    @Override
    @Transactional
    public DetalleAsistenciaResponse iniciarServicios(MovimientoAsistenciaRequest request) {
        LocalDateTime fechaHoraOperativa = OperationalDateTime.nowLocalDateTime();
        validarMovimientoDentroDeHorario(currentUser.empleadoID(), fechaHoraOperativa);
        Asistencia asistencia = getAsistenciaOperativa(currentUser.empleadoID(), fechaHoraOperativa.toLocalDate());
        EstadoAsistencia estadoAnterior = asistencia.getEstadoActual();
        validarEstadoOnline(asistencia);
        if (asistencia.getFechaHoraInicioServiciosActual() != null) {
            throw new BadRequestException("Ya existe un tiempo de servicios en curso");
        }
        asistencia.setFechaHoraInicioServiciosActual(fechaHoraOperativa);
        asistencia.setEstadoActual(EstadoAsistencia.SERVICIOS);
        Asistencia savedAsistencia = asistenciaRepository.save(asistencia);
        attendanceRealtimeNotifier.publishAfterCommit(
                "ASISTENCIA_ESTADO_CAMBIADO",
                "SERVICIOS_INICIO",
                savedAsistencia.getIdEmpleado(),
                savedAsistencia.getFecha(),
                estadoAnterior
        );
        return toDetalleOperativoResponse(savedAsistencia);
    }

    @Override
    @Transactional
    public DetalleAsistenciaResponse finalizarServicios(MovimientoAsistenciaRequest request) {
        LocalDateTime fechaHoraOperativa = OperationalDateTime.nowLocalDateTime();
        validarMovimientoDentroDeHorario(currentUser.empleadoID(), fechaHoraOperativa);
        Asistencia asistencia = getAsistenciaOperativa(currentUser.empleadoID(), fechaHoraOperativa.toLocalDate());
        EstadoAsistencia estadoAnterior = asistencia.getEstadoActual();
        if (asistencia.getEstadoActual() != EstadoAsistencia.SERVICIOS || asistencia.getFechaHoraInicioServiciosActual() == null) {
            throw new BadRequestException("No existe un tiempo de servicios en curso");
        }
        int minutos = (int) Duration.between(asistencia.getFechaHoraInicioServiciosActual(), fechaHoraOperativa).toMinutes();
        asistencia.setMinutosServiciosAcumulados(asistencia.getMinutosServiciosAcumulados() + Math.max(minutos, 0));
        asistencia.setFechaHoraInicioServiciosActual(null);
        asistencia.setExcedioServicios(asistencia.getMinutosServiciosAcumulados() > asistencia.getMinutosServiciosPermitidos());
        asistencia.setEstadoActual(EstadoAsistencia.ONLINE);
        Asistencia savedAsistencia = asistenciaRepository.save(asistencia);
        attendanceRealtimeNotifier.publishAfterCommit(
                "ASISTENCIA_ESTADO_CAMBIADO",
                "SERVICIOS_FIN",
                savedAsistencia.getIdEmpleado(),
                savedAsistencia.getFecha(),
                estadoAnterior
        );
        return toDetalleOperativoResponse(savedAsistencia);
    }

    @Override
    @Transactional(readOnly = true)
    public AsistenciaMesResponse getAsistenciaMes(Integer anio, Integer mes) {
        return getAsistenciaMesByEmpleado(currentUser.empleadoID(), anio, mes);
    }

    @Transactional(readOnly = true)
    private AsistenciaMesResponse getAsistenciaMesByEmpleado(Long idEmpleado, Integer anio, Integer mes) {
        YearMonth yearMonth = resolvePeriodoMensual(anio, mes);
        LocalDate hoy = OperationalDateTime.today();
        if (yearMonth.isAfter(YearMonth.from(hoy))) {
            return AsistenciaMesResponse.builder()
                    .idEmpleado(idEmpleado)
                    .anio(yearMonth.getYear())
                    .mes(yearMonth.getMonthValue())
                    .dias(List.of())
                    .build();
        }

        LocalDate desde = yearMonth.atDay(1);
        LocalDate hasta = yearMonth.equals(YearMonth.from(hoy)) ? hoy : yearMonth.atEndOfMonth();
        Map<LocalDate, Asistencia> asistenciasPorFecha = asistenciaRepository
                .findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(idEmpleado, desde, hasta)
                .stream()
                .collect(LinkedHashMap::new, (map, asistencia) -> map.put(asistencia.getFecha(), asistencia), Map::putAll);

        Map<Long, List<AsistenciaTramo>> tramosPorAsistencia = cargarTramosPorAsistencia(asistenciasPorFecha.values());
        List<AsistenciaDiaCalendarioResponse> dias = new ArrayList<>();
        for (LocalDate fecha = desde; !fecha.isAfter(hasta); fecha = fecha.plusDays(1)) {
            Asistencia asistencia = asistenciasPorFecha.get(fecha);
            dias.add(construirDiaCalendario(idEmpleado, fecha, asistencia, tramosDe(asistencia, tramosPorAsistencia)));
        }

        return AsistenciaMesResponse.builder()
                .idEmpleado(idEmpleado)
                .anio(yearMonth.getYear())
                .mes(yearMonth.getMonthValue())
                .dias(dias)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DetalleAsistenciaResponse getAsistenciaDia(LocalDate fecha) {
        return getAsistenciaDiaByEmpleado(currentUser.empleadoID(), fecha);
    }

    @Transactional(readOnly = true)
    private DetalleAsistenciaResponse getAsistenciaDiaByEmpleado(Long idEmpleado, LocalDate fecha) {
        return asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, fecha)
                .map(this::toDetalleOperativoResponse)
                .orElseGet(() -> construirDetalleSinAsistencia(idEmpleado, fecha));
    }

    @Override
    @Transactional(readOnly = true)
    public CumplimientoResumenResponse getCumplimientoResumen(ConsultaCumplimientoRequest request) {
        ConsultaRangoNormalizada consulta = normalizarConsultaCumplimiento(request);
        Map<Long, Map<LocalDate, Asistencia>> asistenciasPorEmpleado = cargarAsistenciasPorEmpleado(consulta.empleadoIds(), consulta.desde(), consulta.hasta());

        List<CumplimientoResumenEmpleadoResponse> empleados = consulta.empleadoIds().stream()
                .map(idEmpleado -> construirResumenCumplimientoEmpleado(
                        idEmpleado,
                        consulta.desde(),
                        consulta.hasta(),
                        asistenciasPorEmpleado.getOrDefault(idEmpleado, Map.of())
                ))
                .toList();

        return CumplimientoResumenResponse.builder()
                .desde(consulta.desde())
                .hasta(consulta.hasta())
                .empleados(empleados)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CumplimientoDetalleResponse getCumplimientoDetalle(ConsultaCumplimientoRequest request) {
        ConsultaRangoNormalizada consulta = normalizarConsultaCumplimiento(request);
        Map<Long, Map<LocalDate, Asistencia>> asistenciasPorEmpleado = cargarAsistenciasPorEmpleado(consulta.empleadoIds(), consulta.desde(), consulta.hasta());

        List<CumplimientoDetalleEmpleadoResponse> empleados = consulta.empleadoIds().stream()
                .map(idEmpleado -> construirDetalleCumplimientoEmpleado(
                        idEmpleado,
                        consulta.desde(),
                        consulta.hasta(),
                        asistenciasPorEmpleado.getOrDefault(idEmpleado, Map.of())
                ))
                .toList();

        return CumplimientoDetalleResponse.builder()
                .desde(consulta.desde())
                .hasta(consulta.hasta())
                .empleados(empleados)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EstadoMonitorResponse> getEstadosMonitor(ConsultaMonitoreoRequest request) {
        return attendanceMonitorResolver.getEstadosMonitor(request);
    }

    @Override
    @Transactional(readOnly = true)
    public AmpliacionContextoResponse getContextoAmpliacion(Long idEmpleado, LocalDate fecha) {
        LocalDate consulta = OperationalDateTime.resolveDate(fecha);
        Asistencia asistencia = asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, consulta).orElse(null);
        try {
            Horario horario = horarioService.getHorarioById(horarioService.getHorarioVigente(idEmpleado, consulta).getId());
            ProgramacionDiaria programacion = resolverProgramacion(horario, consulta);
            return AmpliacionContextoResponse.builder()
                    .idEmpleado(idEmpleado)
                    .fecha(consulta)
                    .tieneHorarioVigente(true)
                    .laborable(programacion.laborable())
                    .entradaProgramada(asistencia != null ? asistencia.getEntradaProgramada() : programacion.horaEntrada())
                    .salidaProgramada(asistencia != null ? asistencia.getSalidaProgramada() : programacion.horaSalida())
                    .estadoActual(asistencia != null ? asistencia.getEstadoActual() : EstadoAsistencia.OFFLINE)
                    .tieneRegistro(asistencia != null && asistencia.getFechaHoraIngreso() != null)
                    .jornadaCerrada(asistencia != null && asistencia.getFechaHoraSalida() != null)
                    .build();
        } catch (NotFoundException e) {
            return AmpliacionContextoResponse.builder()
                    .idEmpleado(idEmpleado)
                    .fecha(consulta)
                    .tieneHorarioVigente(false)
                    .laborable(false)
                    .estadoActual(EstadoAsistencia.OFFLINE)
                    .tieneRegistro(false)
                    .jornadaCerrada(false)
                    .build();
        }
    }

    @Override
    @Transactional
    public AmpliacionHorarioResponse registrarAmpliacion(Long idEmpleado, RegistrarAmpliacionRequest request) {
        LocalDate fecha = request.getFecha() != null ? request.getFecha() : OperationalDateTime.today();
        if (request.getHoraEntrada() == null && request.getHoraSalida() == null) {
            throw new BadRequestException("Indica una nueva hora de entrada y/o de salida para la ampliacion");
        }

        Horario horario = horarioService.getHorarioById(horarioService.getHorarioVigente(idEmpleado, fecha).getId());
        ExcepcionHorario excepcionExistente = excepcionHorarioRepository.findByHorarioIdAndFecha(horario.getId(), fecha).orElse(null);
        if (excepcionExistente != null && excepcionExistente.getTipo() != TipoExcepcionHorario.AMPLIACION) {
            throw new ConflictException(
                    "Ese dia ya tiene una modificacion de horario; la ampliacion no puede combinarse. Coordina con RRHH",
                    fecha);
        }

        ProgramacionDiaria base = resolverProgramacion(horario, fecha);
        if (!base.laborable()) {
            return habilitarJornadaExtraordinaria(
                    idEmpleado,
                    horario,
                    fecha,
                    request,
                    currentUser.empleadoID(),
                    excepcionExistente
            );
        }
        if (base.horaEntrada() == null || base.horaSalida() == null) {
            throw new BadRequestException("El horario del dia no tiene hora de entrada o salida configurada");
        }

        Asistencia asistencia = asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, fecha).orElse(null);
        boolean jornadaCerrada = asistencia != null && asistencia.getFechaHoraSalida() != null;
        Long creadoPor = currentUser.empleadoID();

        if (jornadaCerrada) {
            return reabrirJornada(idEmpleado, horario, fecha, asistencia, request, creadoPor, excepcionExistente);
        }
        return ampliarJornadaContinua(idEmpleado, horario, fecha, base, asistencia, request, creadoPor, excepcionExistente);
    }

    /** Habilita una jornada completa en un dia que originalmente era de descanso. */
    private AmpliacionHorarioResponse habilitarJornadaExtraordinaria(
            Long idEmpleado,
            Horario horario,
            LocalDate fecha,
            RegistrarAmpliacionRequest request,
            Long creadoPor,
            ExcepcionHorario excepcionExistente
    ) {
        if (request.getHoraEntrada() == null || request.getHoraSalida() == null) {
            throw new BadRequestException("Para habilitar un dia de descanso indica la hora de entrada y de salida");
        }
        if (!request.getHoraSalida().isAfter(request.getHoraEntrada())) {
            throw new BadRequestException("La hora de salida debe ser posterior a la hora de entrada");
        }

        ExcepcionHorario excepcion = upsertAmpliacion(
                excepcionExistente,
                horario,
                fecha,
                request.getHoraEntrada(),
                request.getHoraSalida(),
                null,
                null,
                request.getMotivo(),
                creadoPor
        );

        publicarAmpliacion(idEmpleado, fecha, false);
        return AmpliacionHorarioResponse.builder()
                .idEmpleado(idEmpleado)
                .fecha(fecha)
                .excepcion(horarioMapper.toResponse(excepcion))
                .resultado("HABILITADA")
                .entradaEfectiva(request.getHoraEntrada())
                .salidaEfectiva(request.getHoraSalida())
                .jornadaReabierta(false)
                .build();
    }

    /** Casos 1 y 2: extender la entrada (antes) y/o la salida (despues) de una jornada continua. */
    private AmpliacionHorarioResponse ampliarJornadaContinua(Long idEmpleado, Horario horario, LocalDate fecha,
                                                             ProgramacionDiaria base, Asistencia asistencia,
                                                             RegistrarAmpliacionRequest request, Long creadoPor,
                                                             ExcepcionHorario excepcionExistente) {
        LocalTime nuevaEntrada = base.horaEntrada();
        LocalTime nuevaSalida = base.horaSalida();

        if (request.getHoraEntrada() != null) {
            if (!request.getHoraEntrada().isBefore(base.horaEntrada())) {
                throw new BadRequestException("La hora de entrada debe ser anterior a la actual (" + base.horaEntrada() + ")");
            }
            nuevaEntrada = request.getHoraEntrada();
        }
        if (request.getHoraSalida() != null) {
            if (!request.getHoraSalida().isAfter(base.horaSalida())) {
                throw new BadRequestException("La hora de salida debe ser posterior a la actual (" + base.horaSalida() + ")");
            }
            nuevaSalida = request.getHoraSalida();
        }

        ExcepcionHorario excepcion = upsertAmpliacion(excepcionExistente, horario, fecha, nuevaEntrada, nuevaSalida,
                base.inicioAlmuerzo(), base.finAlmuerzo(), request.getMotivo(), creadoPor);

        // Si ya existe asistencia, refrescar el snapshot para que monitor, tope de salida y objetivo reflejen
        // la ventana nueva (el snapshot se congela al ingresar y antes quedaba desfasado).
        if (asistencia != null) {
            int objetivo = calcularMinutosObjetivo(nuevaEntrada, nuevaSalida, base.inicioAlmuerzo(), base.finAlmuerzo());
            asistencia.setEntradaProgramada(nuevaEntrada);
            asistencia.setSalidaProgramada(nuevaSalida);
            asistencia.setInicioAlmuerzoProgramado(base.inicioAlmuerzo());
            asistencia.setFinAlmuerzoProgramado(base.finAlmuerzo());
            asistencia.setMinutosObjetivoDia(objetivo);
            asistencia.setMinutosBalance(asistencia.getMinutosTrabajados() - objetivo);
            asistenciaRepository.save(asistencia);
        }

        publicarAmpliacion(idEmpleado, fecha, false);
        return AmpliacionHorarioResponse.builder()
                .idEmpleado(idEmpleado)
                .fecha(fecha)
                .excepcion(horarioMapper.toResponse(excepcion))
                .resultado("EXTENDIDA")
                .entradaEfectiva(nuevaEntrada)
                .salidaEfectiva(nuevaSalida)
                .jornadaReabierta(false)
                .build();
    }

    /** Caso 3: reabrir una jornada ya cerrada con un tramo nuevo (la tarde). */
    private AmpliacionHorarioResponse reabrirJornada(Long idEmpleado, Horario horario, LocalDate fecha,
                                                     Asistencia asistencia, RegistrarAmpliacionRequest request,
                                                     Long creadoPor, ExcepcionHorario excepcionExistente) {
        if (request.getHoraEntrada() == null || request.getHoraSalida() == null) {
            throw new BadRequestException("Para reabrir una jornada cerrada indica la hora de entrada y de salida del nuevo tramo");
        }
        LocalTime entradaTramo = request.getHoraEntrada();
        LocalTime salidaTramo = request.getHoraSalida();
        if (!salidaTramo.isAfter(entradaTramo)) {
            throw new BadRequestException("La hora de salida debe ser posterior a la de entrada");
        }
        LocalTime salidaCerrada = asistencia.getSalidaProgramada();
        if (salidaCerrada != null && entradaTramo.isBefore(salidaCerrada)) {
            throw new BadRequestException("El nuevo tramo debe iniciar despues del cierre de la jornada (" + salidaCerrada + ")");
        }

        // Archivar el tramo recien cerrado (solo su porcion, descontando tramos previos del dia si los hubiera).
        int previosObjetivo = 0;
        int previosTrabajados = 0;
        for (AsistenciaTramo tramoPrevio : asistenciaTramoRepository.findByAsistenciaIdOrderByIdAsc(asistencia.getId())) {
            previosObjetivo += tramoPrevio.getMinutosObjetivo();
            previosTrabajados += tramoPrevio.getMinutosTrabajados();
        }
        AsistenciaTramo cerrado = AsistenciaTramo.builder()
                .asistencia(asistencia)
                .origen(OrigenTramo.BASE)
                .entradaProgramada(asistencia.getEntradaProgramada())
                .salidaProgramada(asistencia.getSalidaProgramada())
                .inicioAlmuerzoProgramado(asistencia.getInicioAlmuerzoProgramado())
                .finAlmuerzoProgramado(asistencia.getFinAlmuerzoProgramado())
                .fechaHoraIngreso(asistencia.getFechaHoraIngreso())
                .fechaHoraSalida(asistencia.getFechaHoraSalida())
                .minutosObjetivo(Math.max(asistencia.getMinutosObjetivoDia() - previosObjetivo, 0))
                .minutosTrabajados(Math.max(asistencia.getMinutosTrabajados() - previosTrabajados, 0))
                .minutosAlmuerzoTomados(asistencia.getMinutosAlmuerzoTomados())
                .minutosServiciosAcumulados(asistencia.getMinutosServiciosAcumulados())
                .motivo(request.getMotivo())
                .creadoPor(creadoPor)
                .build();
        asistenciaTramoRepository.save(cerrado);

        // Reiniciar la fila principal para el tramo nuevo. minutosTrabajados se conserva como total
        // acumulado del dia; al cerrar el tramo nuevo, recalcularMinutos sumara los tramos archivados.
        int objetivoNuevo = calcularMinutosObjetivo(entradaTramo, salidaTramo, null, null);
        asistencia.setEntradaProgramada(entradaTramo);
        asistencia.setSalidaProgramada(salidaTramo);
        asistencia.setInicioAlmuerzoProgramado(null);
        asistencia.setFinAlmuerzoProgramado(null);
        asistencia.setFechaHoraIngreso(null);
        asistencia.setFechaHoraSalida(null);
        asistencia.setFechaHoraInicioAlmuerzo(null);
        asistencia.setFechaHoraFinAlmuerzo(null);
        asistencia.setFechaHoraInicioServiciosActual(null);
        asistencia.setEstadoActual(EstadoAsistencia.OFFLINE);
        asistencia.setMinutosAlmuerzoTomados(0);
        asistencia.setMinutosServiciosAcumulados(0);
        asistencia.setExcedioServicios(Boolean.FALSE);
        asistencia.setMinutosObjetivoDia(asistencia.getMinutosObjetivoDia() + objetivoNuevo);
        asistencia.setMinutosBalance(asistencia.getMinutosTrabajados() - asistencia.getMinutosObjetivoDia());
        asistenciaRepository.save(asistencia);

        ExcepcionHorario excepcion = upsertAmpliacion(excepcionExistente, horario, fecha, entradaTramo, salidaTramo,
                null, null, request.getMotivo(), creadoPor);

        publicarAmpliacion(idEmpleado, fecha, true);
        return AmpliacionHorarioResponse.builder()
                .idEmpleado(idEmpleado)
                .fecha(fecha)
                .excepcion(horarioMapper.toResponse(excepcion))
                .resultado("REABIERTA")
                .entradaEfectiva(entradaTramo)
                .salidaEfectiva(salidaTramo)
                .jornadaReabierta(true)
                .build();
    }

    private ExcepcionHorario upsertAmpliacion(ExcepcionHorario existente, Horario horario, LocalDate fecha,
                                              LocalTime entrada, LocalTime salida, LocalTime inicioAlmuerzo,
                                              LocalTime finAlmuerzo, String motivo, Long creadoPor) {
        ExcepcionHorario excepcion = existente != null ? existente : new ExcepcionHorario();
        excepcion.setHorario(horario);
        excepcion.setFecha(fecha);
        excepcion.setTipo(TipoExcepcionHorario.AMPLIACION);
        excepcion.setHoraEntrada(entrada);
        excepcion.setHoraSalida(salida);
        excepcion.setInicioAlmuerzo(inicioAlmuerzo);
        excepcion.setFinAlmuerzo(finAlmuerzo);
        excepcion.setLaborable(Boolean.TRUE);
        excepcion.setMotivo(motivo);
        excepcion.setCreadoPor(creadoPor);
        return excepcionHorarioRepository.save(excepcion);
    }

    private void publicarAmpliacion(Long idEmpleado, LocalDate fecha, boolean reabierta) {
        attendanceRealtimeNotifier.publishAfterCommit(
                "EXCEPCION_HORARIO_AFECTADA",
                "EXCEPCION",
                idEmpleado,
                fecha,
                null
        );
        if (reabierta) {
            attendanceRealtimeNotifier.publishAfterCommit(
                    "ASISTENCIA_ESTADO_CAMBIADO",
                    "REAPERTURA",
                    idEmpleado,
                    fecha,
                    null
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> listarEmpleadosJornadaAbiertaVencida() {
        LocalDate hoy = OperationalDateTime.today();
        LocalDateTime ahora = OperationalDateTime.nowLocalDateTime();
        return asistenciaRepository
                .findByFechaAndFechaHoraIngresoIsNotNullAndFechaHoraSalidaIsNull(hoy).stream()
                .filter(asistencia -> asistencia.getEstadoActual() != EstadoAsistencia.OFFLINE)
                .filter(asistencia -> {
                    LocalDateTime topeSalida = resolverTopeSalidaProgramada(asistencia.getIdEmpleado(), asistencia.getFecha());
                    return topeSalida != null && ahora.isAfter(topeSalida);
                })
                .map(Asistencia::getIdEmpleado)
                .toList();
    }

    /**
     * Cierre automatico de la jornada (safety net). Lo invoca el job de reconciliacion del gateway
     * cuando el empleado ya no esta conectado y su horario termino, para garantizar que quede su
     * marca OFFLINE aunque haya cerrado el navegador sin marcar. Es idempotente: si la jornada ya
     * esta cerrada o aun no vence, no hace nada. La salida se estampa en la salida programada.
     */
    @Override
    @Transactional
    public DetalleAsistenciaResponse autoCerrarJornada(Long idEmpleado) {
        LocalDate hoy = OperationalDateTime.today();
        Asistencia asistencia = asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, hoy).orElse(null);
        if (asistencia == null
                || asistencia.getFechaHoraIngreso() == null
                || asistencia.getFechaHoraSalida() != null
                || asistencia.getEstadoActual() == EstadoAsistencia.OFFLINE) {
            return asistencia == null ? null : toDetalleOperativoResponse(asistencia);
        }

        LocalDateTime topeSalida = resolverTopeSalidaProgramada(idEmpleado, hoy);
        LocalDateTime ahora = OperationalDateTime.nowLocalDateTime();
        if (topeSalida == null || !ahora.isAfter(topeSalida)) {
            // Aun dentro de su horario: no corresponde cerrar todavia.
            return toDetalleOperativoResponse(asistencia);
        }

        EstadoAsistencia estadoAnterior = asistencia.getEstadoActual();
        finalizarPausaPendiente(asistencia, topeSalida);
        asistencia.setFechaHoraSalida(topeSalida);
        asistencia.setEstadoActual(EstadoAsistencia.OFFLINE);
        recalcularMinutos(asistencia);
        Asistencia savedAsistencia = asistenciaRepository.save(asistencia);
        attendanceRealtimeNotifier.publishAfterCommit(
                "ASISTENCIA_ESTADO_CAMBIADO",
                "AUTO_CIERRE",
                savedAsistencia.getIdEmpleado(),
                savedAsistencia.getFecha(),
                estadoAnterior
        );
        return toDetalleOperativoResponse(savedAsistencia);
    }

    /**
     * Si la jornada quedo abierta en una pausa (almuerzo/servicios) al momento del cierre automatico,
     * la cerramos topada en la salida programada para no contar tiempo de pausa fuera de horario.
     */
    private void finalizarPausaPendiente(Asistencia asistencia, LocalDateTime topeSalida) {
        if (asistencia.getEstadoActual() == EstadoAsistencia.ALMUERZO
                && asistencia.getFechaHoraInicioAlmuerzo() != null
                && asistencia.getFechaHoraFinAlmuerzo() == null) {
            LocalDateTime fin = asistencia.getFechaHoraInicioAlmuerzo().isAfter(topeSalida)
                    ? asistencia.getFechaHoraInicioAlmuerzo()
                    : topeSalida;
            asistencia.setFechaHoraFinAlmuerzo(fin);
            asistencia.setMinutosAlmuerzoTomados((int) Math.max(
                    Duration.between(asistencia.getFechaHoraInicioAlmuerzo(), fin).toMinutes(), 0));
        }
        if (asistencia.getEstadoActual() == EstadoAsistencia.SERVICIOS
                && asistencia.getFechaHoraInicioServiciosActual() != null) {
            LocalDateTime fin = asistencia.getFechaHoraInicioServiciosActual().isAfter(topeSalida)
                    ? asistencia.getFechaHoraInicioServiciosActual()
                    : topeSalida;
            int minutos = (int) Math.max(
                    Duration.between(asistencia.getFechaHoraInicioServiciosActual(), fin).toMinutes(), 0);
            asistencia.setMinutosServiciosAcumulados(asistencia.getMinutosServiciosAcumulados() + minutos);
            asistencia.setFechaHoraInicioServiciosActual(null);
            asistencia.setExcedioServicios(
                    asistencia.getMinutosServiciosAcumulados() > asistencia.getMinutosServiciosPermitidos());
        }
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

    private AsistenciaDiaCalendarioResponse construirDiaCalendario(Long idEmpleado, LocalDate fecha, Asistencia asistencia,
                                                                   List<AsistenciaTramo> tramosArchivados) {
        ProgramacionDiaria programacion = resolverProgramacionMensual(idEmpleado, fecha, asistencia);
        return AsistenciaDiaCalendarioResponse.builder()
                .fecha(fecha)
                .laborable(programacion.laborable())
                .horaEntradaEstablecida(asistencia != null ? asistencia.getEntradaProgramada() : programacion.horaEntrada())
                .horaEntradaAsistencia(asistencia != null && asistencia.getFechaHoraIngreso() != null ? asistencia.getFechaHoraIngreso().toLocalTime() : null)
                .horaSalidaEstablecida(asistencia != null ? asistencia.getSalidaProgramada() : programacion.horaSalida())
                .horaSalidaAsistencia(asistencia != null && asistencia.getFechaHoraSalida() != null ? asistencia.getFechaHoraSalida().toLocalTime() : null)
                .jornadaCerrada(asistencia != null && asistencia.getFechaHoraSalida() != null)
                .tramos(construirTramos(asistencia, tramosArchivados))
                .build();
    }

    private CumplimientoResumenEmpleadoResponse construirResumenCumplimientoEmpleado(
            Long idEmpleado,
            LocalDate desde,
            LocalDate hasta,
            Map<LocalDate, Asistencia> asistenciasPorFecha
    ) {
        int diasLaborables = 0;
        int diasConRegistro = 0;
        int diasSinRegistro = 0;
        int diasCerrados = 0;
        int cantidadTardanzas = 0;
        int minutosObjetivo = 0;
        int minutosTrabajados = 0;
        int minutosBalance = 0;
        int minutosServiciosAcumulados = 0;
        int cantidadDiasConExcesoServicios = 0;

        for (LocalDate fecha = desde; !fecha.isAfter(hasta); fecha = fecha.plusDays(1)) {
            Asistencia asistencia = asistenciasPorFecha.get(fecha);
            ProgramacionDiaria programacion = resolverProgramacionMensual(idEmpleado, fecha, asistencia);
            if (!programacion.laborable()) {
                continue;
            }

            diasLaborables++;
            minutosObjetivo += asistencia != null ? asistencia.getMinutosObjetivoDia() : programacion.minutosObjetivo();

            if (asistencia == null || asistencia.getFechaHoraIngreso() == null) {
                diasSinRegistro++;
                continue;
            }

            diasConRegistro++;
            minutosTrabajados += asistencia.getMinutosTrabajados();
            minutosBalance += asistencia.getMinutosBalance();
            minutosServiciosAcumulados += asistencia.getMinutosServiciosAcumulados();

            if (asistencia.getFechaHoraSalida() != null) {
                diasCerrados++;
            }
            if (Boolean.TRUE.equals(asistencia.getExcedioServicios())) {
                cantidadDiasConExcesoServicios++;
            }
            if (esTardanza(asistencia.getFechaHoraIngreso(), asistencia.getEntradaProgramada())) {
                cantidadTardanzas++;
            }
        }

        return CumplimientoResumenEmpleadoResponse.builder()
                .idEmpleado(idEmpleado)
                .diasLaborables(diasLaborables)
                .diasConRegistro(diasConRegistro)
                .diasSinRegistro(diasSinRegistro)
                .diasCerrados(diasCerrados)
                .cantidadTardanzas(cantidadTardanzas)
                .minutosObjetivo(minutosObjetivo)
                .minutosTrabajados(minutosTrabajados)
                .minutosBalance(minutosBalance)
                .minutosServiciosAcumulados(minutosServiciosAcumulados)
                .cantidadDiasConExcesoServicios(cantidadDiasConExcesoServicios)
                .build();
    }

    private CumplimientoDetalleEmpleadoResponse construirDetalleCumplimientoEmpleado(
            Long idEmpleado,
            LocalDate desde,
            LocalDate hasta,
            Map<LocalDate, Asistencia> asistenciasPorFecha
    ) {
        Map<Long, List<AsistenciaTramo>> tramosPorAsistencia = cargarTramosPorAsistencia(asistenciasPorFecha.values());
        List<CumplimientoDetalleDiaResponse> dias = new ArrayList<>();
        for (LocalDate fecha = desde; !fecha.isAfter(hasta); fecha = fecha.plusDays(1)) {
            Asistencia asistencia = asistenciasPorFecha.get(fecha);
            dias.add(construirDetalleCumplimientoDia(idEmpleado, fecha, asistencia, tramosDe(asistencia, tramosPorAsistencia)));
        }

        return CumplimientoDetalleEmpleadoResponse.builder()
                .idEmpleado(idEmpleado)
                .dias(dias)
                .build();
    }

    private CumplimientoDetalleDiaResponse construirDetalleCumplimientoDia(Long idEmpleado, LocalDate fecha, Asistencia asistencia,
                                                                          List<AsistenciaTramo> tramosArchivados) {
        ProgramacionDiaria programacion = resolverProgramacionMensual(idEmpleado, fecha, asistencia);
        LocalTime horaEntradaEstablecida = asistencia != null ? asistencia.getEntradaProgramada() : programacion.horaEntrada();
        LocalTime horaSalidaEstablecida = asistencia != null ? asistencia.getSalidaProgramada() : programacion.horaSalida();
        LocalTime horaEntradaAsistencia = asistencia != null && asistencia.getFechaHoraIngreso() != null ? asistencia.getFechaHoraIngreso().toLocalTime() : null;
        LocalTime horaSalidaAsistencia = asistencia != null && asistencia.getFechaHoraSalida() != null ? asistencia.getFechaHoraSalida().toLocalTime() : null;

        return CumplimientoDetalleDiaResponse.builder()
                .fecha(fecha)
                .laborable(programacion.laborable())
                .horaEntradaEstablecida(horaEntradaEstablecida)
                .horaEntradaAsistencia(horaEntradaAsistencia)
                .horaSalidaEstablecida(horaSalidaEstablecida)
                .horaSalidaAsistencia(horaSalidaAsistencia)
                .jornadaCerrada(asistencia != null && asistencia.getFechaHoraSalida() != null)
                .minutosObjetivoDia(asistencia != null ? asistencia.getMinutosObjetivoDia() : programacion.minutosObjetivo())
                .minutosTrabajados(asistencia != null ? asistencia.getMinutosTrabajados() : 0)
                .minutosBalance(asistencia != null ? asistencia.getMinutosBalance() : 0)
                .minutosServiciosAcumulados(asistencia != null ? asistencia.getMinutosServiciosAcumulados() : 0)
                .excedioServicios(asistencia != null && Boolean.TRUE.equals(asistencia.getExcedioServicios()))
                .tardanza(esTardanza(asistencia != null ? asistencia.getFechaHoraIngreso() : null, horaEntradaEstablecida))
                .tramos(construirTramos(asistencia, tramosArchivados))
                .build();
    }

    private ProgramacionDiaria resolverProgramacionMensual(Long idEmpleado, LocalDate fecha, Asistencia asistencia) {
        if (asistencia != null) {
            return ProgramacionDiaria.builder()
                    .laborable(true)
                    .horaEntrada(asistencia.getEntradaProgramada())
                    .horaSalida(asistencia.getSalidaProgramada())
                    .inicioAlmuerzo(asistencia.getInicioAlmuerzoProgramado())
                    .finAlmuerzo(asistencia.getFinAlmuerzoProgramado())
                    .minutosObjetivo(asistencia.getMinutosObjetivoDia())
                    .build();
        }

        try {
            Horario horario = horarioService.getHorarioById(horarioService.getHorarioVigente(idEmpleado, fecha).getId());
            return resolverProgramacion(horario, fecha);
        } catch (NotFoundException e) {
            return ProgramacionDiaria.builder()
                    .laborable(false)
                    .minutosObjetivo(0)
                    .build();
        }
    }

    private Map<Long, Map<LocalDate, Asistencia>> cargarAsistenciasPorEmpleado(List<Long> empleadoIds, LocalDate desde, LocalDate hasta) {
        Map<Long, Map<LocalDate, Asistencia>> asistenciasPorEmpleado = new LinkedHashMap<>();
        for (Long idEmpleado : empleadoIds) {
            asistenciasPorEmpleado.put(idEmpleado, new LinkedHashMap<>());
        }

        asistenciaRepository.findByIdEmpleadoInAndFechaBetweenOrderByIdEmpleadoAscFechaAsc(empleadoIds, desde, hasta)
                .forEach(asistencia -> asistenciasPorEmpleado
                        .computeIfAbsent(asistencia.getIdEmpleado(), ignored -> new LinkedHashMap<>())
                        .put(asistencia.getFecha(), asistencia));

        return asistenciasPorEmpleado;
    }

    private ConsultaRangoNormalizada normalizarConsultaCumplimiento(ConsultaCumplimientoRequest request) {
        if (request.getDesde().isAfter(request.getHasta())) {
            throw new BadRequestException("desde no puede ser posterior a hasta");
        }

        List<Long> empleadoIds = request.getEmpleadoIds().stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (empleadoIds.isEmpty()) {
            throw new BadRequestException("empleadoIds es obligatorio");
        }

        return new ConsultaRangoNormalizada(empleadoIds, request.getDesde(), request.getHasta());
    }

    private boolean esTardanza(LocalDateTime fechaHoraIngreso, LocalTime horaEntradaEstablecida) {
        return fechaHoraIngreso != null
                && horaEntradaEstablecida != null
                && fechaHoraIngreso.toLocalTime().isAfter(horaEntradaEstablecida);
    }

    private DetalleAsistenciaResponse toDetalleOperativoResponse(Asistencia asistencia) {
        DetalleAsistenciaResponse response = mapper.toDetalleResponse(asistencia);
        boolean dentroHorario = estaDentroHorarioActualizado(asistencia.getIdEmpleado(), asistencia.getFecha());
        response.setDentroHorario(dentroHorario);
        response.setOperativo(esJornadaOperativaAbierta(asistencia));
        return response;
    }

    /**
     * Operativo = jornada de hoy abierta y en curso (ONLINE). Se mantiene true aunque ya haya pasado
     * la hora de salida, hasta que el empleado marque OFFLINE o el cierre automatico cierre la jornada.
     * Asi el OperationalGate sigue habilitado mientras el empleado siga trabajando despues de su salida.
     */
    private boolean esJornadaOperativaAbierta(Asistencia asistencia) {
        return asistencia.getEstadoActual() == EstadoAsistencia.ONLINE
                && asistencia.getFecha().equals(OperationalDateTime.today());
    }

    private DetalleAsistenciaResponse construirDetalleSinAsistencia(Long idEmpleado, LocalDate fecha) {
        try {
            Horario horario = horarioService.getHorarioById(horarioService.getHorarioVigente(idEmpleado, fecha).getId());
            ProgramacionDiaria programacion = resolverProgramacion(horario, fecha);
            boolean dentroHorario = estaDentroHorarioActualizado(idEmpleado, fecha);

            return DetalleAsistenciaResponse.builder()
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
                    .jornadaCerrada(Boolean.FALSE)
                    .dentroHorario(dentroHorario)
                    .operativo(Boolean.FALSE)
                    .build();
        } catch (NotFoundException e) {
            return DetalleAsistenciaResponse.builder()
                    .idEmpleado(idEmpleado)
                    .fecha(fecha)
                    .estadoActual(EstadoAsistencia.OFFLINE)
                    .minutosTrabajados(0)
                    .minutosBalance(0)
                    .minutosAlmuerzoTomados(0)
                    .minutosServiciosAcumulados(0)
                    .excedioServicios(Boolean.FALSE)
                    .jornadaCerrada(Boolean.FALSE)
                    .dentroHorario(Boolean.FALSE)
                    .operativo(Boolean.FALSE)
                    .build();
        }
    }

    private boolean estaDentroHorarioActualizado(Long idEmpleado, LocalDate fecha) {
        LocalDateTime ahora = OperationalDateTime.nowLocalDateTime();
        if (!fecha.equals(ahora.toLocalDate())) {
            return false;
        }

        try {
            ProgramacionDiaria programacion = resolverProgramacionActualizada(idEmpleado, fecha);
            if (!programacion.laborable() || programacion.horaEntrada() == null || programacion.horaSalida() == null) {
                return false;
            }

            LocalTime horaOperacion = ahora.toLocalTime();
            return !horaOperacion.isBefore(programacion.horaEntrada()) && !horaOperacion.isAfter(programacion.horaSalida());
        } catch (NotFoundException e) {
            return false;
        }
    }

    private void validarMovimientoDentroDeHorario(Long idEmpleado, LocalDateTime fechaHora) {
        ProgramacionDiaria programacion = resolverProgramacionActualizada(idEmpleado, fechaHora.toLocalDate());
        if (!programacion.laborable()) {
            throw new BadRequestException("No se puede actualizar asistencia en un dia no laborable");
        }
        if (programacion.horaEntrada() == null || programacion.horaSalida() == null) {
            throw new BadRequestException("El horario del dia no tiene hora de entrada o salida configurada");
        }

        LocalTime horaOperacion = fechaHora.toLocalTime();
        if (horaOperacion.isBefore(programacion.horaEntrada()) || horaOperacion.isAfter(programacion.horaSalida())) {
            throw new BadRequestException("No se puede actualizar asistencia fuera del horario programado del dia");
        }
    }

    /**
     * Validacion para registrar SALIDA. A diferencia del resto de movimientos, se permite
     * marcar la salida DESPUES de la hora de salida programada: el asesor puede cerrar su turno
     * aunque su horario ya termino (por ejemplo, para terminar un lead que tenia en gestion).
     * El tiempo trabajado se topa en la hora de salida programada (ver recalcularMinutos).
     */
    private void validarSalidaPermitida(Long idEmpleado, LocalDateTime fechaHora) {
        ProgramacionDiaria programacion = resolverProgramacionActualizada(idEmpleado, fechaHora.toLocalDate());
        if (!programacion.laborable()) {
            throw new BadRequestException("No se puede registrar salida en un dia no laborable");
        }
        if (programacion.horaEntrada() == null || programacion.horaSalida() == null) {
            throw new BadRequestException("El horario del dia no tiene hora de entrada o salida configurada");
        }
        if (fechaHora.toLocalTime().isBefore(programacion.horaEntrada())) {
            throw new BadRequestException("No se puede registrar salida antes de la hora de entrada");
        }
    }

    private ProgramacionDiaria resolverProgramacionActualizada(Long idEmpleado, LocalDate fecha) {
        Horario horario = horarioService.getHorarioById(horarioService.getHorarioVigente(idEmpleado, fecha).getId());
        return resolverProgramacion(horario, fecha);
    }

    private YearMonth resolvePeriodoMensual(Integer anio, Integer mes) {
        if (anio == null && mes == null) {
            return OperationalDateTime.currentMonth();
        }
        if (anio == null || mes == null) {
            throw new BadRequestException("anio y mes deben enviarse juntos");
        }
        return YearMonth.of(anio, mes);
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
        // El tiempo trabajado se topa en la hora de salida programada: si el asesor cierra su
        // turno despues de su horario (gracia para terminar un lead en gestion), no se cuenta
        // tiempo extra.
        LocalDateTime salidaEfectiva = asistencia.getFechaHoraSalida();
        LocalDateTime topeSalida = resolverTopeSalidaProgramada(asistencia.getIdEmpleado(), asistencia.getFecha());
        if (topeSalida != null && salidaEfectiva.isAfter(topeSalida)) {
            salidaEfectiva = topeSalida;
        }

        long minutosJornada = Duration.between(asistencia.getFechaHoraIngreso(), salidaEfectiva).toMinutes();
        int trabajadosSegmento = (int) Math.max(minutosJornada - asistencia.getMinutosAlmuerzoTomados() - asistencia.getMinutosServiciosAcumulados(), 0);
        // Dia partido (jornada reabierta por ampliacion): se suman los minutos de los tramos ya archivados.
        // En dias normales no hay tramos y el resultado es identico al previo.
        int trabajadosPrevios = sumarMinutosTrabajadosTramos(asistencia.getId());
        int trabajados = trabajadosPrevios + trabajadosSegmento;
        asistencia.setMinutosTrabajados(trabajados);
        asistencia.setMinutosBalance(trabajados - asistencia.getMinutosObjetivoDia());
    }

    private int sumarMinutosTrabajadosTramos(Long asistenciaId) {
        if (asistenciaId == null) {
            return 0;
        }
        return asistenciaTramoRepository.findByAsistenciaIdOrderByIdAsc(asistenciaId).stream()
                .mapToInt(AsistenciaTramo::getMinutosTrabajados)
                .sum();
    }

    private Map<Long, List<AsistenciaTramo>> cargarTramosPorAsistencia(Collection<Asistencia> asistencias) {
        List<Long> ids = asistencias.stream().filter(Objects::nonNull).map(Asistencia::getId).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, List<AsistenciaTramo>> porAsistencia = new LinkedHashMap<>();
        for (AsistenciaTramo tramo : asistenciaTramoRepository.findByAsistenciaIdInOrderByAsistenciaIdAscIdAsc(ids)) {
            porAsistencia.computeIfAbsent(tramo.getAsistencia().getId(), ignored -> new ArrayList<>()).add(tramo);
        }
        return porAsistencia;
    }

    private List<AsistenciaTramo> tramosDe(Asistencia asistencia, Map<Long, List<AsistenciaTramo>> porAsistencia) {
        if (asistencia == null) {
            return List.of();
        }
        return porAsistencia.getOrDefault(asistencia.getId(), List.of());
    }

    /**
     * Desglose de tramos de un dia. Solo se llena cuando hubo reapertura (hay tramos archivados):
     * lista los tramos cerrados mas el tramo actual sintetizado de la fila de asistencia, de modo que
     * un dia partido (p. ej. 10-13 + 15-17) se muestre completo. En dias normales devuelve vacio.
     */
    private List<TramoAsistenciaResponse> construirTramos(Asistencia asistencia, List<AsistenciaTramo> tramosArchivados) {
        if (asistencia == null || tramosArchivados == null || tramosArchivados.isEmpty()) {
            return List.of();
        }

        List<TramoAsistenciaResponse> tramos = new ArrayList<>();
        int previosObjetivo = 0;
        int previosTrabajados = 0;
        for (AsistenciaTramo tramo : tramosArchivados) {
            tramos.add(TramoAsistenciaResponse.builder()
                    .origen(tramo.getOrigen())
                    .horaEntradaEstablecida(tramo.getEntradaProgramada())
                    .horaSalidaEstablecida(tramo.getSalidaProgramada())
                    .horaEntradaAsistencia(tramo.getFechaHoraIngreso() != null ? tramo.getFechaHoraIngreso().toLocalTime() : null)
                    .horaSalidaAsistencia(tramo.getFechaHoraSalida() != null ? tramo.getFechaHoraSalida().toLocalTime() : null)
                    .minutosObjetivo(tramo.getMinutosObjetivo())
                    .minutosTrabajados(tramo.getMinutosTrabajados())
                    .motivo(tramo.getMotivo())
                    .creadoPor(tramo.getCreadoPor())
                    .build());
            previosObjetivo += tramo.getMinutosObjetivo();
            previosTrabajados += tramo.getMinutosTrabajados();
        }

        tramos.add(TramoAsistenciaResponse.builder()
                .origen(OrigenTramo.AMPLIACION)
                .horaEntradaEstablecida(asistencia.getEntradaProgramada())
                .horaSalidaEstablecida(asistencia.getSalidaProgramada())
                .horaEntradaAsistencia(asistencia.getFechaHoraIngreso() != null ? asistencia.getFechaHoraIngreso().toLocalTime() : null)
                .horaSalidaAsistencia(asistencia.getFechaHoraSalida() != null ? asistencia.getFechaHoraSalida().toLocalTime() : null)
                .minutosObjetivo(Math.max(asistencia.getMinutosObjetivoDia() - previosObjetivo, 0))
                .minutosTrabajados(Math.max(asistencia.getMinutosTrabajados() - previosTrabajados, 0))
                .build());
        return tramos;
    }

    private LocalDateTime resolverTopeSalidaProgramada(Long idEmpleado, LocalDate fecha) {
        try {
            ProgramacionDiaria programacion = resolverProgramacionActualizada(idEmpleado, fecha);
            if (programacion.horaSalida() == null) {
                return null;
            }
            LocalDateTime topeSalida = LocalDateTime.of(fecha, programacion.horaSalida());
            if (programacion.horaEntrada() != null && !programacion.horaSalida().isAfter(programacion.horaEntrada())) {
                topeSalida = topeSalida.plusDays(1);
            }
            return topeSalida;
        } catch (NotFoundException e) {
            return null;
        }
    }

    private int calcularMinutosObjetivo(LocalTime entrada, LocalTime salida, LocalTime inicioAlmuerzo, LocalTime finAlmuerzo) {
        if (entrada == null || salida == null) {
            return 0;
        }
        int minutosBase = calcularMinutosEntre(entrada, salida);
        int minutosAlmuerzo = inicioAlmuerzo != null && finAlmuerzo != null
                ? calcularMinutosEntre(inicioAlmuerzo, finAlmuerzo)
                : 0;
        return Math.max(minutosBase - minutosAlmuerzo, 0);
    }

    private int calcularMinutosEntre(LocalTime inicio, LocalTime fin) {
        int minutos = (int) Duration.between(inicio, fin).toMinutes();
        return minutos <= 0 ? minutos + 24 * 60 : minutos;
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

    private record ConsultaRangoNormalizada(
            List<Long> empleadoIds,
            LocalDate desde,
            LocalDate hasta
    ) {}

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
