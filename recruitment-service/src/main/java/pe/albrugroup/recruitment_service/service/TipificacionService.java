package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.albrugroup.recruitment_service.entity.Subtipificacion;
import pe.albrugroup.recruitment_service.entity.Tipificacion;
import pe.albrugroup.recruitment_service.entity.enums.AlcanceSubtipificacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.request.CatalogoEstadoRequest;
import pe.albrugroup.recruitment_service.entity.request.CatalogoTipificacionRequest;
import pe.albrugroup.recruitment_service.entity.request.SubtipificacionRequest;
import pe.albrugroup.recruitment_service.entity.request.TipificacionRequest;
import pe.albrugroup.recruitment_service.entity.response.CatalogoTipificacionResponse;
import pe.albrugroup.recruitment_service.entity.response.SubtipificacionResponse;
import pe.albrugroup.recruitment_service.entity.response.TipificacionResponse;
import pe.albrugroup.recruitment_service.exception.NotFoundException;
import pe.albrugroup.recruitment_service.repository.SubtipificacionRepository;
import pe.albrugroup.recruitment_service.repository.TipificacionRepository;
import pe.albrugroup.recruitment_service.service.mapper.TipificacionMapper;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class TipificacionService {

    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final TipificacionMapper mapper;

    public CatalogoTipificacionResponse getCatalogoPorEtapa(Etapa etapa, PuestoObjetivo puestoObjetivo) {
        List<Tipificacion> tipificaciones = tipificacionRepository.findByEtapaAndActivoTrueOrderByOrdenAsc(etapa);
        if (tipificaciones.isEmpty()) {
            return new CatalogoTipificacionResponse(etapa, List.of());
        }

        List<Subtipificacion> subtipificaciones = subtipificacionRepository
                .findByTipificacionInAndActivoTrueOrderByTipificacion_IdAscOrdenAsc(tipificaciones);

        Map<Long, List<SubtipificacionResponse>> subtipificacionesPorTipificacionId = new HashMap<>();
        for (Subtipificacion subtipificacion : subtipificaciones) {
            if (!debeIncluirse(subtipificacion, puestoObjetivo)) {
                continue;
            }

            Long tipificacionId = subtipificacion.getTipificacion().getId();
            subtipificacionesPorTipificacionId
                    .computeIfAbsent(tipificacionId, key -> new java.util.ArrayList<>())
                    .add(mapper.toResponse(subtipificacion));
        }

        List<TipificacionResponse> tipificacionesResponse = tipificaciones.stream()
                .map(tipificacion -> mapper.toResponse(
                        tipificacion,
                        subtipificacionesPorTipificacionId.getOrDefault(tipificacion.getId(), List.of())
                ))
                .toList();

        return new CatalogoTipificacionResponse(etapa, tipificacionesResponse);
    }

    @Transactional
    public CatalogoTipificacionResponse crearCatalogo(CatalogoTipificacionRequest request) {
        for (TipificacionRequest tipificacionRequest : request.getTipificaciones()) {
            Tipificacion tipificacion = crearTipificacion(request.getEtapa(), tipificacionRequest);
            List<SubtipificacionRequest> subtipificacionesRequest = Objects.requireNonNullElse(
                    tipificacionRequest.getSubtipificaciones(),
                    List.of()
            );
            for (SubtipificacionRequest subtipificacionRequest : subtipificacionesRequest) {
                crearSubtipificacion(tipificacion, subtipificacionRequest);
            }
        }

        return getCatalogoPorEtapa(request.getEtapa(), null);
    }

    @Transactional
    public SubtipificacionResponse crearSubtipificacion(Long tipificacionId, SubtipificacionRequest request) {
        Tipificacion tipificacion = tipificacionRepository.findById(tipificacionId)
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, tipificacionId));

        if (!Boolean.TRUE.equals(tipificacion.getActivo())) {
            throw new ResponseStatusException(BAD_REQUEST, "Solo se pueden agregar subtipificaciones a tipificaciones activas");
        }

        validarCodigoSubtipificacionDisponible(tipificacion.getId(), request.getCodigo());
        Subtipificacion subtipificacion = crearSubtipificacion(tipificacion, request);
        return mapper.toResponse(subtipificacion);
    }

    @Transactional
    public CatalogoTipificacionResponse actualizarEstadoCatalogo(CatalogoEstadoRequest request) {
        List<Long> tipificacionesActivar = normalizarIds(request.getTipificacionesActivar());
        List<Long> tipificacionesDesactivar = normalizarIds(request.getTipificacionesDesactivar());
        List<Long> subtipificacionesActivar = normalizarIds(request.getSubtipificacionesActivar());
        List<Long> subtipificacionesDesactivar = normalizarIds(request.getSubtipificacionesDesactivar());

        validarSolicitudEstado(
                tipificacionesActivar,
                tipificacionesDesactivar,
                subtipificacionesActivar,
                subtipificacionesDesactivar
        );

        Map<Long, Tipificacion> tipificacionesPorId = buscarTipificacionesPorId(
                unirIds(tipificacionesActivar, tipificacionesDesactivar),
                request.getEtapa()
        );

        Map<Long, Subtipificacion> subtipificacionesPorId = buscarSubtipificacionesPorId(
                unirIds(subtipificacionesActivar, subtipificacionesDesactivar),
                request.getEtapa()
        );

        desactivarTipificaciones(tipificacionesDesactivar, tipificacionesPorId);
        desactivarSubtipificacionesPorTipificacion(tipificacionesDesactivar);
        desactivarSubtipificaciones(subtipificacionesDesactivar, subtipificacionesPorId);

        activarTipificaciones(tipificacionesActivar, tipificacionesPorId);
        activarSubtipificaciones(subtipificacionesActivar, subtipificacionesPorId);

        return getCatalogoPorEtapa(request.getEtapa(), null);
    }

    private Tipificacion crearTipificacion(Etapa etapa, TipificacionRequest request) {
        validarCodigoTipificacionDisponible(etapa, request.getCodigo());

        Tipificacion tipificacion = mapper.toEntity(request);
        tipificacion.setEtapa(etapa);
        tipificacion.setActivo(Boolean.TRUE);
        return tipificacionRepository.save(tipificacion);
    }

    private Subtipificacion crearSubtipificacion(Tipificacion tipificacion, SubtipificacionRequest request) {
        validarCodigoSubtipificacionDisponible(tipificacion.getId(), request.getCodigo());

        Subtipificacion subtipificacion = mapper.toEntity(request);
        subtipificacion.setTipificacion(tipificacion);
        subtipificacion.setActivo(Boolean.TRUE);
        return subtipificacionRepository.save(subtipificacion);
    }

    private void validarCodigoTipificacionDisponible(Etapa etapa, String codigo) {
        if (tipificacionRepository.existsByEtapaAndCodigoIgnoreCase(etapa, codigo)) {
            throw new ResponseStatusException(CONFLICT, "Ya existe una tipificacion con el codigo indicado para la etapa");
        }
    }

    private void validarCodigoSubtipificacionDisponible(Long tipificacionId, String codigo) {
        if (subtipificacionRepository.existsByTipificacionIdAndCodigoIgnoreCase(tipificacionId, codigo)) {
            throw new ResponseStatusException(CONFLICT, "Ya existe una subtipificacion con el codigo indicado para la tipificacion");
        }
    }

    private List<Long> normalizarIds(List<Long> ids) {
        return Objects.requireNonNullElse(ids, List.of());
    }

    private void validarSolicitudEstado(
            List<Long> tipificacionesActivar,
            List<Long> tipificacionesDesactivar,
            List<Long> subtipificacionesActivar,
            List<Long> subtipificacionesDesactivar
    ) {
        if (tipificacionesActivar.isEmpty()
                && tipificacionesDesactivar.isEmpty()
                && subtipificacionesActivar.isEmpty()
                && subtipificacionesDesactivar.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "La solicitud no tiene operaciones para ejecutar");
        }

        validarInterseccionVacia(tipificacionesActivar, tipificacionesDesactivar, "tipificaciones");
        validarInterseccionVacia(subtipificacionesActivar, subtipificacionesDesactivar, "subtipificaciones");
    }

    private boolean debeIncluirse(Subtipificacion subtipificacion, PuestoObjetivo puestoObjetivo) {
        if (puestoObjetivo == null) {
            return true;
        }

        if (subtipificacion.getAlcance() == AlcanceSubtipificacion.GENERAL) {
            return true;
        }

        return puestoObjetivo == PuestoObjetivo.ASESOR_VENTAS
                && subtipificacion.getAlcance() == AlcanceSubtipificacion.ASESOR_VENTAS;
    }

    private void validarInterseccionVacia(List<Long> activar, List<Long> desactivar, String tipo) {
        Set<Long> conflicto = new HashSet<>(activar);
        conflicto.retainAll(desactivar);
        if (!conflicto.isEmpty()) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "No se puede activar y desactivar el mismo conjunto de " + tipo + " en la misma solicitud"
            );
        }
    }

    private Map<Long, Tipificacion> buscarTipificacionesPorId(Collection<Long> ids, Etapa etapa) {
        if (ids.isEmpty()) {
            return Map.of();
        }

        List<Tipificacion> tipificaciones = tipificacionRepository.findAllById(ids);
        Map<Long, Tipificacion> resultado = tipificaciones.stream()
                .collect(Collectors.toMap(Tipificacion::getId, Function.identity()));

        for (Long id : ids) {
            Tipificacion tipificacion = resultado.get(id);
            if (tipificacion == null) {
                throw new NotFoundException(Tipificacion.class, id);
            }
            if (tipificacion.getEtapa() != etapa) {
                throw new ResponseStatusException(BAD_REQUEST, "La tipificacion no pertenece a la etapa enviada");
            }
        }

        return resultado;
    }

    private Map<Long, Subtipificacion> buscarSubtipificacionesPorId(Collection<Long> ids, Etapa etapa) {
        if (ids.isEmpty()) {
            return Map.of();
        }

        List<Subtipificacion> subtipificaciones = subtipificacionRepository.findAllById(ids);
        Map<Long, Subtipificacion> resultado = subtipificaciones.stream()
                .collect(Collectors.toMap(Subtipificacion::getId, Function.identity()));

        for (Long id : ids) {
            Subtipificacion subtipificacion = resultado.get(id);
            if (subtipificacion == null) {
                throw new NotFoundException(Subtipificacion.class, id);
            }
            if (subtipificacion.getTipificacion().getEtapa() != etapa) {
                throw new ResponseStatusException(BAD_REQUEST, "La subtipificacion no pertenece a la etapa enviada");
            }
        }

        return resultado;
    }

    private void desactivarTipificaciones(List<Long> tipificacionesDesactivar, Map<Long, Tipificacion> tipificacionesPorId) {
        for (Long id : tipificacionesDesactivar) {
            Tipificacion tipificacion = tipificacionesPorId.get(id);
            tipificacion.setActivo(Boolean.FALSE);
            tipificacionRepository.save(tipificacion);
        }
    }

    private void desactivarSubtipificacionesPorTipificacion(List<Long> tipificacionesDesactivar) {
        if (tipificacionesDesactivar.isEmpty()) {
            return;
        }

        List<Subtipificacion> subtipificaciones = subtipificacionRepository.findByTipificacionIdIn(tipificacionesDesactivar);
        for (Subtipificacion subtipificacion : subtipificaciones) {
            subtipificacion.setActivo(Boolean.FALSE);
            subtipificacionRepository.save(subtipificacion);
        }
    }

    private void desactivarSubtipificaciones(List<Long> subtipificacionesDesactivar, Map<Long, Subtipificacion> subtipificacionesPorId) {
        for (Long id : subtipificacionesDesactivar) {
            Subtipificacion subtipificacion = subtipificacionesPorId.get(id);
            subtipificacion.setActivo(Boolean.FALSE);
            subtipificacionRepository.save(subtipificacion);
        }
    }

    private void activarTipificaciones(List<Long> tipificacionesActivar, Map<Long, Tipificacion> tipificacionesPorId) {
        for (Long id : tipificacionesActivar) {
            Tipificacion tipificacion = tipificacionesPorId.get(id);
            tipificacion.setActivo(Boolean.TRUE);
            tipificacionRepository.save(tipificacion);
        }
    }

    private void activarSubtipificaciones(List<Long> subtipificacionesActivar, Map<Long, Subtipificacion> subtipificacionesPorId) {
        for (Long id : subtipificacionesActivar) {
            Subtipificacion subtipificacion = subtipificacionesPorId.get(id);
            if (!Boolean.TRUE.equals(subtipificacion.getTipificacion().getActivo())) {
                throw new ResponseStatusException(BAD_REQUEST, "No se puede activar una subtipificacion si su tipificacion padre esta inactiva");
            }

            subtipificacion.setActivo(Boolean.TRUE);
            subtipificacionRepository.save(subtipificacion);
        }
    }

    private List<Long> unirIds(List<Long> primero, List<Long> segundo) {
        List<Long> ids = new ArrayList<>(primero);
        ids.addAll(segundo);
        return ids;
    }
}
