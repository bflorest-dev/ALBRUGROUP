package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.request.SubtipificacionRequest;
import pe.albrugroup.lead_service.entity.request.TipificacionRequest;
import pe.albrugroup.lead_service.entity.response.SubtipificacionResponse;
import pe.albrugroup.lead_service.entity.response.TipificacionResponse;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TipificacionMapper {

    Tipificacion toEntity(TipificacionRequest request);

    @Mapping(target = "tipificacion", ignore = true)
    Subtipificacion toEntity(SubtipificacionRequest request);

    SubtipificacionResponse toResponse(Subtipificacion entity);

    List<SubtipificacionResponse> toResponse(List<Subtipificacion> entities);

    @Mapping(target = "subtipificaciones", source = "subtipificaciones")
    TipificacionResponse toResponse(Tipificacion entity, List<SubtipificacionResponse> subtipificaciones);
}
