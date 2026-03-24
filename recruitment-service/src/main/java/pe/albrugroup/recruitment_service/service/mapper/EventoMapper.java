package pe.albrugroup.recruitment_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.recruitment_service.entity.Evento;
import pe.albrugroup.recruitment_service.entity.response.EventoResponse;

@Mapper(componentModel = "spring")
public interface EventoMapper {

    @Mapping(target = "idPostulacion", source = "postulacion.id")
    EventoResponse toResponse(Evento evento);
}
