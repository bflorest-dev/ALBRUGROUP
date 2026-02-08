package pe.albrugroup.rrhh_service.service.mapper;

import org.mapstruct.Mapper;
import pe.albrugroup.rrhh_service.entity.Postulante;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;

@Mapper(componentModel = "spring")
public interface PostulanteMapper {

    Postulante toEntity(RegistrarPostulanteRequest request);
    PostulanteResponse toResponse(Postulante postulante);
}
