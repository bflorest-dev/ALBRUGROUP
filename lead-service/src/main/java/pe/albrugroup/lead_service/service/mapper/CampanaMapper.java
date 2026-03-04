package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.request.CampanaRequest;
import pe.albrugroup.lead_service.entity.response.CampanaResponse;

@Mapper(componentModel = "spring")
public interface CampanaMapper {

    Campana toEntity(CampanaRequest request);
    CampanaResponse toResponse(Campana entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateDatosCampana(CampanaRequest request, @MappingTarget Campana entity);
}
