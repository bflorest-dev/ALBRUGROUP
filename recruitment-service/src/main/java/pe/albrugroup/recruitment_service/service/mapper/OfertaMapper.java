package pe.albrugroup.recruitment_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.recruitment_service.entity.OfertaAmpliacion;
import pe.albrugroup.recruitment_service.entity.OfertaLaboral;
import pe.albrugroup.recruitment_service.entity.request.OfertaAmpliacionRequest;
import pe.albrugroup.recruitment_service.entity.request.OfertaLaboralRequest;
import pe.albrugroup.recruitment_service.entity.response.OfertaAmpliacionResponse;
import pe.albrugroup.recruitment_service.entity.response.OfertaLaboralResponse;

@Mapper(componentModel = "spring")
public interface OfertaMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "idSolicitante", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "ampliaciones", ignore = true)
    OfertaLaboral toEntity(OfertaLaboralRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "idSolicitante", ignore = true)
    @Mapping(target = "ofertaLaboral", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    OfertaAmpliacion toEntity(OfertaAmpliacionRequest request);

    OfertaLaboralResponse toResponse(OfertaLaboral entity);

    OfertaAmpliacionResponse toResponse(OfertaAmpliacion entity);
}
