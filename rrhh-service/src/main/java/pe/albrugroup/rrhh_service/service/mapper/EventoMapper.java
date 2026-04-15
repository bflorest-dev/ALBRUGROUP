package pe.albrugroup.rrhh_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.rrhh_service.entity.Evento;
import pe.albrugroup.rrhh_service.entity.response.EventoResponse;

@Mapper(componentModel = "spring")
public interface EventoMapper {

    @Mapping(target = "empleadoId", source = "empleado.id")
    @Mapping(target = "responsableId", source = "responsable.id")
    EventoResponse toResponse(Evento entity);
}
