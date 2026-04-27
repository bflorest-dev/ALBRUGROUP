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
import pe.albrugroup.schedule_service.entity.request.asistencia.ConsultaCumplimientoRequest;
import pe.albrugroup.schedule_service.entity.request.asistencia.ConsultaMonitoreoRequest;
import pe.albrugroup.schedule_service.entity.request.asistencia.MovimientoAsistenciaRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.AsistenciaDiaCalendarioResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.AsistenciaMesResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoDetalleDiaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoDetalleEmpleadoResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoDetalleResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoResumenEmpleadoResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoResumenResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.EstadoMonitorResponse;
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
import java.util.ArrayList;
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
    public AsistenciaMesResponse getAsistenciaMes(Integer anio, Integer mes) {
        return getAsistenciaMesByEmpleado(currentUser.empleadoID(), anio, mes);
    }

    @Transactional(readOnly = true)
    private AsistenciaMesResponse getAsistenciaMesByEmpleado(Long idEmpleado, Integer anio, Integer mes) {
        YearMonth yearMonth = resolvePeriodoMensual(anio, mes);
        LocalDate hoy = LocalDate.now();
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

        List<AsistenciaDiaCalendarioResponse> dias = new ArrayList<>();
        for (LocalDate fecha = desde; !fecha.isAfter(hasta); fecha = fecha.plusDays(1)) {
            dias.add(construirDiaCalendario(idEmpleado, fecha, asistenciasPorFecha.get(fecha)));
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
        return mapper.toDetalleResponse(getAsistenciaOperativa(idEmpleado, fecha));
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

    private AsistenciaDiaCalendarioResponse construirDiaCalendario(Long idEmpleado, LocalDate fecha, Asistencia asistencia) {
        ProgramacionDiaria programacion = resolverProgramacionMensual(idEmpleado, fecha, asistencia);
        return AsistenciaDiaCalendarioResponse.builder()
                .fecha(fecha)
                .laborable(programacion.laborable())
                .horaEntradaEstablecida(asistencia != null ? asistencia.getEntradaProgramada() : programacion.horaEntrada())
                .horaEntradaAsistencia(asistencia != null && asistencia.getFechaHoraIngreso() != null ? asistencia.getFechaHoraIngreso().toLocalTime() : null)
                .horaSalidaEstablecida(asistencia != null ? asistencia.getSalidaProgramada() : programacion.horaSalida())
                .horaSalidaAsistencia(asistencia != null && asistencia.getFechaHoraSalida() != null ? asistencia.getFechaHoraSalida().toLocalTime() : null)
                .jornadaCerrada(asistencia != null && asistencia.getFechaHoraSalida() != null)
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
        List<CumplimientoDetalleDiaResponse> dias = new ArrayList<>();
        for (LocalDate fecha = desde; !fecha.isAfter(hasta); fecha = fecha.plusDays(1)) {
            dias.add(construirDetalleCumplimientoDia(idEmpleado, fecha, asistenciasPorFecha.get(fecha)));
        }

        return CumplimientoDetalleEmpleadoResponse.builder()
                .idEmpleado(idEmpleado)
                .dias(dias)
                .build();
    }

    private CumplimientoDetalleDiaResponse construirDetalleCumplimientoDia(Long idEmpleado, LocalDate fecha, Asistencia asistencia) {
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
                .build();
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

    private YearMonth resolvePeriodoMensual(Integer anio, Integer mes) {
        if (anio == null && mes == null) {
            return YearMonth.now();
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
