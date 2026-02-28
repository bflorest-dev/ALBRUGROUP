package pe.albrugroup.rrhh_service.service.mapper;

import org.mapstruct.*;
import pe.albrugroup.rrhh_service.entity.Postulante;
import pe.albrugroup.rrhh_service.entity.enums.EventoPostulante;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;

@Mapper(componentModel = "spring")
public interface PostulanteMapper {

    Postulante toEntity(RegistrarPostulanteRequest request);
    @Mapping(target = "nombres", source = "empleado.nombres")
    @Mapping(target = "apellidos", source = "empleado.apellidos")
    @Mapping(target = "tipoDocumento", source = "empleado.tipoDocumento")
    @Mapping(target = "numeroDocumento", source = "empleado.numeroDocumento")
    @Mapping(target = "celularPersonal", source = "empleado.celularPersonal")
    @Mapping(target = "compania", source = "empleado.compania")
    @Mapping(target = "listaNegra", source = "empleado.listaNegra")
    PostulanteResponse toResponse(Postulante entity);

    @Mapping(target = "id", source = "entity.id")
    @Mapping(target = "nombres", source = "entity.empleado.nombres")
    @Mapping(target = "apellidos", source = "entity.empleado.apellidos")
    @Mapping(target = "tipoDocumento", source = "entity.empleado.tipoDocumento")
    @Mapping(target = "numeroDocumento", source = "entity.empleado.numeroDocumento")
    @Mapping(target = "celularPersonal", source = "entity.empleado.celularPersonal")
    @Mapping(target = "compania", source = "entity.empleado.compania")
    @Mapping(target = "etapaProceso", source = "entity.etapaProceso")
    @Mapping(target = "evento", source = "evento")
    @Mapping(target = "estadoProceso", source = "entity.estadoProceso")
    @Mapping(target = "subestadoProceso", source = "entity.subestadoProceso")
    @Mapping(target = "origen", source = "entity.origen")
    @Mapping(target = "puestoTrabajo", source = "entity.puestoTrabajo")
    @Mapping(target = "fechaActualizacion", source = "entity.fechaActualizacion")
    @Mapping(target = "listaNegra", source = "entity.empleado.listaNegra")
    PostulanteResponse toResponse(Postulante entity, EventoPostulante evento);

//    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
//    void updateDatosPostulacion(DatosPostulanteRequest request, @MappingTarget Postulante entity);
}
