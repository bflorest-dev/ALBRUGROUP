package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.request.ProveedorRequest;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.service.mapper.ProveedorMapper;

@Service
@Transactional
@RequiredArgsConstructor
public class ProveedorService {

    private final ProveedorRepository repository;
    private final ProveedorMapper mapper;

    public ProveedorResponse registrarProveedor(ProveedorRequest request) {
        Proveedor proveedor = mapper.toEntity(request);
        proveedor.setActivo(Boolean.TRUE);
        return mapper.toResponse(repository.save(proveedor));
    }

    public ProveedorResponse alternarEstadoProveedor(Long idProveedor) {
        Proveedor proveedor = repository.findById(idProveedor)
                .orElseThrow(() -> new NotFoundException(Proveedor.class, idProveedor));

        proveedor.setActivo(!Boolean.TRUE.equals(proveedor.getActivo()));
        return mapper.toResponse(repository.save(proveedor));
    }
}
