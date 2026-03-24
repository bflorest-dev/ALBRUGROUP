package pe.albrugroup.recruitment_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.recruitment_service.entity.Postulacion;
import pe.albrugroup.recruitment_service.entity.Postulante;
import pe.albrugroup.recruitment_service.entity.request.PostulanteRequest;
import pe.albrugroup.recruitment_service.entity.response.PostulacionResponse;
import pe.albrugroup.recruitment_service.entity.response.PostulanteResponse;

@Mapper(componentModel = "spring")
public interface PostulacionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "listaNegra", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Postulante toEntity(PostulanteRequest request);

    PostulanteResponse toResponse(Postulante postulante);

    @Mapping(target = "ofertaLaboral", source = "ofertaLaboral")
    PostulacionResponse toResponse(Postulacion postulacion);
}
