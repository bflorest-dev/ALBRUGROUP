package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.entity.ExcepcionHorario;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.PoliticaModalidad;
import pe.albrugroup.schedule_service.entity.request.PageRequest;
import pe.albrugroup.schedule_service.entity.request.horario.FinalizarHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarExcepcionHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.ReemplazarHorarioRequest;
import pe.albrugroup.schedule_service.entity.response.PageResponse;
import pe.albrugroup.schedule_service.entity.response.horario.ExcepcionHorarioResponse;
import pe.albrugroup.schedule_service.entity.response.horario.HorarioResponse;
import pe.albrugroup.schedule_service.exception.BadRequestException;
import pe.albrugroup.schedule_service.exception.ConflictException;
import pe.albrugroup.schedule_service.exception.NotFoundException;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;
import pe.albrugroup.schedule_service.service.mapper.HorarioMapper;
import pe.albrugroup.schedule_service.usecase.IHorario;

import java.time.LocalDate;
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

    @Override
    @Transactional
    public HorarioResponse registrarHorario(RegistrarHorarioRequest request) {
        validarDiasDuplicados(request.getDetalles().stream().map(detalle -> detalle.getDia()).toList());
        validarSolapamiento(request.getIdEmpleado(), request.getFechaInicio(), null, null);

        Horario horario = mapper.toEntity(request);
        PoliticaModalidad politica = politicaModalidadService.getPolitica(request.getModalidad());
        politicaModalidadService.aplicarPolitica(horario, politica);
        horario.setDetalles(request.getDetalles().stream().map(mapper::toDetalle).toList());
        horario.getDetalles().forEach(detalle -> detalle.setHorario(horario));

        return mapper.toResponse(horarioRepository.save(horario));
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

        return mapper.toResponse(horarioRepository.save(nuevo));
    }

    @Override
    @Transactional
    public HorarioResponse finalizarHorario(Long idHorario, FinalizarHorarioRequest request) {
        Horario horario = getHorarioById(idHorario);
        if (request.getFechaFin().isBefore(horario.getFechaInicio())) {
            throw new BadRequestException("fechaFin no puede ser anterior a fechaInicio");
        }
        horario.setFechaFin(request.getFechaFin());
        return mapper.toResponse(horarioRepository.save(horario));
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
        return mapper.toResponse(excepcionHorarioRepository.save(excepcion));
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
        return mapper.toResponse(excepcionHorarioRepository.save(excepcion));
    }

    @Override
    @Transactional
    public void eliminarExcepcion(Long idHorario, Long idExcepcion) {
        excepcionHorarioRepository.delete(getExcepcionById(idHorario, idExcepcion));
    }

    @Override
    @Transactional(readOnly = true)
    public HorarioResponse getHorarioVigente(Long idEmpleado, LocalDate fecha) {
        LocalDate consulta = fecha != null ? fecha : LocalDate.now();
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

    private ExcepcionHorario getExcepcionById(Long idHorario, Long idExcepcion) {
        return excepcionHorarioRepository.findById(idExcepcion)
                .filter(value -> value.getHorario().getId().equals(idHorario))
                .orElseThrow(() -> new NotFoundException(ExcepcionHorario.class, idExcepcion));
    }
}
