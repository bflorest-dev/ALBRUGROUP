package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.lead_service.entity.PromocionComercial;
import pe.albrugroup.lead_service.entity.request.PromocionComercialRequest;
import pe.albrugroup.lead_service.entity.response.PromocionComercialResponse;

@Mapper(componentModel = "spring")
public interface PromocionComercialMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "proveedor", ignore = true)
    @Mapping(target = "zona", ignore = true)
    @Mapping(target = "planes", ignore = true)
    @Mapping(target = "activo", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    PromocionComercial toEntity(PromocionComercialRequest request);
}
