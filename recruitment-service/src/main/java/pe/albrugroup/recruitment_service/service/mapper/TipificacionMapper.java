package pe.albrugroup.recruitment_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.recruitment_service.entity.Subtipificacion;
import pe.albrugroup.recruitment_service.entity.Tipificacion;
import pe.albrugroup.recruitment_service.entity.request.SubtipificacionRequest;
import pe.albrugroup.recruitment_service.entity.request.TipificacionRequest;
import pe.albrugroup.recruitment_service.entity.response.SubtipificacionResponse;
import pe.albrugroup.recruitment_service.entity.response.TipificacionResponse;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TipificacionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "etapa", ignore = true)
    @Mapping(target = "activo", ignore = true)
    Tipificacion toEntity(TipificacionRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tipificacion", ignore = true)
    @Mapping(target = "activo", ignore = true)
    Subtipificacion toEntity(SubtipificacionRequest request);

    SubtipificacionResponse toResponse(Subtipificacion subtipificacion);

    default TipificacionResponse toResponse(Tipificacion tipificacion, List<SubtipificacionResponse> subtipificaciones) {
        return new TipificacionResponse(
                tipificacion.getId(),
                tipificacion.getCodigo(),
                tipificacion.getDescripcion(),
                tipificacion.getOrden(),
                subtipificaciones
        );
    }
}
