package pe.albrugroup.recruitment_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.recruitment_service.entity.OfertaAmpliacion;
import pe.albrugroup.recruitment_service.entity.request.OfertaAmpliacionRequest;
import pe.albrugroup.recruitment_service.entity.response.OfertaAmpliacionResponse;

@Mapper(componentModel = "spring")
public interface OfertaAmpliacionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "idSolicitante", ignore = true)
    @Mapping(target = "ofertaLaboral", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    OfertaAmpliacion toEntity(OfertaAmpliacionRequest request);

    @Mapping(target = "idOfertaLaboral", source = "ofertaLaboral.id")
    OfertaAmpliacionResponse toResponse(OfertaAmpliacion entity);
}
