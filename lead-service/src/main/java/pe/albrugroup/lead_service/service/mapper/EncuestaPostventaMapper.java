package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.lead_service.entity.EncuestaPostventa;
import pe.albrugroup.lead_service.entity.request.EncuestaPostventaRequest;
import pe.albrugroup.lead_service.entity.response.EncuestaPostventaResponse;

@Mapper(componentModel = "spring")
public interface EncuestaPostventaMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "lead", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    EncuestaPostventa toEntity(EncuestaPostventaRequest request);

    @Mapping(target = "idLead", source = "lead.id")
    EncuestaPostventaResponse toResponse(EncuestaPostventa entity);
}
