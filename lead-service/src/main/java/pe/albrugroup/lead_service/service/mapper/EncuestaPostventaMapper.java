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
    @Mapping(target = "periodoFacturacionPostventa", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "prioridad", ignore = true)
    @Mapping(target = "fechaProgramada", ignore = true)
    @Mapping(target = "fechaLimite", ignore = true)
    @Mapping(target = "fechaRealizada", ignore = true)
    @Mapping(target = "numeroEncuesta", ignore = true)
    @Mapping(target = "idAsesorEncuesta", ignore = true)
    @Mapping(target = "nombreAsesorEncuesta", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    EncuestaPostventa toEntity(EncuestaPostventaRequest request);

    @Mapping(target = "idLead", source = "lead.id")
    @Mapping(target = "idPeriodoFacturacion", source = "periodoFacturacionPostventa.id")
    EncuestaPostventaResponse toResponse(EncuestaPostventa entity);
}
