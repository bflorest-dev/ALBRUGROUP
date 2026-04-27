package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CacheNames;
import pe.albrugroup.lead_service.entity.Plan;
import pe.albrugroup.lead_service.entity.PromocionComercial;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.Zona;
import pe.albrugroup.lead_service.entity.request.PromocionComercialRequest;
import pe.albrugroup.lead_service.entity.response.PromocionComercialResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.PlanRepository;
import pe.albrugroup.lead_service.repository.PromocionComercialRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.repository.ZonaRepository;
import pe.albrugroup.lead_service.service.mapper.PromocionComercialMapper;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class PromocionComercialService {

    private final PromocionComercialRepository repository;
    private final ProveedorRepository proveedorRepository;
    private final ZonaRepository zonaRepository;
    private final PlanRepository planRepository;
    private final PromocionComercialMapper mapper;

    @CacheEvict(value = CacheNames.PROMOCIONES_COMERCIALES, allEntries = true)
    public PromocionComercialResponse registrarPromocion(PromocionComercialRequest request) {
        Proveedor proveedor = null;
        if (request.getIdProveedor() != null) {
            proveedor = proveedorRepository.findByIdAndActivoTrue(request.getIdProveedor())
                    .orElseThrow(() -> new NotFoundException(Proveedor.class, request.getIdProveedor()));
        }

        Zona zona = null;
        if (request.getIdZona() != null) {
            zona = zonaRepository.findById(request.getIdZona())
                    .orElseThrow(() -> new NotFoundException(Zona.class, request.getIdZona()));
        }

        Set<Plan> planes = resolverPlanes(request.getIdsPlanes());
        validarConsistencia(request, proveedor, planes);

        PromocionComercial promocion = mapper.toEntity(request);
        promocion.setProveedor(proveedor);
        promocion.setZona(zona);
        promocion.setPlanes(planes);
        promocion.setActivo(Boolean.TRUE);

        return toResponse(repository.save(promocion));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.PROMOCIONES_COMERCIALES, key = "(#idProveedor == null ? 'all' : #idProveedor) + ':' + (#idZona == null ? 'all' : #idZona) + ':' + (#idPlan == null ? 'all' : #idPlan)")
    public List<PromocionComercialResponse> listarPromociones(Long idProveedor, Long idZona, Long idPlan) {
        return repository.listarActivas(idProveedor, idZona, idPlan).stream()
                .map(this::toResponse)
                .toList();
    }

    @CacheEvict(value = CacheNames.PROMOCIONES_COMERCIALES, allEntries = true)
    public PromocionComercialResponse desactivarPromocion(Long idPromocion) {
        PromocionComercial promocion = repository.findById(idPromocion)
                .orElseThrow(() -> new NotFoundException(PromocionComercial.class, idPromocion));

        promocion.setActivo(Boolean.FALSE);
        return toResponse(repository.save(promocion));
    }

    private Set<Plan> resolverPlanes(List<Long> idsPlanes) {
        Set<Long> idsUnicos = new HashSet<>(idsPlanes);
        if (idsUnicos.size() != idsPlanes.size()) {
            throw new BadRequestException(
                    "No se puede repetir el mismo plan dentro de la promocion",
                    null,
                    Map.of("idsPlanes", idsPlanes)
            );
        }

        Set<Plan> planes = new HashSet<>(planRepository.findAllById(idsUnicos));
        if (planes.size() != idsUnicos.size()) {
            throw new BadRequestException(
                    "Uno o mas planes enviados no existen",
                    null,
                    Map.of("idsPlanes", idsPlanes)
            );
        }
        return planes;
    }

    private void validarConsistencia(PromocionComercialRequest request, Proveedor proveedor, Set<Plan> planes) {
        if (request.getIdZona() == null) {
            throw new BadRequestException(
                    "La promocion interna debe indicar una zona",
                    null,
                    null
            );
        }

        Set<Long> proveedoresDePlanes = new HashSet<>();
        for (Plan plan : planes) {
            if (!Boolean.TRUE.equals(plan.getActivo())) {
                throw new BadRequestException(
                        "La promocion solo puede asociarse a planes activos",
                        null,
                        Map.of("idPlan", plan.getId())
                );
            }
            proveedoresDePlanes.add(plan.getProveedor().getId());
        }

        if (proveedoresDePlanes.size() > 1) {
            throw new BadRequestException(
                    "Todos los planes de una promocion deben pertenecer al mismo proveedor",
                    null,
                    Map.of("idsPlanes", request.getIdsPlanes())
                );
        }

        Long proveedorDePlanes = proveedoresDePlanes.iterator().next();
        if (proveedor == null) {
            throw new BadRequestException(
                    "La promocion interna debe indicar un proveedor",
                    null,
                    null
            );
        }
        if (!proveedor.getId().equals(proveedorDePlanes)) {
            throw new BadRequestException(
                    "Los planes no pertenecen al proveedor de la promocion",
                    null,
                    Map.of(
                            "idProveedor", proveedor.getId(),
                            "idsPlanes", request.getIdsPlanes()
                    )
            );
        }

        boolean existeReglaActiva = repository.listarActivas(proveedor.getId(), request.getIdZona(), null).stream()
                .anyMatch(promocion -> promocion.getReglaComercial().equalsIgnoreCase(request.getReglaComercial()));
        if (existeReglaActiva) {
            throw new BadRequestException(
                    "Ya existe una promocion interna activa con la misma regla comercial para ese proveedor y zona",
                    null,
                    Map.of(
                            "reglaComercial", request.getReglaComercial(),
                            "idProveedor", proveedor.getId(),
                            "idZona", request.getIdZona()
                    )
            );
        }
    }

    private PromocionComercialResponse toResponse(PromocionComercial entity) {
        return PromocionComercialResponse.builder()
                .id(entity.getId())
                .reglaComercial(entity.getReglaComercial())
                .idProveedor(entity.getProveedor() == null ? null : entity.getProveedor().getId())
                .nombreProveedor(entity.getProveedor() == null ? null : entity.getProveedor().getNombre())
                .idZona(entity.getZona() == null ? null : entity.getZona().getId())
                .nombreZona(entity.getZona() == null ? null : entity.getZona().getNombre())
                .idsPlanes(entity.getPlanes().stream().map(Plan::getId).sorted().toList())
                .nombresPlanes(entity.getPlanes().stream().map(Plan::getNombre).sorted(String.CASE_INSENSITIVE_ORDER).toList())
                .activo(entity.getActivo())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
