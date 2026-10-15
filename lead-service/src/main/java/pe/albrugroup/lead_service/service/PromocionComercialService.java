package pe.albrugroup.lead_service.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CacheNames;
import pe.albrugroup.lead_service.entity.Plan;
import pe.albrugroup.lead_service.entity.PromocionCashbackPeriodo;
import pe.albrugroup.lead_service.entity.PromocionComercial;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.Zona;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.CashbackPeriodoRequest;
import pe.albrugroup.lead_service.entity.request.PromocionComercialRequest;
import pe.albrugroup.lead_service.entity.response.CashbackPeriodoResponse;
import pe.albrugroup.lead_service.entity.response.PromocionComercialResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.PlanRepository;
import pe.albrugroup.lead_service.repository.PromocionComercialRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.repository.ZonaRepository;
import pe.albrugroup.lead_service.service.mapper.PromocionComercialMapper;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class PromocionComercialService {

    private final PromocionComercialRepository repository;
    private final ProveedorRepository proveedorRepository;
    private final ZonaRepository zonaRepository;
    private final PlanRepository planRepository;
    private final PromocionComercialMapper mapper;
    private final EntityManager entityManager;

    @CacheEvict(value = {CacheNames.PROMOCIONES_COMERCIALES, CacheNames.PLANES_OFERTA}, allEntries = true)
    public PromocionComercialResponse registrarPromocion(PromocionComercialRequest request) {
        Proveedor proveedor = resolverProveedor(request.getIdProveedor());
        Set<Zona> zonas = resolverZonas(request.getIdsZonas());
        Set<Plan> planes = resolverPlanes(request.getIdsPlanes());
        validarConsistenciaProveedor(proveedor, planes, zonas);

        PromocionComercial promocion = mapper.toEntity(request);
        promocion.setProveedor(proveedor);
        promocion.setZonas(zonas);
        promocion.setPlanes(planes);
        promocion.setActivo(Boolean.TRUE);
        aplicarCashbackPeriodos(promocion, request.getCashbackPeriodos());

        return toResponse(repository.save(promocion));
    }

    @CacheEvict(value = {CacheNames.PROMOCIONES_COMERCIALES, CacheNames.PLANES_OFERTA}, allEntries = true)
    public PromocionComercialResponse editarPromocion(Long idPromocion, PromocionComercialRequest request) {
        PromocionComercial promocion = repository.findById(idPromocion)
                .orElseThrow(() -> new NotFoundException(PromocionComercial.class, idPromocion));

        Proveedor proveedor = resolverProveedor(request.getIdProveedor());
        Set<Zona> zonas = resolverZonas(request.getIdsZonas());
        Set<Plan> planes = resolverPlanes(request.getIdsPlanes());
        validarConsistenciaProveedor(proveedor, planes, zonas);

        promocion.setReglaComercial(request.getReglaComercial());
        promocion.setEtapa(request.getEtapa());
        promocion.setProveedor(proveedor);
        promocion.getZonas().clear();
        promocion.getZonas().addAll(zonas);
        promocion.getPlanes().clear();
        promocion.getPlanes().addAll(planes);
        aplicarCashbackPeriodos(promocion, request.getCashbackPeriodos());

        return toResponse(repository.save(promocion));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.PROMOCIONES_COMERCIALES,
            key = "(#idProveedor == null ? 'all' : #idProveedor) + ':' + (#idZona == null ? 'all' : #idZona) + ':' + (#idPlan == null ? 'all' : #idPlan) + ':' + (#etapa == null ? 'all' : #etapa)")
    public List<PromocionComercialResponse> listarPromociones(Long idProveedor, Long idZona, Long idPlan, Etapa etapa) {
        return repository.listarActivas(idProveedor, idZona, idPlan, etapa).stream()
                .map(this::toResponse)
                .toList();
    }

    @CacheEvict(value = {CacheNames.PROMOCIONES_COMERCIALES, CacheNames.PLANES_OFERTA}, allEntries = true)
    public PromocionComercialResponse desactivarPromocion(Long idPromocion) {
        PromocionComercial promocion = repository.findById(idPromocion)
                .orElseThrow(() -> new NotFoundException(PromocionComercial.class, idPromocion));

        promocion.setActivo(Boolean.FALSE);
        return toResponse(repository.save(promocion));
    }

    private Proveedor resolverProveedor(Long idProveedor) {
        if (idProveedor == null) return null;
        return proveedorRepository.findByIdAndActivoTrue(idProveedor)
                .orElseThrow(() -> new NotFoundException(Proveedor.class, idProveedor));
    }

    private Set<Zona> resolverZonas(List<Long> idsZonas) {
        if (idsZonas == null || idsZonas.isEmpty()) return new HashSet<>();
        Set<Long> idsUnicos = new LinkedHashSet<>(idsZonas);
        Set<Zona> zonas = new HashSet<>(zonaRepository.findAllById(idsUnicos));
        if (zonas.size() != idsUnicos.size()) {
            throw new BadRequestException("Una o mas zonas enviadas no existen", null, Map.of("idsZonas", idsZonas));
        }
        return zonas;
    }

    private Set<Plan> resolverPlanes(List<Long> idsPlanes) {
        if (idsPlanes == null || idsPlanes.isEmpty()) return new HashSet<>();

        Set<Long> idsUnicos = new LinkedHashSet<>(idsPlanes);
        if (idsUnicos.size() != idsPlanes.size()) {
            throw new BadRequestException("No se puede repetir el mismo plan dentro de la promocion", null, Map.of("idsPlanes", idsPlanes));
        }

        Set<Plan> planes = new HashSet<>(planRepository.findAllById(idsUnicos));
        if (planes.size() != idsUnicos.size()) {
            throw new BadRequestException("Uno o mas planes enviados no existen", null, Map.of("idsPlanes", idsPlanes));
        }
        return planes;
    }

    private void validarConsistenciaProveedor(Proveedor proveedor, Set<Plan> planes, Set<Zona> zonas) {
        if (proveedor == null) return;

        for (Plan plan : planes) {
            if (!Boolean.TRUE.equals(plan.getActivo())) {
                throw new BadRequestException("La promocion solo puede asociarse a planes activos", null, Map.of("idPlan", plan.getId()));
            }
            if (plan.getProveedor() != null && !proveedor.getId().equals(plan.getProveedor().getId())) {
                throw new BadRequestException("El plan no pertenece al proveedor de la promocion", null,
                        Map.of("idProveedor", proveedor.getId(), "idPlan", plan.getId()));
            }
        }

        for (Zona zona : zonas) {
            if (zona.getProveedor() != null && !proveedor.getId().equals(zona.getProveedor().getId())) {
                throw new BadRequestException("La zona no pertenece al proveedor de la promocion", null,
                        Map.of("idProveedor", proveedor.getId(), "idZona", zona.getId()));
            }
        }
    }

    private void aplicarCashbackPeriodos(PromocionComercial promocion, List<CashbackPeriodoRequest> periodos) {
        promocion.getCashbackPeriodos().clear();
        if (promocion.getId() != null) {
            entityManager.flush();
        }
        if (periodos == null || periodos.isEmpty()) return;

        Integer maxPeriodo = promocion.getProveedor() != null
                ? promocion.getProveedor().getMesesPermanencia()
                : null;

        Set<Integer> periodosVistos = new HashSet<>();
        for (CashbackPeriodoRequest p : periodos) {
            if (!periodosVistos.add(p.getNumeroPeriodo())) {
                throw new BadRequestException("No se puede repetir el mismo periodo de cashback", null,
                        Map.of("numeroPeriodo", p.getNumeroPeriodo()));
            }
            if (maxPeriodo != null && p.getNumeroPeriodo() > maxPeriodo) {
                throw new BadRequestException(
                        "El periodo de cashback excede los meses de permanencia del proveedor (" + maxPeriodo + ")",
                        null,
                        Map.of("numeroPeriodo", p.getNumeroPeriodo(), "mesesPermanencia", maxPeriodo));
            }
            promocion.getCashbackPeriodos().add(PromocionCashbackPeriodo.builder()
                    .promocionComercial(promocion)
                    .numeroPeriodo(p.getNumeroPeriodo())
                    .monto(p.getMonto())
                    .build());
        }
    }

    private PromocionComercialResponse toResponse(PromocionComercial entity) {
        return PromocionComercialResponse.builder()
                .id(entity.getId())
                .reglaComercial(entity.getReglaComercial())
                .etapa(entity.getEtapa())
                .idProveedor(entity.getProveedor() == null ? null : entity.getProveedor().getId())
                .nombreProveedor(entity.getProveedor() == null ? null : entity.getProveedor().getNombre())
                .idsZonas(entity.getZonas().stream().map(Zona::getId).sorted().toList())
                .nombresZonas(entity.getZonas().stream().map(Zona::getNombre).sorted(String.CASE_INSENSITIVE_ORDER).toList())
                .idsPlanes(entity.getPlanes().stream().map(Plan::getId).sorted().toList())
                .nombresPlanes(entity.getPlanes().stream().map(Plan::getNombre).sorted(String.CASE_INSENSITIVE_ORDER).toList())
                .cashbackPeriodos(entity.getCashbackPeriodos().stream()
                        .map(cp -> CashbackPeriodoResponse.builder()
                                .numeroPeriodo(cp.getNumeroPeriodo())
                                .monto(cp.getMonto())
                                .build())
                        .sorted(Comparator.comparing(CashbackPeriodoResponse::getNumeroPeriodo))
                        .toList())
                .activo(entity.getActivo())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
