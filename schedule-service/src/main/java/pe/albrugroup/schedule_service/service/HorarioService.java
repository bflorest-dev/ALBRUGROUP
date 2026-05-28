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

    @Override
    @Transactional
    public HorarioResponse reemplazarHorario(Long idHorario, ReemplazarHorarioRequest request) {
        Horario actual = getHorarioById(idHorario);
        if (!request.getFechaInicio().isAfter(actual.getFechaInicio())) {
            throw new BadRequestException("La nueva fechaInicio debe ser posterior al horario actual");
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

    private void normalizarAlmuerzoPorModalidad(ModalidadContrato modalidad, List<BloqueHorarioRequest> detalles) {
        if (!requiereAlmuerzo(modalidad)) {
            detalles.forEach(detalle -> {
                detalle.setInicioAlmuerzo(null);
                detalle.setFinAlmuerzo(null);
            });
            return;
        }

        List<String> diasSinAlmuerzo = detalles.stream()
                .filter(detalle -> detalle.getInicioAlmuerzo() == null || detalle.getFinAlmuerzo() == null)
                .map(detalle -> detalle.getDia().name())
                .toList();

        if (!diasSinAlmuerzo.isEmpty()) {
            throw new BadRequestException(
                    "inicioAlmuerzo y finAlmuerzo son obligatorios para la modalidad " + modalidad,
                    modalidad,
                    diasSinAlmuerzo
            );
        }
    }

    private boolean requiereAlmuerzo(ModalidadContrato modalidad) {
        return modalidad != ModalidadContrato.PART_TIME && modalidad != ModalidadContrato.SEMI_FULL;
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
