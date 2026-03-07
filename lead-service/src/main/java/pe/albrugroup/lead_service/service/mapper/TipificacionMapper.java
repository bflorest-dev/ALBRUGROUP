package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.request.SubtipificacionCatalogoRequest;
import pe.albrugroup.lead_service.entity.request.SubtipificacionRequest;
import pe.albrugroup.lead_service.entity.request.TipificacionCatalogoRequest;
import pe.albrugroup.lead_service.entity.request.TipificacionRequest;
import pe.albrugroup.lead_service.entity.response.SubtipificacionResponse;
import pe.albrugroup.lead_service.entity.response.TipificacionResponse;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TipificacionMapper {

    Tipificacion toEntity(TipificacionRequest request);

    @Mapping(target = "etapa", ignore = true)
    @Mapping(target = "activo", ignore = true)
    Tipificacion toEntity(TipificacionCatalogoRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "etapa", ignore = true)
    @Mapping(target = "activo", ignore = true)
    void updateDatosTipificacion(TipificacionCatalogoRequest request, @MappingTarget Tipificacion entity);

    @Mapping(target = "tipificacion", ignore = true)
    Subtipificacion toEntity(SubtipificacionRequest request);

    @Mapping(target = "tipificacion", ignore = true)
    @Mapping(target = "activo", ignore = true)
    Subtipificacion toEntity(SubtipificacionCatalogoRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tipificacion", ignore = true)
    @Mapping(target = "activo", ignore = true)
    void updateDatosSubtipificacion(SubtipificacionCatalogoRequest request, @MappingTarget Subtipificacion entity);

    SubtipificacionResponse toResponse(Subtipificacion entity);

    List<SubtipificacionResponse> toResponse(List<Subtipificacion> entities);

    @Mapping(target = "subtipificaciones", source = "subtipificaciones")
    TipificacionResponse toResponse(Tipificacion entity, List<SubtipificacionResponse> subtipificaciones);
}
