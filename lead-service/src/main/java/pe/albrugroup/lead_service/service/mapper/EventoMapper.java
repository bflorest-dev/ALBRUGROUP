package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.Mapper;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.response.EventoResponse;

@Mapper(componentModel = "spring")
public interface EventoMapper {

    EventoResponse toResponse(Evento evento);
}
