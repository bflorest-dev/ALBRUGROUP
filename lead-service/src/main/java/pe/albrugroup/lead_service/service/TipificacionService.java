package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.configuration.CacheNames;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.CatalogoEstadoRequest;
import pe.albrugroup.lead_service.entity.request.CatalogoRequest;
import pe.albrugroup.lead_service.entity.request.SubtipificacionCatalogoRequest;
import pe.albrugroup.lead_service.entity.request.TipificacionCatalogoRequest;
import pe.albrugroup.lead_service.entity.response.CatalogoResponse;
import pe.albrugroup.lead_service.entity.response.SubtipificacionResponse;
import pe.albrugroup.lead_service.entity.response.TipificacionResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;
import pe.albrugroup.lead_service.service.mapper.TipificacionMapper;

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

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class TipificacionService {

    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final TipificacionMapper mapper;

    @Cacheable(value = CacheNames.TIPIFICACIONES, key = "#etapa")
    public CatalogoResponse getCatalogoPorEtapa(Etapa etapa) {
        List<Tipificacion> tipificaciones = tipificacionRepository.findByEtapaAndActivoTrueOrderByOrdenAsc(etapa);
        if (tipificaciones.isEmpty()) {
            return new CatalogoResponse(etapa, List.of());
        }

        List<Subtipificacion> subtipificaciones = subtipificacionRepository
                .findByTipificacionInAndActivoTrueOrderByTipificacion_IdAscOrdenAsc(tipificaciones);

        Map<Long, List<SubtipificacionResponse>> subtipificacionesPorTipificacionId = new HashMap<>();
        for (Subtipificacion subtipificacion : subtipificaciones) {
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

        return new CatalogoResponse(etapa, tipificacionesResponse);
    }

    @Transactional
    @CacheEvict(value = CacheNames.TIPIFICACIONES, allEntries = true)
    public CatalogoResponse upsertCatalogo(CatalogoRequest request) {
        List<TipificacionCatalogoRequest> tipificacionesRequest = Objects.requireNonNullElse(
                request.getTipificaciones(),
                List.of()
        );

        for (TipificacionCatalogoRequest tipificacionRequest : tipificacionesRequest) {
            Tipificacion tipificacion = upsertTipificacion(request.getEtapa(), tipificacionRequest);
            List<SubtipificacionCatalogoRequest> subtipificacionesRequest = Objects.requireNonNullElse(
                    tipificacionRequest.getSubtipificaciones(),
                    List.of()
            );
            for (SubtipificacionCatalogoRequest subtipificacionRequest : subtipificacionesRequest) {
                upsertSubtipificacion(tipificacion, subtipificacionRequest);
            }
        }

        return getCatalogoPorEtapa(request.getEtapa());
    }

    @Transactional
    @CacheEvict(value = CacheNames.TIPIFICACIONES, allEntries = true)
    public CatalogoResponse actualizarEstadoCatalogo(CatalogoEstadoRequest request) {
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

        return getCatalogoPorEtapa(request.getEtapa());
    }

    private Tipificacion upsertTipificacion(Etapa etapa, TipificacionCatalogoRequest request) {
        if (request.getId() == null) {
            Tipificacion tipificacion = mapper.toEntity(request);
            tipificacion.setEtapa(etapa);
            tipificacion.setActivo(Boolean.TRUE);
            return tipificacionRepository.save(tipificacion);
        }

        Tipificacion tipificacion = tipificacionRepository.findById(request.getId())
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, request.getId()));

        mapper.updateDatosTipificacion(request, tipificacion);
        tipificacion.setEtapa(etapa);
        tipificacion.setActivo(Boolean.TRUE);
        return tipificacionRepository.save(tipificacion);
    }

    private void upsertSubtipificacion(Tipificacion tipificacion, SubtipificacionCatalogoRequest request) {
        if (request.getId() == null) {
            Subtipificacion subtipificacion = mapper.toEntity(request);
            subtipificacion.setTipificacion(tipificacion);
            subtipificacion.setActivo(Boolean.TRUE);
            subtipificacionRepository.save(subtipificacion);
            return;
        }

        Subtipificacion subtipificacion = subtipificacionRepository.findById(request.getId())
                .orElseThrow(() -> new NotFoundException(Subtipificacion.class, request.getId()));

        if (!subtipificacion.getTipificacion().getId().equals(tipificacion.getId())) {
            throw new BadRequestException(
                    "La subtipificacion no pertenece a la tipificacion indicada",
                    request.getId(),
                    tipificacion.getId()
            );
        }

        mapper.updateDatosSubtipificacion(request, subtipificacion);
        subtipificacion.setActivo(Boolean.TRUE);
        subtipificacionRepository.save(subtipificacion);
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
            throw new BadRequestException(
                    "La solicitud no tiene operaciones para ejecutar",
                    null,
                    null
            );
        }

        validarInterseccionVacia(tipificacionesActivar, tipificacionesDesactivar, "tipificaciones");
        validarInterseccionVacia(subtipificacionesActivar, subtipificacionesDesactivar, "subtipificaciones");
    }

    private void validarInterseccionVacia(List<Long> activar, List<Long> desactivar, String tipo) {
        Set<Long> conflicto = new HashSet<>(activar);
        conflicto.retainAll(desactivar);
        if (!conflicto.isEmpty()) {
            throw new BadRequestException(
                    "No se puede activar y desactivar el mismo elemento en la misma solicitud",
                    null,
                    Map.of("tipo", tipo, "ids", conflicto)
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
                throw new BadRequestException(
                        "La tipificacion no pertenece a la etapa enviada",
                        null,
                        Map.of("idTipificacion", id, "etapa", etapa)
                );
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
                throw new BadRequestException(
                        "La subtipificacion no pertenece a la etapa enviada",
                        null,
                        Map.of("idSubtipificacion", id, "etapa", etapa)
                );
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
                throw new BadRequestException(
                        "No se puede activar una subtipificacion cuando su tipificacion esta inactiva",
                        id,
                        subtipificacion.getTipificacion().getId()
                );
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
