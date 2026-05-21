package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.configuration.CurrentUser;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacionDetalle;
import pe.albrugroup.recruitment_service.entity.OfertaLaboral;
import pe.albrugroup.recruitment_service.entity.Postulacion;
import pe.albrugroup.recruitment_service.entity.Postulante;
import pe.albrugroup.recruitment_service.entity.Subtipificacion;
import pe.albrugroup.recruitment_service.entity.Tipificacion;
import pe.albrugroup.recruitment_service.entity.enums.Accion;
import pe.albrugroup.recruitment_service.entity.enums.AlcanceSubtipificacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoCapacitacionPostulante;
import pe.albrugroup.recruitment_service.entity.enums.EstadoBandejaPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoOferta;
import pe.albrugroup.recruitment_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.request.AgregarPostulacionGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.ConfirmarContratacionRequest;
import pe.albrugroup.recruitment_service.entity.request.PageRequest;
import pe.albrugroup.recruitment_service.entity.request.PostulacionRequest;
import pe.albrugroup.recruitment_service.entity.request.TipificarPostulacionRequest;
import pe.albrugroup.recruitment_service.entity.response.PageResponse;
import pe.albrugroup.recruitment_service.entity.response.PostulacionResponse;
import pe.albrugroup.recruitment_service.exception.BadRequestException;
import pe.albrugroup.recruitment_service.exception.ConflictException;
import pe.albrugroup.recruitment_service.exception.NotFoundException;
import pe.albrugroup.recruitment_service.repository.GrupoCapacitacionDetalleRepository;
import pe.albrugroup.recruitment_service.repository.OfertaLaboralRepository;
import pe.albrugroup.recruitment_service.repository.PostulacionRepository;
import pe.albrugroup.recruitment_service.repository.SubtipificacionRepository;
import pe.albrugroup.recruitment_service.repository.TipificacionRepository;
import pe.albrugroup.recruitment_service.service.mapper.PostulacionMapper;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class PostulacionService {

    private static final Set<String> POSTULACION_SORT_FIELDS = Set.of(
            "id", "createdAt", "updatedAt", "etapa", "estado", "estadoBandeja", "origen"
    );

    private final PostulacionRepository postulacionRepository;
    private final OfertaLaboralRepository ofertaLaboralRepository;
    private final PostulanteService postulanteService;
    private final EventoService eventoService;
    private final PostulacionMapper postulacionMapper;
    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final GrupoCapacitacionDetalleRepository grupoCapacitacionDetalleRepository;
    private final GrupoCapacitacionService grupoCapacitacionService;
    private final CurrentUser currentUser;
    private final PaginationService paginationService;
    private final PostulacionRealtimeNotifier postulacionRealtimeNotifier;

    public PostulacionResponse registrarPostulacion(PostulacionRequest request) {
        OfertaLaboral ofertaLaboral = obtenerOfertaActiva(request.getIdOfertaLaboral());
        Postulante postulante = postulanteService.crearOActualizar(request.getPostulante());

        Postulacion postulacion = Postulacion.builder()
                .postulante(postulante)
                .ofertaLaboral(ofertaLaboral)
                .idEmpleadoRegistrador(currentUser.empleadoID())
                .origen(request.getOrigen())
                .etapa(Etapa.RECLUTAMIENTO)
                .estado(EstadoPostulacion.EN_PROCESO)
                .estadoBandeja(EstadoBandejaPostulacion.POSTULANTE)
                .build();

        Postulacion postulacionGuardada = postulacionRepository.save(postulacion);
        eventoService.registrarEvento(
                postulacionGuardada,
                Accion.REGISTRO_POSTULACION,
                null,
                null,
                null,
                null,
                null,
                null
        );

        postulacionRealtimeNotifier.publishAfterCommit(
                "REGISTRO_POSTULACION",
                "POSTULACION",
                postulacionGuardada,
                null,
                null,
                null,
                null,
                null
        );

        return postulacionMapper.toResponse(postulacionGuardada);
    }

    public PostulacionResponse tipificarPostulacion(Long idPostulacion, TipificarPostulacionRequest request) {
        TipificacionContext context = prepararTipificacion(idPostulacion, request.getIdTipificacion(), request.getIdSubtipificacion());
        Etapa etapaAnterior = context.postulacion().getEtapa();
        EstadoPostulacion estadoAnterior = context.postulacion().getEstado();
        EstadoBandejaPostulacion estadoBandejaAnterior = context.postulacion().getEstadoBandeja();
        boolean requiereAsignacionGrupo = requiereAsignacionGrupoEnTipificacionEspecial(
                context.postulacion(),
                context.subtipificacion()
        );
        validarAsignacionGrupoCapacitacion(
                context.postulacion(),
                context.subtipificacion(),
                request.getIdGrupoCapacitacion()
        );

        Postulacion postulacionGuardada = aplicarTipificacion(
                context.postulacion(),
                context.tipificacion(),
                context.subtipificacion(),
                request.getModalidadContacto(),
                request.getObservacion()
        );

        postulacionRealtimeNotifier.publishAfterCommit(
                "TIPIFICACION",
                "TIPIFICACION",
                postulacionGuardada,
                etapaAnterior,
                estadoAnterior,
                estadoBandejaAnterior,
                null,
                context.postulacion().getOfertaLaboral().getPuestoObjetivo()
        );

        if (requiereAsignacionGrupo) {
            grupoCapacitacionService.agregarPostulacion(
                    request.getIdGrupoCapacitacion(),
                    AgregarPostulacionGrupoCapacitacionRequest.builder()
                            .idPostulacion(postulacionGuardada.getId())
                            .build()
            );
        }

        return mapearPostulacionResponse(postulacionGuardada);
    }

    public PostulacionResponse editarPostulacion(Long idPostulacion, PostulacionRequest request) {
        Postulacion postulacion = postulacionRepository.findById(idPostulacion)
                .orElseThrow(() -> new NotFoundException(Postulacion.class, idPostulacion));
        PuestoObjetivo puestoObjetivoAnterior = postulacion.getOfertaLaboral().getPuestoObjetivo();

        OfertaLaboral ofertaLaboral = obtenerOfertaActiva(request.getIdOfertaLaboral());
        Postulante postulante = postulanteService.crearOActualizar(request.getPostulante());

        postulacion.setPostulante(postulante);
        postulacion.setOfertaLaboral(ofertaLaboral);
        postulacion.setOrigen(request.getOrigen());

        Postulacion postulacionGuardada = postulacionRepository.save(postulacion);
        eventoService.registrarEvento(
                postulacionGuardada,
                Accion.ACTUALIZACION_POSTULACION,
                null,
                null,
                null,
                null,
                null,
                null
        );

        postulacionRealtimeNotifier.publishAfterCommit(
                "ACTUALIZACION_POSTULACION",
                "POSTULACION",
                postulacionGuardada,
                postulacionGuardada.getEtapa(),
                postulacionGuardada.getEstado(),
                postulacionGuardada.getEstadoBandeja(),
                null,
                puestoObjetivoAnterior
        );

        return postulacionMapper.toResponse(postulacionGuardada);
    }

    @Transactional(readOnly = true)
    public PostulacionResponse obtenerPostulacion(Long idPostulacion) {
        Postulacion postulacion = postulacionRepository.findDetalleById(idPostulacion)
                .orElseThrow(() -> new NotFoundException(Postulacion.class, idPostulacion));
        return mapearPostulacionResponse(postulacion);
    }

    @Transactional(readOnly = true)
    public PageResponse<PostulacionResponse> listarPostulaciones(
            Etapa etapa,
            EstadoPostulacion estado,
            EstadoBandejaPostulacion estadoBandeja,
            PageRequest pageRequest
    ) {
        Specification<Postulacion> spec = Specification.where(conEtapa(etapa))
                .and(conEstado(estado))
                .and(conEstadoBandeja(estadoBandeja));

        Page<PostulacionResponse> postulaciones = postulacionRepository.findAll(
                        spec,
                        paginationService.toPageable(pageRequest, POSTULACION_SORT_FIELDS)
                )
                .map(this::mapearPostulacionResponse);
        return PageResponse.from(postulaciones);
    }

    @Transactional(readOnly = true)
    public PageResponse<PostulacionResponse> listarBandejaReclutamiento(
            EstadoBandejaPostulacion estadoBandeja,
            PageRequest pageRequest
    ) {
        Instant limiteReciente = Instant.now().minus(1, ChronoUnit.DAYS);
        Specification<Postulacion> spec = Specification.where(conEtapa(Etapa.RECLUTAMIENTO))
                .and(conEstadoBandeja(estadoBandeja))
                .and(enProcesoOReciente(limiteReciente));

        Page<PostulacionResponse> postulaciones = postulacionRepository.findAll(
                        spec,
                        paginationService.toPageable(pageRequest, POSTULACION_SORT_FIELDS)
                )
                .map(this::mapearPostulacionResponse);
        return PageResponse.from(postulaciones);
    }

    @Transactional(readOnly = true)
    public PageResponse<PostulacionResponse> listarBandejaCapacitacion(Boolean sinGrupo, PageRequest pageRequest) {
        Specification<Postulacion> spec = Specification.where(conEtapa(Etapa.CAPACITACION))
                .and(Boolean.TRUE.equals(sinGrupo) ? sinGrupoCapacitacion() : null);

        Page<PostulacionResponse> postulaciones = postulacionRepository.findAll(
                        spec,
                        paginationService.toPageable(pageRequest, POSTULACION_SORT_FIELDS)
                )
                .map(this::mapearPostulacionResponse);
        return PageResponse.from(postulaciones);
    }

    @Transactional(readOnly = true)
    public PageResponse<PostulacionResponse> listarBandejaContratacion(PageRequest pageRequest) {
        Specification<Postulacion> spec = Specification.where(conEtapa(Etapa.CONTRATACION))
                .and(listoParaContratacion());

        Page<PostulacionResponse> postulaciones = postulacionRepository.findAll(
                        spec,
                        paginationService.toPageable(pageRequest, POSTULACION_SORT_FIELDS)
                )
                .map(this::mapearPostulacionResponse);
        return PageResponse.from(postulaciones);
    }

    public PostulacionResponse confirmarContratacion(Long idPostulacion, ConfirmarContratacionRequest request) {
        Postulacion postulacion = postulacionRepository.findById(idPostulacion)
                .orElseThrow(() -> new NotFoundException(Postulacion.class, idPostulacion));
        Etapa etapaAnterior = postulacion.getEtapa();
        EstadoPostulacion estadoAnterior = postulacion.getEstado();
        EstadoBandejaPostulacion estadoBandejaAnterior = postulacion.getEstadoBandeja();

        var detalle = grupoCapacitacionDetalleRepository.findByPostulacionId(idPostulacion)
                .orElseThrow(() -> new BadRequestException("La postulacion no tiene un detalle de grupo de capacitacion asociado"));

        validarPostulacionListaParaContratar(postulacion, detalle.getEstadoCapacitacion());

        if (detalle.getIdEmpleadoContratado() != null) {
            return manejarConfirmacionIdempotente(postulacion, detalle, request);
        }

        detalle.setIdEmpleadoContratado(request.getIdEmpleadoContratado());
        detalle.setFechaContratacion(request.getFechaContratacion());
        postulacion.setEstado(EstadoPostulacion.FINALIZADA);
        grupoCapacitacionDetalleRepository.save(detalle);
        Postulacion postulacionGuardada = postulacionRepository.save(postulacion);

        eventoService.registrarEvento(
                postulacionGuardada,
                Accion.CONFIRMACION_CONTRATACION,
                null,
                null,
                null,
                null,
                null,
                "Contratacion confirmada con idEmpleado " + request.getIdEmpleadoContratado()
        );

        postulacionRealtimeNotifier.publishAfterCommit(
                "CONFIRMACION_CONTRATACION",
                "CONTRATACION",
                postulacionGuardada,
                etapaAnterior,
                estadoAnterior,
                estadoBandejaAnterior,
                detalle.getGrupoCapacitacion().getId(),
                postulacionGuardada.getOfertaLaboral().getPuestoObjetivo()
        );

        return mapearPostulacionResponse(postulacionGuardada);
    }

    private OfertaLaboral obtenerOfertaActiva(Long idOfertaLaboral) {
        OfertaLaboral ofertaLaboral = ofertaLaboralRepository.findById(idOfertaLaboral)
                .orElseThrow(() -> new NotFoundException(OfertaLaboral.class, idOfertaLaboral));

        if (ofertaLaboral.getEstado() != EstadoOferta.ACTIVO) {
            throw new BadRequestException("La postulacion solo puede registrarse o editarse con una oferta laboral activa");
        }

        return ofertaLaboral;
    }

    private void validarTipificacionActiva(Tipificacion tipificacion) {
        if (!Boolean.TRUE.equals(tipificacion.getActivo())) {
            throw new BadRequestException("La tipificacion enviada esta inactiva");
        }
    }

    private void validarPostulacionNoContratada(Postulacion postulacion) {
        grupoCapacitacionDetalleRepository.findByPostulacionId(postulacion.getId())
                .ifPresent(detalle -> {
                    if (detalle.getIdEmpleadoContratado() != null) {
                        throw new BadRequestException("La postulacion ya tiene una contratacion confirmada y no admite nuevas tipificaciones");
                    }
                });
    }

    private void validarSubtipificacionActiva(Subtipificacion subtipificacion) {
        if (!Boolean.TRUE.equals(subtipificacion.getActivo())) {
            throw new BadRequestException("La subtipificacion enviada esta inactiva");
        }
    }

    private void validarTipificacionPorEtapa(Postulacion postulacion, Tipificacion tipificacion) {
        if (tipificacion.getEtapa() != postulacion.getEtapa()) {
            throw new BadRequestException("La tipificacion no pertenece a la etapa actual de la postulacion");
        }
    }

    private void validarSubtipificacionPerteneceATipificacion(Tipificacion tipificacion, Subtipificacion subtipificacion) {
        if (!subtipificacion.getTipificacion().getId().equals(tipificacion.getId())) {
            throw new BadRequestException("La subtipificacion no pertenece a la tipificacion enviada");
        }
    }

    private void validarAlcanceSubtipificacion(Postulacion postulacion, Subtipificacion subtipificacion) {
        if (subtipificacion.getAlcance() == AlcanceSubtipificacion.GENERAL) {
            return;
        }

        PuestoObjetivo puestoObjetivo = postulacion.getOfertaLaboral().getPuestoObjetivo();
        if (puestoObjetivo != PuestoObjetivo.ASESOR_VENTAS
                || subtipificacion.getAlcance() != AlcanceSubtipificacion.ASESOR_VENTAS) {
            throw new BadRequestException("La subtipificacion no aplica al puesto objetivo de la postulacion");
        }
    }

    private TipificacionContext prepararTipificacion(Long idPostulacion, Long idTipificacion, Long idSubtipificacion) {
        Postulacion postulacion = postulacionRepository.findById(idPostulacion)
                .orElseThrow(() -> new NotFoundException(Postulacion.class, idPostulacion));

        Tipificacion tipificacion = tipificacionRepository.findById(idTipificacion)
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, idTipificacion));

        Subtipificacion subtipificacion = subtipificacionRepository.findById(idSubtipificacion)
                .orElseThrow(() -> new NotFoundException(Subtipificacion.class, idSubtipificacion));

        validarTipificacionActiva(tipificacion);
        validarSubtipificacionActiva(subtipificacion);
        validarTipificacionPorEtapa(postulacion, tipificacion);
        validarSubtipificacionPerteneceATipificacion(tipificacion, subtipificacion);
        validarAlcanceSubtipificacion(postulacion, subtipificacion);
        validarPostulacionNoContratada(postulacion);

        return new TipificacionContext(postulacion, tipificacion, subtipificacion);
    }

    private Postulacion aplicarTipificacion(
            Postulacion postulacion,
            Tipificacion tipificacion,
            Subtipificacion subtipificacion,
            pe.albrugroup.recruitment_service.entity.enums.ModalidadContacto modalidadContacto,
            String observacion
    ) {
        aplicarCambiosDeSubtipificacion(postulacion, subtipificacion);
        sincronizarDetalleGrupoCapacitacion(postulacion, tipificacion);

        Postulacion postulacionGuardada = postulacionRepository.save(postulacion);
        eventoService.registrarEvento(
                postulacionGuardada,
                Accion.TIPIFICACION,
                modalidadContacto,
                tipificacion.getId(),
                subtipificacion.getId(),
                tipificacion.getCodigo(),
                subtipificacion.getCodigo(),
                observacion
        );
        return postulacionGuardada;
    }

    private void aplicarCambiosDeSubtipificacion(Postulacion postulacion, Subtipificacion subtipificacion) {
        if (subtipificacion.getEtapaDestino() != null) {
            postulacion.setEtapa(subtipificacion.getEtapaDestino());
        }

        if (subtipificacion.getEstadoDestino() != null) {
            postulacion.setEstado(subtipificacion.getEstadoDestino());
        }

        if (subtipificacion.getEstadoBandejaDestino() != null) {
            postulacion.setEstadoBandeja(subtipificacion.getEstadoBandejaDestino());
        }
    }

    private boolean requiereAsignacionGrupoEnTipificacionEspecial(Postulacion postulacion, Subtipificacion subtipificacion) {
        return postulacion.getEtapa() == Etapa.RECLUTAMIENTO
                && postulacion.getOfertaLaboral().getPuestoObjetivo() == PuestoObjetivo.ASESOR_VENTAS
                && subtipificacion.getEtapaDestino() == Etapa.CAPACITACION;
    }

    private void validarAsignacionGrupoCapacitacion(
            Postulacion postulacion,
            Subtipificacion subtipificacion,
            Long idGrupoCapacitacion
    ) {
        boolean requiereAsignacion = requiereAsignacionGrupoEnTipificacionEspecial(postulacion, subtipificacion);

        if (requiereAsignacion && idGrupoCapacitacion == null) {
            throw new BadRequestException(
                    "Las postulaciones ASESOR_VENTAS que pasan a CAPACITACION deben enviarse con idGrupoCapacitacion"
            );
        }

        if (!requiereAsignacion && idGrupoCapacitacion != null) {
            throw new BadRequestException(
                    "idGrupoCapacitacion solo se permite cuando una postulacion ASESOR_VENTAS pasa de RECLUTAMIENTO a CAPACITACION"
            );
        }
    }

    private void sincronizarDetalleGrupoCapacitacion(Postulacion postulacion, Tipificacion tipificacion) {
        grupoCapacitacionDetalleRepository.findByPostulacionId(postulacion.getId())
                .ifPresent(detalle -> {
                    EstadoCapacitacionPostulante nuevoEstado = resolverEstadoCapacitacionSegunTipificacion(tipificacion);
                    if (nuevoEstado == null) {
                        return;
                    }

                    validarTransicionDetalleCapacitacion(detalle.getEstadoCapacitacion(), nuevoEstado);
                    detalle.setEstadoCapacitacion(nuevoEstado);

                    if (nuevoEstado == EstadoCapacitacionPostulante.APROBADO
                            || nuevoEstado == EstadoCapacitacionPostulante.DESAPROBADO
                            || nuevoEstado == EstadoCapacitacionPostulante.RETIRADO) {
                        detalle.setFechaResultado(java.time.LocalDate.now());
                    }

                    grupoCapacitacionDetalleRepository.save(detalle);
                });
    }

    private EstadoCapacitacionPostulante resolverEstadoCapacitacionSegunTipificacion(Tipificacion tipificacion) {
        if (tipificacion.getEtapa() != Etapa.CAPACITACION) {
            return null;
        }

        return switch (tipificacion.getCodigo()) {
            case "EN_CURSO" -> EstadoCapacitacionPostulante.EN_CAPACITACION;
            case "APROBADO" -> EstadoCapacitacionPostulante.APROBADO;
            case "DESAPROBADO" -> EstadoCapacitacionPostulante.DESAPROBADO;
            case "RETIRADO" -> EstadoCapacitacionPostulante.RETIRADO;
            default -> null;
        };
    }

    private void validarTransicionDetalleCapacitacion(
            EstadoCapacitacionPostulante estadoActual,
            EstadoCapacitacionPostulante nuevoEstado
    ) {
        if (estadoActual == null || estadoActual == nuevoEstado) {
            return;
        }

        if (estadoActual == EstadoCapacitacionPostulante.APROBADO
                || estadoActual == EstadoCapacitacionPostulante.DESAPROBADO
                || estadoActual == EstadoCapacitacionPostulante.RETIRADO) {
            throw new BadRequestException("El detalle del grupo ya se encuentra en un estado final y no admite nuevas tipificaciones de capacitacion");
        }
    }

    private Specification<Postulacion> conEtapa(Etapa etapa) {
        return (root, query, builder) -> etapa == null ? null : builder.equal(root.get("etapa"), etapa);
    }

    private Specification<Postulacion> conEstado(EstadoPostulacion estado) {
        return (root, query, builder) -> estado == null ? null : builder.equal(root.get("estado"), estado);
    }

    private Specification<Postulacion> conEstadoBandeja(EstadoBandejaPostulacion estadoBandeja) {
        return (root, query, builder) -> estadoBandeja == null ? null : builder.equal(root.get("estadoBandeja"), estadoBandeja);
    }

    private Specification<Postulacion> conPuestoObjetivo(PuestoObjetivo puestoObjetivo) {
        return (root, query, builder) -> puestoObjetivo == null
                ? null
                : builder.equal(root.get("ofertaLaboral").get("puestoObjetivo"), puestoObjetivo);
    }

    private Specification<Postulacion> enProcesoOReciente(Instant limiteReciente) {
        return (root, query, builder) -> builder.or(
                builder.equal(root.get("estado"), EstadoPostulacion.EN_PROCESO),
                builder.greaterThanOrEqualTo(root.get("updatedAt"), limiteReciente)
        );
    }

    private void validarPostulacionListaParaContratar(Postulacion postulacion, EstadoCapacitacionPostulante estadoCapacitacion) {
        if (postulacion.getEtapa() != Etapa.CONTRATACION) {
            throw new BadRequestException("Solo se puede confirmar la contratacion de postulaciones en etapa CONTRATACION");
        }

        if (estadoCapacitacion != EstadoCapacitacionPostulante.APROBADO) {
            throw new BadRequestException("Solo se puede confirmar la contratacion de postulaciones aprobadas en capacitacion");
        }
    }

    private PostulacionResponse manejarConfirmacionIdempotente(
            Postulacion postulacion,
            pe.albrugroup.recruitment_service.entity.GrupoCapacitacionDetalle detalle,
            ConfirmarContratacionRequest request
    ) {
        boolean mismoEmpleado = detalle.getIdEmpleadoContratado().equals(request.getIdEmpleadoContratado());
        boolean mismaFecha = detalle.getFechaContratacion().equals(request.getFechaContratacion());
        if (mismoEmpleado && mismaFecha && postulacion.getEstado() == EstadoPostulacion.FINALIZADA) {
            return postulacionMapper.toResponse(postulacion);
        }

        throw new ConflictException("La postulacion ya tiene una contratacion confirmada con datos diferentes");
    }

    private PostulacionResponse mapearPostulacionResponse(Postulacion postulacion) {
        PostulacionResponse response = postulacionMapper.toResponse(postulacion);
        grupoCapacitacionDetalleRepository.findByPostulacionId(postulacion.getId())
                .ifPresent(detalle -> response.setIdGrupoCapacitacion(detalle.getGrupoCapacitacion().getId()));
        return response;
    }

    private Specification<Postulacion> sinGrupoCapacitacion() {
        return (root, query, builder) -> {
            var subquery = query.subquery(Long.class);
            var detalleRoot = subquery.from(GrupoCapacitacionDetalle.class);
            subquery.select(builder.literal(1L))
                    .where(builder.equal(detalleRoot.get("postulacion").get("id"), root.get("id")));
            return builder.not(builder.exists(subquery));
        };
    }

    private Specification<Postulacion> listoParaContratacion() {
        return (root, query, builder) -> {
            var subquery = query.subquery(Long.class);
            var detalleRoot = subquery.from(GrupoCapacitacionDetalle.class);
            subquery.select(builder.literal(1L))
                    .where(
                            builder.equal(detalleRoot.get("postulacion").get("id"), root.get("id")),
                            builder.equal(detalleRoot.get("estadoCapacitacion"), EstadoCapacitacionPostulante.APROBADO),
                            builder.isNull(detalleRoot.get("idEmpleadoContratado"))
                    );
            return builder.exists(subquery);
        };
    }

    private record TipificacionContext(
            Postulacion postulacion,
            Tipificacion tipificacion,
            Subtipificacion subtipificacion
    ) {
    }
}
