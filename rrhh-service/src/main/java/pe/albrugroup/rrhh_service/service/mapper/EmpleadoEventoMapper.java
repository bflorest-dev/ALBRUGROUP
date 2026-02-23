package pe.albrugroup.rrhh_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.rrhh_service.entity.EmpleadoEvento;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoEventoResponse;

@Mapper(componentModel = "spring")
public interface EmpleadoEventoMapper {

    @Mapping(target = "empleadoId", source = "empleado.id")
    @Mapping(target = "responsableId", source = "responsable.id")
    EmpleadoEventoResponse toResponse(EmpleadoEvento entity);
}
