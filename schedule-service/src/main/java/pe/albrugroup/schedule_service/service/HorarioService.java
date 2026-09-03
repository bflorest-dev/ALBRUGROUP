package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.entity.ExcepcionHorario;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.PoliticaModalidad;
import pe.albrugroup.schedule_service.entity.request.PageRequest;
import pe.albrugroup.schedule_service.entity.request.horario.BloqueHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.FinalizarHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarExcepcionHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.ReemplazarHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.CorregirHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.CerrarHorarioEmpleadoRequest;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;
import pe.albrugroup.schedule_service.entity.response.PageResponse;
import pe.albrugroup.schedule_service.entity.response.horario.ExcepcionHorarioResponse;
import pe.albrugroup.schedule_service.entity.response.horario.HorarioMesResponse;
import pe.albrugroup.schedule_service.entity.response.horario.HorarioMesVigenciaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.HorarioResponse;
import pe.albrugroup.schedule_service.exception.BadRequestException;
import pe.albrugroup.schedule_service.exception.ConflictException;
import pe.albrugroup.schedule_service.exception.NotFoundException;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;
import pe.albrugroup.schedule_service.service.mapper.HorarioMapper;
import pe.albrugroup.schedule_service.usecase.IHorario;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class HorarioService implements IHorario {

    private final HorarioRepository horarioRepository;
    private final ExcepcionHorarioRepository excepcionHorarioRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final PoliticaModalidadService politicaModalidadService;
    private final PaginationService paginationService;
    private final HorarioMapper mapper;
    private final CurrentUser currentUser;
    private final AttendanceRealtimeNotifier attendanceRealtimeNotifier;

    @Override
    @Transactional
    public HorarioResponse registrarHorario(RegistrarHorarioRequest request) {
        validarDiasDuplicados(request.getDetalles().stream().map(detalle -> detalle.getDia()).toList());
        normalizarAlmuerzoPorModalidad(request.getModalidad(), request.getDetalles());
        HorarioResponse horarioCorregido = resolverSolapamientosParaRegistro(request);
        if (horarioCorregido != null) {
            return horarioCorregido;
        }
        validarSolapamiento(request.getIdEmpleado(), request.getFechaInicio(), null, null);

        Horario horario = mapper.toEntity(request);
        PoliticaModalidad politica = politicaModalidadService.getPolitica(request.getModalidad());
        politicaModalidadService.aplicarPolitica(horario, politica);
        horario.setDetalles(request.getDetalles().stream().map(mapper::toDetalle).toList());
        horario.getDetalles().forEach(detalle -> detalle.setHorario(horario));

        Horario savedHorario = horarioRepository.save(horario);
        attendanceRealtimeNotifier.publishAfterCommit(
                "HORARIO_AFECTADO",
                "HORARIO",
                savedHorario.getIdEmpleado(),
                savedHorario.getFechaInicio(),
                null
        );
        return mapper.toResponse(savedHorario);
    }

    private HorarioResponse resolverSolapamientosParaRegistro(RegistrarHorarioRequest request) {
        List<Horario> solapados = horarioRepository.findSolapamientos(
                request.getIdEmpleado(),
                request.getFechaInicio(),
                null,
                null
        );

        if (solapados.isEmpty()) {
            return null;
        }

        validarSinAsistenciaParaCorreccion(request.getIdEmpleado(), request.getFechaInicio());

        List<Horario> mismaFechaInicio = solapados.stream()
                .filter(horario -> horario.getFechaInicio().isEqual(request.getFechaInicio()))
                .toList();

        if (mismaFechaInicio.size() > 1) {
            throw new ConflictException(
                    "Existen varios horarios iniciados en la misma fecha. Requiere correccion administrativa",
                    request.getFechaInicio()
            );
        }

        if (mismaFechaInicio.size() == 1) {
            Horario horarioBase = mismaFechaInicio.get(0);
            cerrarHorariosAnterioresSolapados(solapados, horarioBase.getId(), request.getFechaInicio());
            return corregirHorarioBaseMismaFecha(horarioBase, request);
        }

        cerrarHorariosAnterioresSolapados(solapados, null, request.getFechaInicio());
        horarioRepository.flush();
        return null;
    }

    private void cerrarHorariosAnterioresSolapados(List<Horario> horarios, Long excludeId, LocalDate fechaInicioNuevo) {
        for (Horario horario : horarios) {
            if (excludeId != null && horario.getId().equals(excludeId)) {
                continue;
            }

            if (!horario.getFechaInicio().isBefore(fechaInicioNuevo)) {
                throw new ConflictException(
                        "Existe un horario solapado con fecha de inicio igual o posterior. Requiere correccion administrativa",
                        horario.getId()
                );
            }

            horario.setFechaFin(fechaInicioNuevo.minusDays(1));
            horarioRepository.save(horario);
        }
    }

    private HorarioResponse corregirHorarioBaseMismaFecha(Horario horario, RegistrarHorarioRequest request) {
        validarSinAsistenciaParaCorreccion(request.getIdEmpleado(), request.getFechaInicio());

        horario.setIdContrato(request.getIdContrato());
        horario.setFechaFin(null);
        horario.setCompensable(request.getCompensable());

        PoliticaModalidad politica = politicaModalidadService.getPolitica(request.getModalidad());
        politicaModalidadService.aplicarPolitica(horario, politica);

        horario.getDetalles().clear();
        horarioRepository.flush();
        request.getDetalles().stream()
                .map(mapper::toDetalle)
                .forEach(detalle -> {
                    detalle.setHorario(horario);
                    horario.getDetalles().add(detalle);
                });

        Horario savedHorario = horarioRepository.save(horario);
        attendanceRealtimeNotifier.publishAfterCommit(
                "HORARIO_CORREGIDO",
                "HORARIO",
                savedHorario.getIdEmpleado(),
                savedHorario.getFechaInicio(),
                null
        );
        return mapper.toResponse(savedHorario);
    }

    private void validarSinAsistenciaParaCorreccion(Long idEmpleado, LocalDate fecha) {
        asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, fecha)
                .ifPresent(asistencia -> {
                    throw new ConflictException(
                            "No se puede corregir el horario base porque ya existe asistencia para esa fecha",
                            fecha
                    );
                });
    }

    @Override
    @Transactional
    public HorarioResponse reemplazarHorario(Long idHorario, ReemplazarHorarioRequest request) {
        Horario actual = getHorarioById(idHorario);
        if (!request.getFechaInicio().isAfter(actual.getFechaInicio())) {
            throw new BadRequestException("La nueva fechaInicio debe ser posterior al horario actual");
        }

        // Guard: no reemplazar sobre días ya marcados. Si el empleado ya tiene asistencia en la fecha nueva
        // o posteriores, arrancar ahí dejaría la marca vieja bajo el horario nuevo (incoherencia). El nuevo
        // horario debe iniciar en una fecha sin marcaciones (p. ej. mañana si ya marcó hoy).
        if (asistenciaRepository.existsByIdEmpleadoAndFechaGreaterThanEqual(
                actual.getIdEmpleado(), request.getFechaInicio())) {
            throw new ConflictException(
                    "El empleado ya tiene asistencia registrada en esa fecha o posteriores. "
                            + "El nuevo horario solo puede aplicar desde una fecha sin marcaciones (por ejemplo, mañana).",
                    request.getFechaInicio());
        }

        actual.setFechaFin(request.getFechaInicio().minusDays(1));
        horarioRepository.save(actual);

        validarSolapamiento(actual.getIdEmpleado(), request.getFechaInicio(), null, actual.getId());
        validarDiasDuplicados(request.getDetalles().stream().map(detalle -> detalle.getDia()).toList());
        normalizarAlmuerzoPorModalidad(request.getModalidad(), request.getDetalles());

        Horario nuevo = Horario.builder()
                .idEmpleado(actual.getIdEmpleado())
                .idContrato(actual.getIdContrato())
                .fechaInicio(request.getFechaInicio())
                .compensable(request.getCompensable())
                .build();
        PoliticaModalidad politica = politicaModalidadService.getPolitica(request.getModalidad());
        politicaModalidadService.aplicarPolitica(nuevo, politica);
        nuevo.setDetalles(request.getDetalles().stream().map(mapper::toDetalle).toList());
        nuevo.getDetalles().forEach(detalle -> detalle.setHorario(nuevo));

        Horario savedHorario = horarioRepository.save(nuevo);
        attendanceRealtimeNotifier.publishAfterCommit(
                "HORARIO_AFECTADO",
                "HORARIO",
                savedHorario.getIdEmpleado(),
                savedHorario.getFechaInicio(),
                null
        );
        return mapper.toResponse(savedHorario);
    }

    @Override
    @Transactional
    public HorarioResponse corregirHorario(Long idHorario, CorregirHorarioRequest request) {
        Horario horario = getHorarioById(idHorario);

        if (asistenciaRepository.existsByIdHorarioAndFechaHoraIngresoIsNotNull(idHorario)) {
            throw new ConflictException(
                    "El horario ya tiene marcaciones reales. Usa una excepcion puntual para un dia especifico o un reemplazo para un cambio estructural",
                    idHorario
            );
        }

        validarDiasDuplicados(request.getDetalles().stream().map(detalle -> detalle.getDia()).toList());
        normalizarAlmuerzoPorModalidad(request.getModalidad(), request.getDetalles());

        horario.setCompensable(request.getCompensable());
        PoliticaModalidad politica = politicaModalidadService.getPolitica(request.getModalidad());
        politicaModalidadService.aplicarPolitica(horario, politica);

        horario.getDetalles().clear();
        horarioRepository.flush();
        request.getDetalles().stream()
                .map(mapper::toDetalle)
                .forEach(detalle -> {
                    detalle.setHorario(horario);
                    horario.getDetalles().add(detalle);
                });

        Horario savedHorario = horarioRepository.save(horario);
        attendanceRealtimeNotifier.publishAfterCommit(
                "HORARIO_CORREGIDO",
                "HORARIO",
                savedHorario.getIdEmpleado(),
                savedHorario.getFechaInicio(),
                null
        );
        return mapper.toResponse(savedHorario);
    }

    @Override
    @Transactional
    public HorarioResponse finalizarHorario(Long idHorario, FinalizarHorarioRequest request) {
        Horario horario = getHorarioById(idHorario);
        if (request.getFechaFin().isBefore(horario.getFechaInicio())) {
            throw new BadRequestException("fechaFin no puede ser anterior a fechaInicio");
        }
        horario.setFechaFin(request.getFechaFin());
        Horario savedHorario = horarioRepository.save(horario);
        attendanceRealtimeNotifier.publishAfterCommit(
                "HORARIO_AFECTADO",
                "HORARIO",
                savedHorario.getIdEmpleado(),
                request.getFechaFin(),
                null
        );
        return mapper.toResponse(savedHorario);
    }

    @Override
    @Transactional
    public ExcepcionHorarioResponse registrarExcepcion(Long idHorario, RegistrarExcepcionHorarioRequest request) {
        Horario horario = getHorarioById(idHorario);
        validarFechaDentroDeVigencia(horario, request.getFecha());
        excepcionHorarioRepository.findByHorarioIdAndFecha(idHorario, request.getFecha())
                .ifPresent(value -> {
                    throw new ConflictException("Ya existe una excepcion para esta fecha", request.getFecha());
                });

        ExcepcionHorario excepcion = mapper.toExcepcion(request);
        excepcion.setHorario(horario);
        ExcepcionHorario savedExcepcion = excepcionHorarioRepository.save(excepcion);
        attendanceRealtimeNotifier.publishAfterCommit(
                "EXCEPCION_HORARIO_AFECTADA",
                "EXCEPCION",
                horario.getIdEmpleado(),
                savedExcepcion.getFecha(),
                null
        );
        return mapper.toResponse(savedExcepcion);
    }

    @Override
    @Transactional
    public ExcepcionHorarioResponse actualizarExcepcion(Long idHorario, Long idExcepcion, RegistrarExcepcionHorarioRequest request) {
        Horario horario = getHorarioById(idHorario);
        validarFechaDentroDeVigencia(horario, request.getFecha());
        ExcepcionHorario excepcion = getExcepcionById(idHorario, idExcepcion);

        excepcionHorarioRepository.findByHorarioIdAndFecha(idHorario, request.getFecha())
                .filter(value -> !value.getId().equals(idExcepcion))
                .ifPresent(value -> {
                    throw new ConflictException("Ya existe una excepcion para esta fecha", request.getFecha());
                });

        mapper.updateExcepcion(request, excepcion);
        ExcepcionHorario savedExcepcion = excepcionHorarioRepository.save(excepcion);
        attendanceRealtimeNotifier.publishAfterCommit(
                "EXCEPCION_HORARIO_AFECTADA",
                "EXCEPCION",
                horario.getIdEmpleado(),
                savedExcepcion.getFecha(),
                null
        );
        return mapper.toResponse(savedExcepcion);
    }

    @Override
    @Transactional
    public void eliminarExcepcion(Long idHorario, Long idExcepcion) {
        ExcepcionHorario excepcion = getExcepcionById(idHorario, idExcepcion);
        Long idEmpleado = excepcion.getHorario().getIdEmpleado();
        LocalDate fecha = excepcion.getFecha();
        excepcionHorarioRepository.delete(excepcion);
        attendanceRealtimeNotifier.publishAfterCommit(
                "EXCEPCION_HORARIO_AFECTADA",
                "EXCEPCION",
                idEmpleado,
                fecha,
                null
        );
    }

    @Override
    @Transactional(readOnly = true)
    public HorarioMesResponse getHorarioMes(Integer anio, Integer mes) {
        Long idEmpleado = currentUser.empleadoID();
        YearMonth periodo = resolvePeriodoMensual(anio, mes);
        LocalDate desde = periodo.atDay(1);
        LocalDate hasta = periodo.atEndOfMonth();

        List<HorarioMesVigenciaResponse> vigencias = horarioRepository.findHorariosEnRango(idEmpleado, desde, hasta)
                .stream()
                .map(horario -> HorarioMesVigenciaResponse.builder()
                        .idHorario(horario.getId())
                        .modalidad(horario.getModalidadContrato())
                        .horasObjetivoSemanal(horario.getHorasObjetivoSemanal())
                        .horasObjetivoMensual(horario.getHorasObjetivoMensual())
                        .minutosAlmuerzo(horario.getMinutosAlmuerzo())
                        .minutosServicios(horario.getMinutosServicios())
                        .fechaInicio(horario.getFechaInicio())
                        .fechaFin(horario.getFechaFin())
                        .desdeAplicacion(maxDate(desde, horario.getFechaInicio()))
                        .hastaAplicacion(minDate(hasta, horario.getFechaFin()))
                        .compensable(horario.getCompensable())
                        .detallesBase(horario.getDetalles().stream().map(mapper::toResponse).toList())
                        .modificaciones(horario.getExcepciones().stream()
                                .filter(excepcion -> !excepcion.getFecha().isBefore(desde) && !excepcion.getFecha().isAfter(hasta))
                                .map(mapper::toResponse)
                                .toList())
                        .build())
                .toList();

        return HorarioMesResponse.builder()
                .idEmpleado(idEmpleado)
                .anio(periodo.getYear())
                .mes(periodo.getMonthValue())
                .vigencias(vigencias)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public HorarioResponse getHorarioVigente(Long idEmpleado, LocalDate fecha) {
        LocalDate consulta = OperationalDateTime.resolveDate(fecha);
        return mapper.toResponse(horarioRepository.findHorarioVigente(idEmpleado, consulta)
                .orElseThrow(() -> new NotFoundException("Horario vigente no encontrado", idEmpleado)));
    }

    @Override
    @Transactional
    public HorarioResponse cerrarHorarioEmpleado(Long idEmpleado, CerrarHorarioEmpleadoRequest request) {
        LocalDate fechaFin = request != null && request.getFechaFin() != null
                ? request.getFechaFin()
                : OperationalDateTime.today();
        Horario horario = horarioRepository.findHorarioVigente(idEmpleado, fechaFin)
                .orElseGet(() -> horarioRepository.findByIdEmpleado(
                                idEmpleado,
                                org.springframework.data.domain.PageRequest.of(
                                        0, 1, org.springframework.data.domain.Sort.by("fechaInicio").descending()))
                        .stream().findFirst().orElse(null));
        if (horario == null) {
            return null;
        }
        if (horario.getFechaFin() != null && !horario.getFechaFin().isAfter(fechaFin)) {
            return mapper.toResponse(horario);
        }
        if (fechaFin.isBefore(horario.getFechaInicio())) {
            throw new BadRequestException("La fecha de cierre no puede ser anterior al inicio del horario");
        }
        horario.setFechaFin(fechaFin);
        return mapper.toResponse(horarioRepository.save(horario));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<HorarioResponse> listarHistorico(Long idEmpleado, PageRequest pageRequest) {
        Pageable pageable = paginationService.buildPageable(pageRequest, Set.of("fechaInicio", "fechaFin", "createdAt"));
        return PageResponse.from(horarioRepository.findByIdEmpleado(idEmpleado, pageable).map(mapper::toResponse));
    }

    @Transactional(readOnly = true)
    public Horario getHorarioById(Long idHorario) {
        return horarioRepository.findById(idHorario)
                .orElseThrow(() -> new NotFoundException(Horario.class, idHorario));
    }

    private void validarSolapamiento(Long idEmpleado, LocalDate fechaInicio, LocalDate fechaFin, Long excludeId) {
        if (horarioRepository.existsSolapamiento(idEmpleado, fechaInicio, fechaFin, excludeId)) {
            throw new ConflictException("Existe un horario solapado para el empleado", idEmpleado);
        }
    }

    private void validarFechaDentroDeVigencia(Horario horario, LocalDate fecha) {
        if (fecha.isBefore(horario.getFechaInicio()) || (horario.getFechaFin() != null && fecha.isAfter(horario.getFechaFin()))) {
            throw new BadRequestException("La fecha de la excepcion no esta dentro de la vigencia del horario", fecha);
        }
    }

    private void validarDiasDuplicados(List<?> dias) {
        if (new HashSet<>(dias).size() != dias.size()) {
            throw new BadRequestException("No se puede repetir el dia en los detalles del horario");
        }
    }

    /**
     * Almuerzo POR DÍA, desacoplado de la modalidad: cada día decide si lleva un período de almuerzo o no.
     * No se fuerza nada por modalidad; solo se rechaza el par a medias (un día con inicio pero sin fin, o
     * viceversa), que sería un dato inconsistente.
     */
    private void normalizarAlmuerzoPorModalidad(ModalidadContrato modalidad, List<BloqueHorarioRequest> detalles) {
        List<String> inconsistentes = detalles.stream()
                .filter(detalle -> (detalle.getInicioAlmuerzo() == null) != (detalle.getFinAlmuerzo() == null))
                .map(detalle -> detalle.getDia().name())
                .toList();

        if (!inconsistentes.isEmpty()) {
            throw new BadRequestException(
                    "Cada día debe tener inicio y fin de almuerzo, o ninguno de los dos",
                    modalidad,
                    inconsistentes
            );
        }
    }

    private ExcepcionHorario getExcepcionById(Long idHorario, Long idExcepcion) {
        return excepcionHorarioRepository.findById(idExcepcion)
                .filter(value -> value.getHorario().getId().equals(idHorario))
                .orElseThrow(() -> new NotFoundException(ExcepcionHorario.class, idExcepcion));
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

    private LocalDate maxDate(LocalDate left, LocalDate right) {
        return left.isAfter(right) ? left : right;
    }

    private LocalDate minDate(LocalDate left, LocalDate right) {
        if (right == null) {
            return left;
        }
        return left.isBefore(right) ? left : right;
    }
}
