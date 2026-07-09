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
import pe.albrugroup.lead_service.entity.request.MatrizCatalogoRequest;
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
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
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

    @Transactional
    @CacheEvict(value = CacheNames.TIPIFICACIONES, allEntries = true)
    public CatalogoResponse guardarMatrizCatalogo(MatrizCatalogoRequest request) {
        List<TipificacionCatalogoRequest> matriz = Objects.requireNonNullElse(
                request.getTipificaciones(),
                List.of()
        );
        validarMatriz(matriz);

        List<Tipificacion> existentes = tipificacionRepository.findByEtapaOrderByOrdenAsc(request.getEtapa());
        Map<Long, Tipificacion> existentesPorId = existentes.stream()
                .collect(Collectors.toMap(Tipificacion::getId, Function.identity()));
        List<Subtipificacion> subtipificacionesExistentes = existentes.isEmpty()
                ? List.of()
                : subtipificacionRepository.findByTipificacionInOrderByTipificacion_IdAscOrdenAsc(existentes);
        Map<Long, Subtipificacion> subtipificacionesPorId = subtipificacionesExistentes.stream()
                .collect(Collectors.toMap(Subtipificacion::getId, Function.identity()));

        validarIdsMatriz(matriz, existentesPorId, subtipificacionesPorId, request.getEtapa());

        IdentityHashMap<TipificacionCatalogoRequest, Tipificacion> tipificacionPorRequest = new IdentityHashMap<>();
        Set<Long> tipificacionesSeleccionadas = new HashSet<>();
        for (TipificacionCatalogoRequest item : matriz) {
            Tipificacion target = resolverTipificacionMatriz(
                    item,
                    existentes,
                    existentesPorId,
                    tipificacionesSeleccionadas,
                    request.getEtapa()
            );
            tipificacionPorRequest.put(item, target);
            if (target.getId() != null) {
                tipificacionesSeleccionadas.add(target.getId());
            }
        }

        liberarCodigosTipificacion(matriz, tipificacionPorRequest, existentes);
        tipificacionRepository.flush();

        for (int index = 0; index < matriz.size(); index++) {
            TipificacionCatalogoRequest item = matriz.get(index);
            Tipificacion target = tipificacionPorRequest.get(item);
            target.setEtapa(request.getEtapa());
            target.setCodigo(item.getCodigo().trim());
            target.setDescripcion(item.getDescripcion().trim());
            target.setOrden(index + 1);
            target.setActivo(Boolean.TRUE);
            Tipificacion saved = tipificacionRepository.save(target);
            tipificacionPorRequest.put(item, saved);
            tipificacionesSeleccionadas.add(saved.getId());
        }

        for (Tipificacion existente : existentes) {
            if (!tipificacionesSeleccionadas.contains(existente.getId())) {
                existente.setActivo(Boolean.FALSE);
                tipificacionRepository.save(existente);
            }
        }
        tipificacionRepository.flush();

        IdentityHashMap<SubtipificacionCatalogoRequest, Subtipificacion> subtipificacionPorRequest =
                new IdentityHashMap<>();
        IdentityHashMap<SubtipificacionCatalogoRequest, Tipificacion> padrePorSubtipificacion =
                new IdentityHashMap<>();
        Set<Long> subtipificacionesSeleccionadas = new HashSet<>();

        for (TipificacionCatalogoRequest item : matriz) {
            Tipificacion padre = tipificacionPorRequest.get(item);
            for (SubtipificacionCatalogoRequest subItem : Objects.requireNonNullElse(
                    item.getSubtipificaciones(),
                    List.<SubtipificacionCatalogoRequest>of()
            )) {
                Subtipificacion target = resolverSubtipificacionMatriz(
                        subItem,
                        padre,
                        subtipificacionesExistentes,
                        subtipificacionesPorId,
                        subtipificacionesSeleccionadas
                );
                subtipificacionPorRequest.put(subItem, target);
                padrePorSubtipificacion.put(subItem, padre);
                if (target.getId() != null) {
                    subtipificacionesSeleccionadas.add(target.getId());
                }
            }
        }

        liberarCodigosSubtipificacion(
                matriz,
                subtipificacionPorRequest,
                padrePorSubtipificacion,
                subtipificacionesExistentes
        );
        subtipificacionRepository.flush();

        for (TipificacionCatalogoRequest item : matriz) {
            List<SubtipificacionCatalogoRequest> subItems = Objects.requireNonNullElse(
                    item.getSubtipificaciones(),
                    List.of()
            );
            for (int index = 0; index < subItems.size(); index++) {
                SubtipificacionCatalogoRequest subItem = subItems.get(index);
                Subtipificacion target = subtipificacionPorRequest.get(subItem);
                target.setTipificacion(padrePorSubtipificacion.get(subItem));
                target.setCodigo(subItem.getCodigo().trim());
                target.setDescripcion(subItem.getDescripcion().trim());
                target.setOrden(index + 1);
                target.setEtapaCambio(subItem.getEtapaCambio());
                target.setEstadoPostventaCambio(subItem.getEstadoPostventaCambio());
                target.setActivo(Boolean.TRUE);
                Subtipificacion saved = subtipificacionRepository.save(target);
                subtipificacionesSeleccionadas.add(saved.getId());
            }
        }

        for (Subtipificacion existente : subtipificacionesExistentes) {
            if (!subtipificacionesSeleccionadas.contains(existente.getId())) {
                existente.setActivo(Boolean.FALSE);
                subtipificacionRepository.save(existente);
            }
        }

        return getCatalogoPorEtapa(request.getEtapa());
    }

    private void validarMatriz(List<TipificacionCatalogoRequest> matriz) {
        if (matriz.isEmpty()) {
            throw new BadRequestException("La matriz debe tener al menos una tipificacion", null, null);
        }

        Set<Long> tipificacionIds = new HashSet<>();
        Set<Long> subtipificacionIds = new HashSet<>();
        Set<String> codigosTipificacion = new HashSet<>();
        for (TipificacionCatalogoRequest tipificacion : matriz) {
            if (tipificacion.getId() != null && !tipificacionIds.add(tipificacion.getId())) {
                throw new BadRequestException("La matriz contiene una tipificacion repetida", tipificacion.getId(), null);
            }
            String codigoTipificacion = normalizarCodigo(tipificacion.getCodigo());
            if (!codigosTipificacion.add(codigoTipificacion)) {
                throw new BadRequestException(
                        "El codigo de tipificacion esta repetido",
                        null,
                        Map.of("codigo", tipificacion.getCodigo())
                );
            }

            Set<String> codigosSubtipificacion = new HashSet<>();
            for (SubtipificacionCatalogoRequest subtipificacion : Objects.requireNonNullElse(
                    tipificacion.getSubtipificaciones(),
                    List.<SubtipificacionCatalogoRequest>of()
            )) {
                if (subtipificacion.getId() != null && !subtipificacionIds.add(subtipificacion.getId())) {
                    throw new BadRequestException(
                            "La matriz contiene una subtipificacion repetida",
                            subtipificacion.getId(),
                            null
                    );
                }
                String codigoSubtipificacion = normalizarCodigo(subtipificacion.getCodigo());
                if (!codigosSubtipificacion.add(codigoSubtipificacion)) {
                    throw new BadRequestException(
                            "El codigo de subtipificacion esta repetido dentro de la tipificacion",
                            null,
                            Map.of(
                                    "tipificacion", tipificacion.getCodigo(),
                                    "subtipificacion", subtipificacion.getCodigo()
                            )
                    );
                }
                if (subtipificacion.getEtapaCambio() == Etapa.POSTVENTA
                        && subtipificacion.getEstadoPostventaCambio() == null) {
                    throw new BadRequestException(
                            "La subtipificacion que pasa a POSTVENTA necesita un estado postventa",
                            subtipificacion.getId(),
                            null
                    );
                }
            }
        }
    }

    private void validarIdsMatriz(
            List<TipificacionCatalogoRequest> matriz,
            Map<Long, Tipificacion> tipificacionesPorId,
            Map<Long, Subtipificacion> subtipificacionesPorId,
            Etapa etapa
    ) {
        for (TipificacionCatalogoRequest item : matriz) {
            if (item.getId() != null && !tipificacionesPorId.containsKey(item.getId())) {
                throw new BadRequestException(
                        "La tipificacion no pertenece a la etapa enviada",
                        item.getId(),
                        Map.of("etapa", etapa)
                );
            }
            for (SubtipificacionCatalogoRequest subItem : Objects.requireNonNullElse(
                    item.getSubtipificaciones(),
                    List.<SubtipificacionCatalogoRequest>of()
            )) {
                Subtipificacion existente = subItem.getId() == null
                        ? null
                        : subtipificacionesPorId.get(subItem.getId());
                if (subItem.getId() != null && existente == null) {
                    throw new BadRequestException(
                            "La subtipificacion no pertenece a la etapa enviada",
                            subItem.getId(),
                            Map.of("etapa", etapa)
                    );
                }
            }
        }
    }

    private Tipificacion resolverTipificacionMatriz(
            TipificacionCatalogoRequest item,
            List<Tipificacion> existentes,
            Map<Long, Tipificacion> existentesPorId,
            Set<Long> seleccionadas,
            Etapa etapa
    ) {
        if (item.getId() != null) {
            return existentesPorId.get(item.getId());
        }

        String codigo = normalizarCodigo(item.getCodigo());
        return existentes.stream()
                .filter(tipificacion -> !Boolean.TRUE.equals(tipificacion.getActivo()))
                .filter(tipificacion -> !seleccionadas.contains(tipificacion.getId()))
                .filter(tipificacion -> normalizarCodigo(tipificacion.getCodigo()).equals(codigo))
                .findFirst()
                .orElseGet(() -> {
                    Tipificacion nueva = new Tipificacion();
                    nueva.setEtapa(etapa);
                    return nueva;
                });
    }

    private Subtipificacion resolverSubtipificacionMatriz(
            SubtipificacionCatalogoRequest item,
            Tipificacion padre,
            List<Subtipificacion> existentes,
            Map<Long, Subtipificacion> existentesPorId,
            Set<Long> seleccionadas
    ) {
        if (item.getId() != null) {
            Subtipificacion source = existentesPorId.get(item.getId());
            if (source.getTipificacion().getId().equals(padre.getId())) {
                return source;
            }
        }

        String codigo = normalizarCodigo(item.getCodigo());
        return existentes.stream()
                .filter(subtipificacion -> subtipificacion.getTipificacion().getId().equals(padre.getId()))
                .filter(subtipificacion -> !Boolean.TRUE.equals(subtipificacion.getActivo()))
                .filter(subtipificacion -> !seleccionadas.contains(subtipificacion.getId()))
                .filter(subtipificacion -> normalizarCodigo(subtipificacion.getCodigo()).equals(codigo))
                .findFirst()
                .orElseGet(Subtipificacion::new);
    }

    private void liberarCodigosTipificacion(
            List<TipificacionCatalogoRequest> matriz,
            IdentityHashMap<TipificacionCatalogoRequest, Tipificacion> targets,
            List<Tipificacion> existentes
    ) {
        Map<String, Tipificacion> targetPorCodigo = new LinkedHashMap<>();
        for (TipificacionCatalogoRequest item : matriz) {
            targetPorCodigo.put(normalizarCodigo(item.getCodigo()), targets.get(item));
        }

        for (Tipificacion existente : existentes) {
            Tipificacion target = targetPorCodigo.get(normalizarCodigo(existente.getCodigo()));
            boolean targetCambiaCodigo = targets.containsValue(existente)
                    && !normalizarCodigo(existente.getCodigo()).equals(codigoDeseadoTipificacion(existente, matriz, targets));
            if ((target != null && target != existente) || targetCambiaCodigo) {
                existente.setCodigo(codigoArchivado("TIP", existente.getId()));
                existente.setActivo(Boolean.FALSE);
                tipificacionRepository.save(existente);
            }
        }
    }

    private String codigoDeseadoTipificacion(
            Tipificacion target,
            List<TipificacionCatalogoRequest> matriz,
            IdentityHashMap<TipificacionCatalogoRequest, Tipificacion> targets
    ) {
        return matriz.stream()
                .filter(item -> targets.get(item) == target)
                .map(item -> normalizarCodigo(item.getCodigo()))
                .findFirst()
                .orElse("");
    }

    private void liberarCodigosSubtipificacion(
            List<TipificacionCatalogoRequest> matriz,
            IdentityHashMap<SubtipificacionCatalogoRequest, Subtipificacion> targets,
            IdentityHashMap<SubtipificacionCatalogoRequest, Tipificacion> padres,
            List<Subtipificacion> existentes
    ) {
        for (Subtipificacion existente : existentes) {
            SubtipificacionCatalogoRequest targetRequest = null;
            for (TipificacionCatalogoRequest item : matriz) {
                for (SubtipificacionCatalogoRequest subItem : Objects.requireNonNullElse(
                        item.getSubtipificaciones(),
                        List.<SubtipificacionCatalogoRequest>of()
                )) {
                    Tipificacion padre = padres.get(subItem);
                    if (padre.getId().equals(existente.getTipificacion().getId())
                            && normalizarCodigo(subItem.getCodigo()).equals(normalizarCodigo(existente.getCodigo()))) {
                        targetRequest = subItem;
                        break;
                    }
                }
                if (targetRequest != null) {
                    break;
                }
            }

            SubtipificacionCatalogoRequest ownRequest = targets.entrySet().stream()
                    .filter(entry -> entry.getValue() == existente)
                    .map(Map.Entry::getKey)
                    .findFirst()
                    .orElse(null);
            boolean targetCambiaCodigo = ownRequest != null
                    && !normalizarCodigo(ownRequest.getCodigo()).equals(normalizarCodigo(existente.getCodigo()));
            if ((targetRequest != null && targets.get(targetRequest) != existente) || targetCambiaCodigo) {
                existente.setCodigo(codigoArchivado("SUB", existente.getId()));
                existente.setActivo(Boolean.FALSE);
                subtipificacionRepository.save(existente);
            }
        }
    }

    private String normalizarCodigo(String codigo) {
        return codigo == null ? "" : codigo.trim().toUpperCase(Locale.ROOT);
    }

    private String codigoArchivado(String tipo, Long id) {
        return "__ARCHIVED_" + tipo + "_" + id;
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
