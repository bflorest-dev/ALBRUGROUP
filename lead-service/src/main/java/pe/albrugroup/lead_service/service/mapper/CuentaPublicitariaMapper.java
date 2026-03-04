package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.Mapper;
import pe.albrugroup.lead_service.entity.CuentaPublicitaria;
import pe.albrugroup.lead_service.entity.request.CuentaPublicitariaRequest;
import pe.albrugroup.lead_service.entity.response.CuentaPublicitariaResponse;

@Mapper(componentModel = "spring")
public interface CuentaPublicitariaMapper {

    CuentaPublicitaria toEntity(CuentaPublicitariaRequest request);
    CuentaPublicitariaResponse toResponse(CuentaPublicitaria entity);
}
