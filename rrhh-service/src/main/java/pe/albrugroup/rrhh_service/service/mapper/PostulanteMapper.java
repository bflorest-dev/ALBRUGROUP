package pe.albrugroup.rrhh_service.service.mapper;

import org.mapstruct.*;
import pe.albrugroup.rrhh_service.entity.Postulante;
import pe.albrugroup.rrhh_service.entity.request.DatosPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;

@Mapper(componentModel = "spring")
public interface PostulanteMapper {

    Postulante toEntity(RegistrarPostulanteRequest request);
    @Mapping(target = "nombres", source = "empleado.nombres")
    @Mapping(target = "apellidos", source = "empleado.apellidos")
    @Mapping(target = "tipoDocumento", source = "empleado.tipoDocumento")
    @Mapping(target = "numeroDocumento", source = "empleado.numeroDocumento")
    @Mapping(target = "celularPersonal", source = "empleado.celularPersonal")
    PostulanteResponse toResponse(Postulante entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateDatosPostulacion(DatosPostulanteRequest request, @MappingTarget Postulante entity);
}
