package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CacheNames;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.request.ProveedorRequest;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.service.mapper.ProveedorMapper;

import java.util.HashSet;
import java.util.List;

@Service @Transactional
@RequiredArgsConstructor
public class ProveedorService {

    private final ProveedorRepository repository;
    private final ProveedorMapper mapper;

    @CacheEvict(value = CacheNames.PROVEEDORES, allEntries = true)
    public ProveedorResponse registrarProveedor(ProveedorRequest request) {
        Proveedor proveedor = mapper.toEntity(request);
        proveedor.setCortesFacturacion(request.getCortesFacturacion() == null
                ? new HashSet<>()
                : new HashSet<>(request.getCortesFacturacion()));
        proveedor.setActivo(Boolean.TRUE);
        return mapper.toResponse(repository.save(proveedor));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.PROVEEDORES, key = "#activo == null ? 'all' : #activo")
    public List<ProveedorResponse> listarProveedores(Boolean activo) {
        return repository.listarPorActivo(activo).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @CacheEvict(value = CacheNames.PROVEEDORES, allEntries = true)
    public ProveedorResponse alternarEstadoProveedor(Long idProveedor) {
        Proveedor proveedor = repository.findById(idProveedor)
                .orElseThrow(() -> new NotFoundException(Proveedor.class, idProveedor));

        proveedor.setActivo(!Boolean.TRUE.equals(proveedor.getActivo()));
        return mapper.toResponse(repository.save(proveedor));
    }
}
