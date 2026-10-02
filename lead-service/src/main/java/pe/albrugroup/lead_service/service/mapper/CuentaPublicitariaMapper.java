package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.lead_service.entity.CuentaPublicitaria;
import pe.albrugroup.lead_service.entity.request.CuentaPublicitariaRequest;
import pe.albrugroup.lead_service.entity.response.CuentaPublicitariaResponse;

@Mapper(componentModel = "spring")
public interface CuentaPublicitariaMapper {

    @Mapping(target = "proveedor", ignore = true)
    CuentaPublicitaria toEntity(CuentaPublicitariaRequest request);

    @Mapping(target = "idProveedor", source = "proveedor.id")
    @Mapping(target = "nombreProveedor", source = "proveedor.nombre")
    CuentaPublicitariaResponse toResponse(CuentaPublicitaria entity);
}
