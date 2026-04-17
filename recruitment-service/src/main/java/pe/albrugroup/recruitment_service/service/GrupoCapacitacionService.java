package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacionDetalle;
import pe.albrugroup.recruitment_service.entity.Postulacion;
import pe.albrugroup.recruitment_service.entity.enums.Accion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoCapacitacionPostulante;
import pe.albrugroup.recruitment_service.entity.enums.EstadoGrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.request.ActualizarDetalleGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.AgregarPostulacionGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.GrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.PageRequest;
import pe.albrugroup.recruitment_service.entity.response.GrupoCapacitacionDetalleResponse;
import pe.albrugroup.recruitment_service.entity.response.GrupoCapacitacionResponse;
import pe.albrugroup.recruitment_service.entity.response.PageResponse;
import pe.albrugroup.recruitment_service.exception.BadRequestException;
import pe.albrugroup.recruitment_service.exception.ConflictException;
import pe.albrugroup.recruitment_service.exception.NotFoundException;
import pe.albrugroup.recruitment_service.repository.GrupoCapacitacionDetalleRepository;
import pe.albrugroup.recruitment_service.repository.GrupoCapacitacionRepository;
import pe.albrugroup.recruitment_service.repository.PostulacionRepository;
import pe.albrugroup.recruitment_service.service.mapper.GrupoCapacitacionMapper;

import java.time.LocalDate;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class GrupoCapacitacionService {

    private static final Set<String> GRUPO_SORT_FIELDS = Set.of(
            "id", "codigo", "turno", "sala", "fechaInicio", "fechaFin", "estado", "createdAt"
    );

    private final GrupoCapacitacionRepository grupoCapacitacionRepository;
    private final GrupoCapacitacionDetalleRepository detalleRepository;
    private final PostulacionRepository postulacionRepository;
    private final GrupoCapacitacionMapper grupoCapacitacionMapper;
    private final EventoService eventoService;
    private final PaginationService paginationService;

    public GrupoCapacitacionResponse crearGrupo(GrupoCapacitacionRequest request) {
        validarCodigoGrupoUnico(request.getCodigo());

        GrupoCapacitacion grupo = grupoCapacitacionMapper.toEntity(request);
        grupo.setFechaFin(calcularFechaFin(request.getFechaInicio()));
        grupo.setEstado(EstadoGrupoCapacitacion.ABIERTO);

        return grupoCapacitacionMapper.toResponse(grupoCapacitacionRepository.save(grupo));
    }

    @Transactional(readOnly = true)
    public PageResponse<GrupoCapacitacionResponse> listarGrupos(
            EstadoGrupoCapacitacion estado,
            PageRequest pageRequest
    ) {
        Page<GrupoCapacitacionResponse> grupos = (estado == null
                ? grupoCapacitacionRepository.findAll(paginationService.toPageable(pageRequest, GRUPO_SORT_FIELDS))
                : grupoCapacitacionRepository.findByEstado(
                        estado,
                        paginationService.toPageable(pageRequest, GRUPO_SORT_FIELDS)
                ))
                .map(grupoCapacitacionMapper::toResumenResponse);
        return PageResponse.from(grupos);
    }

    @Transactional(readOnly = true)
    public GrupoCapacitacionResponse obtenerGrupo(Long idGrupoCapacitacion) {
        return grupoCapacitacionMapper.toResponse(obtenerGrupoConDetalles(idGrupoCapacitacion));
    }

    public GrupoCapacitacionDetalleResponse agregarPostulacion(
            Long idGrupoCapacitacion,
            AgregarPostulacionGrupoCapacitacionRequest request
    ) {
        GrupoCapacitacion grupo = obtenerGrupoConDetalles(idGrupoCapacitacion);
        Postulacion postulacion = obtenerPostulacion(request.getIdPostulacion());

        validarGrupoDisponible(grupo);
        validarPostulacionAptaParaCapacitacion(postulacion);
        validarPostulacionSinGrupoPrevio(postulacion.getId());

        GrupoCapacitacionDetalle detalle = GrupoCapacitacionDetalle.builder()
                .grupoCapacitacion(grupo)
                .postulacion(postulacion)
                .estadoCapacitacion(EstadoCapacitacionPostulante.ASIGNADO)
                .fechaAsignacion(request.getFechaAsignacion() != null ? request.getFechaAsignacion() : LocalDate.now())
                .build();

        GrupoCapacitacionDetalle detalleGuardado = detalleRepository.save(detalle);
        eventoService.registrarEvento(
                postulacion,
                Accion.ASIGNACION_GRUPO_CAPACITACION,
                null,
                null,
                null,
                null,
                null,
                "Asignado al grupo de capacitacion " + grupo.getCodigo()
        );

        return grupoCapacitacionMapper.toResponse(detalleGuardado);
    }

    public GrupoCapacitacionDetalleResponse actualizarDetalle(
            Long idGrupoCapacitacion,
            Long idPostulacion,
            ActualizarDetalleGrupoCapacitacionRequest request
    ) {
        GrupoCapacitacionDetalle detalle = detalleRepository.findByGrupoCapacitacionIdAndPostulacionId(idGrupoCapacitacion, idPostulacion)
                .orElseThrow(() -> new NotFoundException(
                        "No existe un detalle de capacitacion para la postulacion indicada en el grupo enviado"
                ));

        validarActualizacionDetalle(request);

        if (request.getEstadoCapacitacion() != null) {
            detalle.setEstadoCapacitacion(request.getEstadoCapacitacion());
        }
        if (request.getFechaResultado() != null) {
            detalle.setFechaResultado(request.getFechaResultado());
        }
        if (request.getIdEmpleadoContratado() != null) {
            detalle.setIdEmpleadoContratado(request.getIdEmpleadoContratado());
        }
        if (request.getFechaContratacion() != null) {
            detalle.setFechaContratacion(request.getFechaContratacion());
        }
        if (request.getCumplioTresMeses() != null) {
            detalle.setCumplioTresMeses(request.getCumplioTresMeses());
        }
        if (request.getFechaCumplioTresMeses() != null) {
            detalle.setFechaCumplioTresMeses(request.getFechaCumplioTresMeses());
        }

        GrupoCapacitacionDetalle detalleGuardado = detalleRepository.save(detalle);
        registrarEventoResultadoCapacitacion(detalleGuardado);
        return grupoCapacitacionMapper.toResponse(detalleGuardado);
    }

    private void registrarEventoResultadoCapacitacion(GrupoCapacitacionDetalle detalle) {
        if (detalle.getEstadoCapacitacion() == EstadoCapacitacionPostulante.APROBADO) {
            eventoService.registrarEvento(
                    detalle.getPostulacion(),
                    Accion.APROBACION_CAPACITACION,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "Aprobado en el grupo de capacitacion " + detalle.getGrupoCapacitacion().getCodigo()
            );
        }

        if (detalle.getEstadoCapacitacion() == EstadoCapacitacionPostulante.DESAPROBADO) {
            eventoService.registrarEvento(
                    detalle.getPostulacion(),
                    Accion.DESAPROBACION_CAPACITACION,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "Desaprobado en el grupo de capacitacion " + detalle.getGrupoCapacitacion().getCodigo()
            );
        }
    }

    private GrupoCapacitacion obtenerGrupoConDetalles(Long idGrupoCapacitacion) {
        return grupoCapacitacionRepository.findWithDetallesById(idGrupoCapacitacion)
                .orElseThrow(() -> new NotFoundException(GrupoCapacitacion.class, idGrupoCapacitacion));
    }

    private Postulacion obtenerPostulacion(Long idPostulacion) {
        return postulacionRepository.findById(idPostulacion)
                .orElseThrow(() -> new NotFoundException(Postulacion.class, idPostulacion));
    }

    private void validarCodigoGrupoUnico(String codigo) {
        if (grupoCapacitacionRepository.existsByCodigo(codigo)) {
            throw new ConflictException("Ya existe un grupo de capacitacion con el codigo indicado");
        }
    }

    private LocalDate calcularFechaFin(LocalDate fechaInicio) {
        return fechaInicio.plusWeeks(1);
    }

    private void validarGrupoDisponible(GrupoCapacitacion grupo) {
        if (grupo.getEstado() == EstadoGrupoCapacitacion.CERRADO || grupo.getEstado() == EstadoGrupoCapacitacion.ANULADO) {
            throw new BadRequestException("No se pueden agregar postulaciones a un grupo de capacitacion cerrado o anulado");
        }
    }

    private void validarPostulacionAptaParaCapacitacion(Postulacion postulacion) {
        if (postulacion.getEtapa() != Etapa.CAPACITACION) {
            throw new BadRequestException("Solo se pueden agregar postulaciones que esten en la etapa de capacitacion");
        }

        if (postulacion.getOfertaLaboral().getPuestoObjetivo() != PuestoObjetivo.ASESOR_VENTAS) {
            throw new BadRequestException("Solo se pueden agregar postulaciones del puesto objetivo ASESOR_VENTAS");
        }
    }

    private void validarPostulacionSinGrupoPrevio(Long idPostulacion) {
        if (detalleRepository.existsByPostulacionId(idPostulacion)) {
            throw new ConflictException("La postulacion indicada ya fue asignada a un grupo de capacitacion");
        }
    }

    private void validarActualizacionDetalle(ActualizarDetalleGrupoCapacitacionRequest request) {
        if (request.getFechaContratacion() != null && request.getIdEmpleadoContratado() == null) {
            throw new BadRequestException("No se puede registrar fecha de contratacion sin idEmpleadoContratado");
        }

        if (Boolean.TRUE.equals(request.getCumplioTresMeses()) && request.getIdEmpleadoContratado() == null) {
            throw new BadRequestException("No se puede marcar cumplimiento de tres meses sin idEmpleadoContratado");
        }
    }
}
