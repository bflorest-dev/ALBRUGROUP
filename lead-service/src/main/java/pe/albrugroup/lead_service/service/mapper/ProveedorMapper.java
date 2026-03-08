package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.Mapper;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.request.ProveedorRequest;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;

@Mapper(componentModel = "spring")
public interface ProveedorMapper {

    Proveedor toEntity(ProveedorRequest request);
    ProveedorResponse toResponse(Proveedor entity);
}
