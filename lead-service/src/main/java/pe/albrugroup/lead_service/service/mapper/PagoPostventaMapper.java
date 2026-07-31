package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import pe.albrugroup.lead_service.entity.PagoPostventa;
import pe.albrugroup.lead_service.entity.request.PagoPostventaRequest;
import pe.albrugroup.lead_service.entity.request.PagoPostventaUpdateRequest;
import pe.albrugroup.lead_service.entity.response.PagoPostventaResponse;

@Mapper(componentModel = "spring")
public interface PagoPostventaMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "lead", ignore = true)
    @Mapping(target = "periodoFacturacionPostventa", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    PagoPostventa toEntity(PagoPostventaRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "lead", ignore = true)
    @Mapping(target = "periodoFacturacionPostventa", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(PagoPostventaUpdateRequest request, @MappingTarget PagoPostventa entity);

    @Mapping(target = "idLead", source = "lead.id")
    @Mapping(target = "idPeriodoFacturacion", source = "periodoFacturacionPostventa.id")
    PagoPostventaResponse toResponse(PagoPostventa entity);
}
