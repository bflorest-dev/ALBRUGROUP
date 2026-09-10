package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.configuration.CacheNames;
import pe.albrugroup.lead_service.entity.FlujoMatrizTipificacion;
import pe.albrugroup.lead_service.entity.MatrizTipificacion;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.CatalogoEstadoRequest;
import pe.albrugroup.lead_service.entity.request.CatalogoRequest;
import pe.albrugroup.lead_service.entity.request.FlujoMatrizTipificacionRequest;
import pe.albrugroup.lead_service.entity.request.MatrizCatalogoRequest;
import pe.albrugroup.lead_service.entity.request.SubtipificacionCatalogoRequest;
import pe.albrugroup.lead_service.entity.request.TipificacionCatalogoRequest;
import pe.albrugroup.lead_service.entity.response.CatalogoResponse;
import pe.albrugroup.lead_service.entity.response.FlujoMatrizTipificacionResponse;
import pe.albrugroup.lead_service.entity.response.SubtipificacionResponse;
import pe.albrugroup.lead_service.entity.response.TipificacionResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.FlujoMatrizTipificacionRepository;
import pe.albrugroup.lead_service.repository.MatrizTipificacionRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
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
    private final MatrizTipificacionRepository matrizTipificacionRepository;
    private final FlujoMatrizTipificacionRepository flujoMatrizTipificacionRepository;
    private final ProveedorRepository proveedorRepository;
    private final TipificacionMapper mapper;

    @Cacheable(value = CacheNames.TIPIFICACIONES, key = "#etapa + '_' + #idProveedor")
    public CatalogoResponse getCatalogo(Etapa etapa, Long idProveedor) {
        return getCatalogo(etapa, idProveedor, true);
    }

    @Cacheable(value = CacheNames.TIPIFICACIONES, key = "#etapa + '_' + #idProveedor + '_flujos_' + #includeFlujos")
    public CatalogoResponse getCatalogo(Etapa etapa, Long idProveedor, boolean includeFlujos) {
        MatrizTipificacion matriz = matrizTipificacionRepository.findByEtapaAndProveedorIdAndActivoTrue(etapa, idProveedor)
                .orElse(null);
        if (matriz == null) {
            return new CatalogoResponse(etapa, List.of());
        }
        List<Tipificacion> tipificaciones =
                tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdAndActivoTrueOrderByOrdenAsc(etapa, idProveedor);
        List<FlujoMatrizTipificacionResponse> flujos = includeFlujos ? construirFlujos(matriz.getId()) : List.of();
        return construirCatalogo(etapa, tipificaciones, flujos);
    }

    @Cacheable(value = CacheNames.TIPIFICACIONES, key = "'operativo_' + #etapa + '_' + #idProveedor + '_' + (#idTipificacionOrigen == null ? 'INICIAL' : #idTipificacionOrigen)")
    public CatalogoResponse getCatalogoOperativo(Etapa etapa, Long idProveedor, Long idTipificacionOrigen) {
        MatrizTipificacion matriz = matrizTipificacionRepository.findByEtapaAndProveedorIdAndActivoTrue(etapa, idProveedor)
                .orElse(null);
        if (matriz == null) {
            return new CatalogoResponse(etapa, List.of());
        }
        Set<Long> destinosPermitidos = idsDestinoPermitidos(matriz.getId(), idTipificacionOrigen);
        List<Tipificacion> tipificaciones =
                tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdAndSeleccionableManualTrueAndActivoTrueOrderByOrdenAsc(
                        etapa, idProveedor)
                        .stream()
                        .filter(tipificacion -> destinosPermitidos.contains(tipificacion.getId()))
                        .toList();
        return construirCatalogo(etapa, tipificaciones, List.of());
    }

    public void validarTipificacionPermitida(Etapa etapa, Long idProveedor, Long idTipificacionOrigen, Tipificacion destino) {
        MatrizTipificacion matriz = matrizTipificacionRepository.findByEtapaAndProveedorIdAndActivoTrue(etapa, idProveedor)
                .orElseThrow(() -> new NotFoundException(MatrizTipificacion.class, idProveedor));
        MatrizTipificacion matrizDestino = destino.getMatriz();
        if (matrizDestino == null
                || !Objects.equals(matrizDestino.getId(), matriz.getId())
                || !Boolean.TRUE.equals(destino.getActivo())
                || !Boolean.TRUE.equals(destino.getSeleccionableManual())) {
            throw new BadRequestException(
                    "La tipificacion no pertenece al flujo operativo permitido",
                    destino.getId(),
                    Map.of("etapa", etapa, "idProveedor", idProveedor)
            );
        }
        if (!idsDestinoPermitidos(matriz.getId(), idTipificacionOrigen).contains(destino.getId())) {
            throw new BadRequestException(
                    "La tipificacion no esta permitida desde el estado actual del lead",
                    destino.getId(),
                    Map.of("idTipificacionOrigen", idTipificacionOrigen)
            );
        }
    }

    private CatalogoResponse construirCatalogo(
            Etapa etapa,
            List<Tipificacion> tipificaciones,
            List<FlujoMatrizTipificacionResponse> flujos
    ) {
        // Fail-closed: si el proveedor aún no tiene matriz en esta etapa, el catálogo viene vacío.
        if (tipificaciones.isEmpty()) {
            return new CatalogoResponse(etapa, List.of(), flujos);
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

        return new CatalogoResponse(etapa, tipificacionesResponse, flujos);
    }

    // Catálogo AGREGADO cross-proveedor: unión de las matrices activas de la etapa, deduplicada por código
    // (representante = primera tipificación activa encontrada), con sus subtipificaciones activas. Solo
    // para vistas de supervisor (paletas de color y dropdowns de filtro que cruzan equipos); NO resuelve
    // la matriz de un lead (eso es siempre getCatalogo(etapa, idProveedor)).
    @Cacheable(value = CacheNames.TIPIFICACIONES, key = "'agregado_' + #etapa")
    public CatalogoResponse getCatalogoAgregado(Etapa etapa) {
        Map<String, Tipificacion> representantePorCodigo = new LinkedHashMap<>();
        for (Tipificacion tipificacion : tipificacionRepository.findByMatrizEtapaAndActivoTrueOrderByOrdenAsc(etapa)) {
            representantePorCodigo.putIfAbsent(tipificacion.getCodigo(), tipificacion);
        }
        List<Tipificacion> representantes = new ArrayList<>(representantePorCodigo.values());
        if (representantes.isEmpty()) {
            return new CatalogoResponse(etapa, List.of());
        }

        List<Subtipificacion> subtipificaciones = subtipificacionRepository
                .findByTipificacionInAndActivoTrueOrderByTipificacion_IdAscOrdenAsc(representantes);
        Map<Long, List<SubtipificacionResponse>> subtipificacionesPorTipificacionId = new HashMap<>();
        for (Subtipificacion subtipificacion : subtipificaciones) {
            subtipificacionesPorTipificacionId
                    .computeIfAbsent(subtipificacion.getTipificacion().getId(), key -> new ArrayList<>())
                    .add(mapper.toResponse(subtipificacion));
        }

        List<TipificacionResponse> tipificacionesResponse = representantes.stream()
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
            MatrizTipificacion matriz = resolverMatriz(request.getEtapa(), request.getIdProveedor());
            Tipificacion tipificacion = upsertTipificacion(matriz, tipificacionRequest);
            List<SubtipificacionCatalogoRequest> subtipificacionesRequest = Objects.requireNonNullElse(
                    tipificacionRequest.getSubtipificaciones(),
                    List.of()
            );
            for (SubtipificacionCatalogoRequest subtipificacionRequest : subtipificacionesRequest) {
                upsertSubtipificacion(tipificacion, subtipificacionRequest);
            }
        }

        return getCatalogo(request.getEtapa(), request.getIdProveedor());
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
                request.getEtapa(),
                request.getIdProveedor()
        );

        Map<Long, Subtipificacion> subtipificacionesPorId = buscarSubtipificacionesPorId(
                unirIds(subtipificacionesActivar, subtipificacionesDesactivar),
                request.getEtapa(),
                request.getIdProveedor()
        );

        desactivarTipificaciones(tipificacionesDesactivar, tipificacionesPorId);
        desactivarSubtipificacionesPorTipificacion(tipificacionesDesactivar);
        desactivarSubtipificaciones(subtipificacionesDesactivar, subtipificacionesPorId);

        activarTipificaciones(tipificacionesActivar, tipificacionesPorId);
        activarSubtipificaciones(subtipificacionesActivar, subtipificacionesPorId);

        return getCatalogo(request.getEtapa(), request.getIdProveedor());
    }

    @Transactional
    @CacheEvict(value = CacheNames.TIPIFICACIONES, allEntries = true)
    public CatalogoResponse guardarMatrizCatalogo(MatrizCatalogoRequest request) {
        List<TipificacionCatalogoRequest> matriz = Objects.requireNonNullElse(
                request.getTipificaciones(),
                List.of()
        );
        validarMatriz(matriz);

        MatrizTipificacion matrizCabecera = resolverMatriz(request.getEtapa(), request.getIdProveedor());
        // Acotado por (etapa, proveedor): el archivado de lo que "sobra" solo debe tocar esta matriz.
        List<Tipificacion> existentes =
                tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdOrderByOrdenAsc(request.getEtapa(), request.getIdProveedor());
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
            target.setMatriz(matrizCabecera);
            target.setCodigo(item.getCodigo().trim());
            target.setDescripcion(item.getDescripcion().trim());
            target.setOrden(index + 1);
            target.setSeleccionableManual(!Boolean.FALSE.equals(item.getSeleccionableManual()));
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
                target.setComportamientos(new HashSet<>(
                        Objects.requireNonNullElse(subItem.getComportamientos(), Set.<ComportamientoTipificacion>of())));
                aplicarConversionSubtipificacion(target, subItem, request.getEtapa(), request.getIdProveedor());
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

        List<Tipificacion> tipificacionesPersistidas = tipificacionPorRequest.values().stream()
                .distinct()
                .toList();
        guardarFlujosMatriz(matrizCabecera, request.getFlujos(), tipificacionesPersistidas);

        return getCatalogo(request.getEtapa(), request.getIdProveedor());
    }

    /**
     * Clona la matriz activa de {@code idProveedorOrigen} en {@code idProveedorDestino} para una etapa,
     * reescribiéndola con {@link #guardarMatrizCatalogo} (ids nulos = inserta copias). Sirve para dar de
     * alta la matriz de un proveedor nuevo o dejar la de un proveedor igual a otro.
     */
    @Transactional
    @CacheEvict(value = CacheNames.TIPIFICACIONES, allEntries = true)
    public CatalogoResponse clonarMatriz(Etapa etapa, Long idProveedorOrigen, Long idProveedorDestino) {
        if (Objects.equals(idProveedorOrigen, idProveedorDestino)) {
            throw new BadRequestException("El proveedor origen y destino no pueden ser el mismo", idProveedorOrigen, null);
        }

        CatalogoResponse origen = getCatalogo(etapa, idProveedorOrigen);
        if (origen.getTipificaciones().isEmpty()) {
            throw new BadRequestException(
                    "El proveedor origen no tiene matriz activa en esta etapa para clonar",
                    idProveedorOrigen,
                    Map.of("etapa", etapa)
            );
        }

        List<TipificacionCatalogoRequest> copia = origen.getTipificaciones().stream()
                .map(tipificacion -> TipificacionCatalogoRequest.builder()
                        .codigo(tipificacion.getCodigo())
                        .descripcion(tipificacion.getDescripcion())
                        .orden(tipificacion.getOrden())
                        .seleccionableManual(tipificacion.getSeleccionableManual())
                        .subtipificaciones(tipificacion.getSubtipificaciones().stream()
                                .map(sub -> SubtipificacionCatalogoRequest.builder()
                                        .codigo(sub.getCodigo())
                                        .descripcion(sub.getDescripcion())
                                        .orden(sub.getOrden())
                                        .etapaCambio(sub.getEtapaCambio())
                                        .tipificacionConversionId(null)
                                        .subtipificacionConversionId(null)
                                        .comportamientos(sub.getComportamientos())
                                        .build())
                                .toList())
                        .build())
                .toList();

        MatrizCatalogoRequest request = MatrizCatalogoRequest.builder()
                .etapa(etapa)
                .idProveedor(idProveedorDestino)
                .tipificaciones(copia)
                .build();
        CatalogoResponse destino = guardarMatrizCatalogo(request);
        copiarFlujosClonados(etapa, idProveedorOrigen, idProveedorDestino, origen, destino);
        return getCatalogo(etapa, idProveedorDestino);
    }

    private List<FlujoMatrizTipificacionResponse> construirFlujos(Long matrizId) {
        return flujoMatrizTipificacionRepository.findByMatrizIdAndActivoTrue(matrizId).stream()
                .map(this::toFlujoResponse)
                .toList();
    }

    private FlujoMatrizTipificacionResponse toFlujoResponse(FlujoMatrizTipificacion flujo) {
        return FlujoMatrizTipificacionResponse.builder()
                .id(flujo.getId())
                .tipificacionOrigenId(flujo.getTipificacionOrigen() == null ? null : flujo.getTipificacionOrigen().getId())
                .tipificacionDestinoId(flujo.getTipificacionDestino().getId())
                .activo(flujo.getActivo())
                .build();
    }

    private Set<Long> idsDestinoPermitidos(Long matrizId, Long idTipificacionOrigen) {
        List<FlujoMatrizTipificacion> flujos = idTipificacionOrigen == null
                ? flujoMatrizTipificacionRepository.findByMatrizIdAndTipificacionOrigenIsNullAndActivoTrue(matrizId)
                : flujoMatrizTipificacionRepository.findByMatrizIdAndTipificacionOrigenIdAndActivoTrue(matrizId, idTipificacionOrigen);
        return flujos.stream()
                .map(flujo -> flujo.getTipificacionDestino().getId())
                .collect(Collectors.toSet());
    }

    private void guardarFlujosMatriz(
            MatrizTipificacion matriz,
            List<FlujoMatrizTipificacionRequest> flujosRequest,
            List<Tipificacion> tipificaciones
    ) {
        Map<Long, Tipificacion> tipificacionesPorId = tipificaciones.stream()
                .filter(tipificacion -> tipificacion.getId() != null)
                .collect(Collectors.toMap(Tipificacion::getId, Function.identity()));
        List<FlujoMatrizTipificacionRequest> flujosNormalizados =
                normalizarFlujosParaGuardar(flujosRequest, tipificaciones);
        validarFlujosMatriz(flujosNormalizados, tipificacionesPorId);

        List<FlujoMatrizTipificacion> existentes =
                flujoMatrizTipificacionRepository.findByMatrizIdAndActivoTrue(matriz.getId());
        Map<String, FlujoMatrizTipificacion> existentesPorClave = existentes.stream()
                .collect(Collectors.toMap(this::claveFlujo, Function.identity(), (left, right) -> left));
        Set<String> clavesSolicitadas = new HashSet<>();
        for (FlujoMatrizTipificacionRequest flujoRequest : flujosNormalizados) {
            if (Boolean.FALSE.equals(flujoRequest.getActivo())) {
                continue;
            }
            String clave = claveFlujo(flujoRequest.getTipificacionOrigenId(), flujoRequest.getTipificacionDestinoId());
            clavesSolicitadas.add(clave);
            FlujoMatrizTipificacion flujo = existentesPorClave.getOrDefault(clave, new FlujoMatrizTipificacion());
            flujo.setMatriz(matriz);
            flujo.setTipificacionOrigen(flujoRequest.getTipificacionOrigenId() == null
                    ? null
                    : tipificacionesPorId.get(flujoRequest.getTipificacionOrigenId()));
            flujo.setTipificacionDestino(tipificacionesPorId.get(flujoRequest.getTipificacionDestinoId()));
            flujo.setActivo(Boolean.TRUE);
            flujoMatrizTipificacionRepository.save(flujo);
        }
        for (FlujoMatrizTipificacion existente : existentes) {
            if (!clavesSolicitadas.contains(claveFlujo(existente))) {
                existente.setActivo(Boolean.FALSE);
                flujoMatrizTipificacionRepository.save(existente);
            }
        }
    }

    private List<FlujoMatrizTipificacionRequest> normalizarFlujosParaGuardar(
            List<FlujoMatrizTipificacionRequest> flujosRequest,
            List<Tipificacion> tipificaciones
    ) {
        if (flujosRequest != null && !flujosRequest.isEmpty()) {
            return flujosRequest;
        }
        List<Tipificacion> destinosSeleccionables = tipificaciones.stream()
                .filter(tipificacion -> Boolean.TRUE.equals(tipificacion.getActivo()))
                .filter(tipificacion -> Boolean.TRUE.equals(tipificacion.getSeleccionableManual()))
                .toList();
        List<Tipificacion> origenes = tipificaciones.stream()
                .filter(tipificacion -> Boolean.TRUE.equals(tipificacion.getActivo()))
                .toList();
        List<FlujoMatrizTipificacionRequest> abiertos = new ArrayList<>();
        for (Tipificacion destino : destinosSeleccionables) {
            abiertos.add(FlujoMatrizTipificacionRequest.builder()
                    .tipificacionOrigenId(null)
                    .tipificacionDestinoId(destino.getId())
                    .activo(Boolean.TRUE)
                    .build());
        }
        for (Tipificacion origen : origenes) {
            for (Tipificacion destino : destinosSeleccionables) {
                abiertos.add(FlujoMatrizTipificacionRequest.builder()
                        .tipificacionOrigenId(origen.getId())
                        .tipificacionDestinoId(destino.getId())
                        .activo(Boolean.TRUE)
                        .build());
            }
        }
        return abiertos;
    }

    private void validarFlujosMatriz(
            List<FlujoMatrizTipificacionRequest> flujos,
            Map<Long, Tipificacion> tipificacionesPorId
    ) {
        boolean haySeleccionables = tipificacionesPorId.values().stream()
                .anyMatch(tipificacion -> Boolean.TRUE.equals(tipificacion.getSeleccionableManual())
                        && Boolean.TRUE.equals(tipificacion.getActivo()));
        Set<String> claves = new HashSet<>();
        boolean tieneInicial = false;
        for (FlujoMatrizTipificacionRequest flujo : Objects.requireNonNullElse(flujos, List.<FlujoMatrizTipificacionRequest>of())) {
            if (Boolean.FALSE.equals(flujo.getActivo())) {
                continue;
            }
            Tipificacion destino = tipificacionesPorId.get(flujo.getTipificacionDestinoId());
            if (destino == null || !Boolean.TRUE.equals(destino.getActivo())) {
                throw new BadRequestException("El flujo apunta a una tipificacion destino fuera de la matriz", flujo.getTipificacionDestinoId(), null);
            }
            if (!Boolean.TRUE.equals(destino.getSeleccionableManual())) {
                throw new BadRequestException("El flujo no puede apuntar a una tipificacion no seleccionable", destino.getId(), null);
            }
            if (flujo.getTipificacionOrigenId() != null) {
                Tipificacion origen = tipificacionesPorId.get(flujo.getTipificacionOrigenId());
                if (origen == null || !Boolean.TRUE.equals(origen.getActivo())) {
                    throw new BadRequestException("El flujo apunta a una tipificacion origen fuera de la matriz", flujo.getTipificacionOrigenId(), null);
                }
            } else {
                tieneInicial = true;
            }
            if (!claves.add(claveFlujo(flujo.getTipificacionOrigenId(), flujo.getTipificacionDestinoId()))) {
                throw new BadRequestException("La matriz contiene flujos duplicados", flujo.getTipificacionDestinoId(), null);
            }
        }
        if (haySeleccionables && !tieneInicial) {
            throw new BadRequestException("La matriz necesita al menos una tipificacion inicial", null, null);
        }
    }

    private void copiarFlujosClonados(
            Etapa etapa,
            Long idProveedorOrigen,
            Long idProveedorDestino,
            CatalogoResponse origen,
            CatalogoResponse destino
    ) {
        MatrizTipificacion matrizDestino = matrizTipificacionRepository.findByEtapaAndProveedorIdAndActivoTrue(etapa, idProveedorDestino)
                .orElseThrow(() -> new NotFoundException(MatrizTipificacion.class, idProveedorDestino));
        Map<Long, Long> idsDestinoPorOrigen = mapearIdsClonados(origen, destino);
        List<FlujoMatrizTipificacionRequest> flujos = Objects.requireNonNullElse(origen.getFlujos(), List.<FlujoMatrizTipificacionResponse>of())
                .stream()
                .map(flujo -> remapearFlujoClonado(flujo, idsDestinoPorOrigen))
                .filter(Objects::nonNull)
                .filter(flujo -> flujo.getTipificacionDestinoId() != null)
                .toList();
        List<Tipificacion> tipificacionesDestino =
                tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdAndActivoTrueOrderByOrdenAsc(etapa, idProveedorDestino);
        guardarFlujosMatriz(matrizDestino, flujos, tipificacionesDestino);
    }

    private FlujoMatrizTipificacionRequest remapearFlujoClonado(
            FlujoMatrizTipificacionResponse flujo,
            Map<Long, Long> idsDestinoPorOrigen
    ) {
        Long destinoId = idsDestinoPorOrigen.get(flujo.getTipificacionDestinoId());
        if (destinoId == null) {
            return null;
        }
        Long origenId = null;
        if (flujo.getTipificacionOrigenId() != null) {
            origenId = idsDestinoPorOrigen.get(flujo.getTipificacionOrigenId());
            if (origenId == null) {
                return null;
            }
        }
        return FlujoMatrizTipificacionRequest.builder()
                .tipificacionOrigenId(origenId)
                .tipificacionDestinoId(destinoId)
                .activo(flujo.getActivo())
                .build();
    }

    private Map<Long, Long> mapearIdsClonados(CatalogoResponse origen, CatalogoResponse destino) {
        Map<String, Long> destinoPorCodigo = destino.getTipificaciones().stream()
                .collect(Collectors.toMap(tipificacion -> normalizarCodigo(tipificacion.getCodigo()), TipificacionResponse::getId));
        Map<Long, Long> idsDestinoPorOrigen = new HashMap<>();
        for (TipificacionResponse tipificacionOrigen : origen.getTipificaciones()) {
            Long idDestino = destinoPorCodigo.get(normalizarCodigo(tipificacionOrigen.getCodigo()));
            if (idDestino != null) {
                idsDestinoPorOrigen.put(tipificacionOrigen.getId(), idDestino);
            }
        }
        return idsDestinoPorOrigen;
    }

    private String claveFlujo(FlujoMatrizTipificacion flujo) {
        return claveFlujo(
                flujo.getTipificacionOrigen() == null ? null : flujo.getTipificacionOrigen().getId(),
                flujo.getTipificacionDestino().getId()
        );
    }

    private String claveFlujo(Long idOrigen, Long idDestino) {
        return (idOrigen == null ? "INICIAL" : idOrigen.toString()) + "->" + idDestino;
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
                validarComportamientosMerito(subtipificacion);
                validarConversionCompleta(subtipificacion);
            }
        }
    }

    private void validarConversionCompleta(SubtipificacionCatalogoRequest subtipificacion) {
        boolean tieneTipificacion = subtipificacion.getTipificacionConversionId() != null;
        boolean tieneSubtipificacion = subtipificacion.getSubtipificacionConversionId() != null;
        if (tieneTipificacion != tieneSubtipificacion) {
            throw new BadRequestException(
                    "La conversion debe indicar tipificacion y subtipificacion destino",
                    subtipificacion.getId(),
                    Map.of("subtipificacion", subtipificacion.getCodigo())
            );
        }
    }

    private void validarComportamientosMerito(SubtipificacionCatalogoRequest subtipificacion) {
        Set<ComportamientoTipificacion> comportamientos = Objects.requireNonNullElse(
                subtipificacion.getComportamientos(),
                Set.of());
        if (comportamientos.contains(ComportamientoTipificacion.ASIGNA_ASESOR_MERITO)
                && comportamientos.contains(ComportamientoTipificacion.ANULA_ASESOR_MERITO)) {
            throw new BadRequestException(
                    "La subtipificacion no puede asignar y anular el asesor de merito a la vez",
                    null,
                    Map.of("subtipificacion", subtipificacion.getCodigo())
            );
        }
        if (comportamientos.contains(ComportamientoTipificacion.ASIGNA_FECHA_MERITO)
                && comportamientos.contains(ComportamientoTipificacion.ANULA_FECHA_MERITO)) {
            throw new BadRequestException(
                    "La subtipificacion no puede asignar y anular la fecha de merito a la vez",
                    null,
                    Map.of("subtipificacion", subtipificacion.getCodigo())
            );
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
                    nueva.setMatriz(resolverMatrizExistente(etapa, null));
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

    private Tipificacion upsertTipificacion(MatrizTipificacion matriz, TipificacionCatalogoRequest request) {
        if (request.getId() == null) {
            Tipificacion tipificacion = mapper.toEntity(request);
            tipificacion.setMatriz(matriz);
            tipificacion.setSeleccionableManual(!Boolean.FALSE.equals(request.getSeleccionableManual()));
            tipificacion.setActivo(Boolean.TRUE);
            return tipificacionRepository.save(tipificacion);
        }

        Tipificacion tipificacion = tipificacionRepository.findById(request.getId())
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, request.getId()));

        MatrizTipificacion matrizActual = tipificacion.getMatriz();
        Long proveedorActual = matrizActual == null || matrizActual.getProveedor() == null
                ? null
                : matrizActual.getProveedor().getId();
        Long proveedorDestino = matriz.getProveedor() == null ? null : matriz.getProveedor().getId();
        if (matrizActual == null
                || matrizActual.getEtapa() != matriz.getEtapa()
                || !Objects.equals(proveedorActual, proveedorDestino)) {
            throw new BadRequestException(
                    "La tipificacion no pertenece a la matriz (etapa, proveedor) enviada",
                    request.getId(),
                    Map.of("etapa", matriz.getEtapa(), "idProveedor", proveedorDestino)
            );
        }

        mapper.updateDatosTipificacion(request, tipificacion);
        tipificacion.setMatriz(matriz);
        tipificacion.setSeleccionableManual(!Boolean.FALSE.equals(request.getSeleccionableManual()));
        tipificacion.setActivo(Boolean.TRUE);
        return tipificacionRepository.save(tipificacion);
    }

    private void upsertSubtipificacion(Tipificacion tipificacion, SubtipificacionCatalogoRequest request) {
        if (request.getId() == null) {
            Subtipificacion subtipificacion = mapper.toEntity(request);
            subtipificacion.setTipificacion(tipificacion);
            aplicarConversionSubtipificacion(
                    subtipificacion,
                    request,
                    tipificacion.getMatriz().getEtapa(),
                    tipificacion.getMatriz().getProveedor().getId()
            );
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
        aplicarConversionSubtipificacion(
                subtipificacion,
                request,
                tipificacion.getMatriz().getEtapa(),
                tipificacion.getMatriz().getProveedor().getId()
        );
        subtipificacion.setActivo(Boolean.TRUE);
        subtipificacionRepository.save(subtipificacion);
    }

    private void aplicarConversionSubtipificacion(
            Subtipificacion target,
            SubtipificacionCatalogoRequest request,
            Etapa etapaOrigen,
            Long idProveedor
    ) {
        if (request.getTipificacionConversionId() == null && request.getSubtipificacionConversionId() == null) {
            target.setTipificacionConversion(null);
            target.setSubtipificacionConversion(null);
            return;
        }

        Etapa etapaDestino = request.getEtapaCambio() == null ? etapaOrigen : request.getEtapaCambio();
        Tipificacion tipificacionDestino = tipificacionRepository.findById(request.getTipificacionConversionId())
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, request.getTipificacionConversionId()));
        Subtipificacion subtipificacionDestino = subtipificacionRepository.findById(request.getSubtipificacionConversionId())
                .orElseThrow(() -> new NotFoundException(Subtipificacion.class, request.getSubtipificacionConversionId()));

        validarDestinoConversion(tipificacionDestino, subtipificacionDestino, etapaDestino, idProveedor, request);
        target.setTipificacionConversion(tipificacionDestino);
        target.setSubtipificacionConversion(subtipificacionDestino);
    }

    private void validarDestinoConversion(
            Tipificacion tipificacionDestino,
            Subtipificacion subtipificacionDestino,
            Etapa etapaDestino,
            Long idProveedor,
            SubtipificacionCatalogoRequest request
    ) {
        if (!Objects.equals(subtipificacionDestino.getTipificacion().getId(), tipificacionDestino.getId())) {
            throw new BadRequestException(
                    "La subtipificacion de conversion no pertenece a la tipificacion destino",
                    request.getSubtipificacionConversionId(),
                    Map.of("idTipificacionConversion", request.getTipificacionConversionId())
            );
        }
        MatrizTipificacion matrizDestino = tipificacionDestino.getMatriz();
        Long proveedorDestino = matrizDestino == null || matrizDestino.getProveedor() == null
                ? null
                : matrizDestino.getProveedor().getId();
        if (matrizDestino == null
                || matrizDestino.getEtapa() != etapaDestino
                || !Objects.equals(proveedorDestino, idProveedor)) {
            throw new BadRequestException(
                    "La conversion debe apuntar a la matriz del mismo proveedor y etapa destino",
                    request.getId(),
                    Map.of("etapaDestino", etapaDestino, "idProveedor", idProveedor)
            );
        }
        if (!Boolean.TRUE.equals(tipificacionDestino.getActivo())
                || !Boolean.TRUE.equals(subtipificacionDestino.getActivo())) {
            throw new BadRequestException(
                    "La conversion debe apuntar a una tipificacion y subtipificacion activas",
                    request.getId(),
                    null
            );
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

    private Map<Long, Tipificacion> buscarTipificacionesPorId(Collection<Long> ids, Etapa etapa, Long idProveedor) {
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
            MatrizTipificacion matriz = tipificacion.getMatriz();
            Long proveedorMatriz = matriz == null || matriz.getProveedor() == null ? null : matriz.getProveedor().getId();
            if (matriz == null || matriz.getEtapa() != etapa || !Objects.equals(proveedorMatriz, idProveedor)) {
                throw new BadRequestException(
                        "La tipificacion no pertenece a la matriz (etapa, proveedor) enviada",
                        null,
                        Map.of("idTipificacion", id, "etapa", etapa, "idProveedor", idProveedor)
                );
            }
        }

        return resultado;
    }

    private Map<Long, Subtipificacion> buscarSubtipificacionesPorId(Collection<Long> ids, Etapa etapa, Long idProveedor) {
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
            Tipificacion padre = subtipificacion.getTipificacion();
            MatrizTipificacion matriz = padre.getMatriz();
            Long proveedorMatriz = matriz == null || matriz.getProveedor() == null ? null : matriz.getProveedor().getId();
            if (matriz == null || matriz.getEtapa() != etapa || !Objects.equals(proveedorMatriz, idProveedor)) {
                throw new BadRequestException(
                        "La subtipificacion no pertenece a la matriz (etapa, proveedor) enviada",
                        null,
                        Map.of("idSubtipificacion", id, "etapa", etapa, "idProveedor", idProveedor)
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

    private MatrizTipificacion resolverMatriz(Etapa etapa, Long idProveedor) {
        if (idProveedor == null) {
            throw new BadRequestException("El proveedor de la matriz es obligatorio", null, Map.of("etapa", etapa));
        }
        return matrizTipificacionRepository.findByEtapaAndProveedorId(etapa, idProveedor)
                .orElseGet(() -> {
                    Proveedor proveedor = proveedorRepository.findByIdAndActivoTrue(idProveedor)
                            .orElseThrow(() -> new NotFoundException(Proveedor.class, idProveedor));
                    MatrizTipificacion matriz = new MatrizTipificacion();
                    matriz.setEtapa(etapa);
                    matriz.setProveedor(proveedor);
                    matriz.setActivo(Boolean.TRUE);
                    return matrizTipificacionRepository.save(matriz);
                });
    }

    private MatrizTipificacion resolverMatrizExistente(Etapa etapa, Long idProveedor) {
        if (idProveedor == null) {
            return null;
        }
        return matrizTipificacionRepository.findByEtapaAndProveedorId(etapa, idProveedor).orElse(null);
    }
}
