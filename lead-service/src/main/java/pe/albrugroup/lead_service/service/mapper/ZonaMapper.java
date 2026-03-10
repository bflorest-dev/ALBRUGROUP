package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pe.albrugroup.lead_service.entity.Zona;
import pe.albrugroup.lead_service.entity.ZonaRegla;
import pe.albrugroup.lead_service.entity.request.ZonaReglaRequest;
import pe.albrugroup.lead_service.entity.request.ZonaRequest;
import pe.albrugroup.lead_service.entity.response.ZonaReglaResponse;
import pe.albrugroup.lead_service.entity.response.ZonaResponse;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ZonaMapper {

    @Mapping(target = "activo", ignore = true)
    Zona toEntity(ZonaRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "activo", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateDatosZona(ZonaRequest request, @MappingTarget Zona entity);

    @Mapping(target = "zona", ignore = true)
    ZonaRegla toEntity(ZonaReglaRequest request);

    ZonaReglaResponse toResponse(ZonaRegla entity);

    @Mapping(target = "reglas", source = "reglas")
    ZonaResponse toResponse(Zona zona, List<ZonaReglaResponse> reglas);
}
