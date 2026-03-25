package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.albrugroup.recruitment_service.entity.OfertaLaboral;
import pe.albrugroup.recruitment_service.entity.Postulacion;
import pe.albrugroup.recruitment_service.entity.Postulante;
import pe.albrugroup.recruitment_service.entity.Subtipificacion;
import pe.albrugroup.recruitment_service.entity.Tipificacion;
import pe.albrugroup.recruitment_service.entity.enums.Accion;
import pe.albrugroup.recruitment_service.entity.enums.AlcanceSubtipificacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoBandejaPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoOferta;
import pe.albrugroup.recruitment_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.request.PostulacionRequest;
import pe.albrugroup.recruitment_service.entity.request.TipificarPostulacionRequest;
import pe.albrugroup.recruitment_service.entity.response.PostulacionResponse;
import pe.albrugroup.recruitment_service.exception.NotFoundException;
import pe.albrugroup.recruitment_service.repository.OfertaLaboralRepository;
import pe.albrugroup.recruitment_service.repository.PostulacionRepository;
import pe.albrugroup.recruitment_service.repository.SubtipificacionRepository;
import pe.albrugroup.recruitment_service.repository.TipificacionRepository;
import pe.albrugroup.recruitment_service.service.mapper.PostulacionMapper;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class PostulacionService {

    private final PostulacionRepository postulacionRepository;
    private final OfertaLaboralRepository ofertaLaboralRepository;
    private final PostulanteService postulanteService;
    private final EventoService eventoService;
    private final PostulacionMapper postulacionMapper;
    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;

    public PostulacionResponse registrarPostulacion(PostulacionRequest request) {
        OfertaLaboral ofertaLaboral = obtenerOfertaActiva(request.getIdOfertaLaboral());
        Postulante postulante = postulanteService.crearOActualizar(request.getPostulante());

        Postulacion postulacion = Postulacion.builder()
                .postulante(postulante)
                .ofertaLaboral(ofertaLaboral)
                .idEmpleadoRegistrador(null)
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

        return postulacionMapper.toResponse(postulacionGuardada);
    }

    public PostulacionResponse tipificarPostulacion(Long idPostulacion, TipificarPostulacionRequest request) {
        Postulacion postulacion = postulacionRepository.findById(idPostulacion)
                .orElseThrow(() -> new NotFoundException(Postulacion.class, idPostulacion));

        Tipificacion tipificacion = tipificacionRepository.findById(request.getIdTipificacion())
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, request.getIdTipificacion()));

        Subtipificacion subtipificacion = subtipificacionRepository.findById(request.getIdSubtipificacion())
                .orElseThrow(() -> new NotFoundException(Subtipificacion.class, request.getIdSubtipificacion()));

        validarTipificacionActiva(tipificacion);
        validarSubtipificacionActiva(subtipificacion);
        validarTipificacionPorEtapa(postulacion, tipificacion);
        validarSubtipificacionPerteneceATipificacion(tipificacion, subtipificacion);
        validarAlcanceSubtipificacion(postulacion, subtipificacion);

        aplicarCambiosDeSubtipificacion(postulacion, subtipificacion);

        Postulacion postulacionGuardada = postulacionRepository.save(postulacion);
        eventoService.registrarEvento(
                postulacionGuardada,
                Accion.TIPIFICACION,
                null,
                tipificacion.getId(),
                subtipificacion.getId(),
                tipificacion.getCodigo(),
                subtipificacion.getCodigo(),
                request.getObservacion()
        );

        return postulacionMapper.toResponse(postulacionGuardada);
    }

    public PostulacionResponse editarPostulacion(Long idPostulacion, PostulacionRequest request) {
        Postulacion postulacion = postulacionRepository.findById(idPostulacion)
                .orElseThrow(() -> new NotFoundException(Postulacion.class, idPostulacion));

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

        return postulacionMapper.toResponse(postulacionGuardada);
    }

    @Transactional(readOnly = true)
    public PostulacionResponse obtenerPostulacion(Long idPostulacion) {
        Postulacion postulacion = postulacionRepository.findById(idPostulacion)
                .orElseThrow(() -> new NotFoundException(Postulacion.class, idPostulacion));
        return postulacionMapper.toResponse(postulacion);
    }

    @Transactional(readOnly = true)
    public List<PostulacionResponse> listarPostulaciones(
            Etapa etapa,
            EstadoPostulacion estado,
            EstadoBandejaPostulacion estadoBandeja
    ) {
        Specification<Postulacion> spec = Specification.where(conEtapa(etapa))
                .and(conEstado(estado))
                .and(conEstadoBandeja(estadoBandeja));

        return postulacionRepository.findAll(spec, org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC,
                        "createdAt"
                )).stream()
                .map(postulacionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostulacionResponse> listarPostulacionesActivas(Etapa etapa, EstadoBandejaPostulacion estadoBandeja) {
        return listarPostulaciones(etapa, EstadoPostulacion.EN_PROCESO, estadoBandeja);
    }

    private OfertaLaboral obtenerOfertaActiva(Long idOfertaLaboral) {
        OfertaLaboral ofertaLaboral = ofertaLaboralRepository.findById(idOfertaLaboral)
                .orElseThrow(() -> new NotFoundException(OfertaLaboral.class, idOfertaLaboral));

        if (ofertaLaboral.getEstado() != EstadoOferta.ACTIVO) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La postulacion solo puede registrarse o editarse con una oferta laboral activa"
            );
        }

        return ofertaLaboral;
    }

    private void validarTipificacionActiva(Tipificacion tipificacion) {
        if (!Boolean.TRUE.equals(tipificacion.getActivo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La tipificacion enviada esta inactiva");
        }
    }

    private void validarSubtipificacionActiva(Subtipificacion subtipificacion) {
        if (!Boolean.TRUE.equals(subtipificacion.getActivo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La subtipificacion enviada esta inactiva");
        }
    }

    private void validarTipificacionPorEtapa(Postulacion postulacion, Tipificacion tipificacion) {
        if (tipificacion.getEtapa() != postulacion.getEtapa()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La tipificacion no pertenece a la etapa actual de la postulacion"
            );
        }
    }

    private void validarSubtipificacionPerteneceATipificacion(Tipificacion tipificacion, Subtipificacion subtipificacion) {
        if (!subtipificacion.getTipificacion().getId().equals(tipificacion.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La subtipificacion no pertenece a la tipificacion enviada"
            );
        }
    }

    private void validarAlcanceSubtipificacion(Postulacion postulacion, Subtipificacion subtipificacion) {
        if (subtipificacion.getAlcance() == AlcanceSubtipificacion.GENERAL) {
            return;
        }

        PuestoObjetivo puestoObjetivo = postulacion.getOfertaLaboral().getPuestoObjetivo();
        if (puestoObjetivo != PuestoObjetivo.ASESOR_VENTAS
                || subtipificacion.getAlcance() != AlcanceSubtipificacion.ASESOR_VENTAS) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La subtipificacion no aplica al puesto objetivo de la postulacion"
            );
        }
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

    private Specification<Postulacion> conEtapa(Etapa etapa) {
        return (root, query, builder) -> etapa == null ? null : builder.equal(root.get("etapa"), etapa);
    }

    private Specification<Postulacion> conEstado(EstadoPostulacion estado) {
        return (root, query, builder) -> estado == null ? null : builder.equal(root.get("estado"), estado);
    }

    private Specification<Postulacion> conEstadoBandeja(EstadoBandejaPostulacion estadoBandeja) {
        return (root, query, builder) -> estadoBandeja == null ? null : builder.equal(root.get("estadoBandeja"), estadoBandeja);
    }
}
