package pe.albrugroup.recruitment_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacionDetalle;
import pe.albrugroup.recruitment_service.entity.request.GrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.response.GrupoCapacitacionDetalleResponse;
import pe.albrugroup.recruitment_service.entity.response.GrupoCapacitacionResponse;

@Mapper(componentModel = "spring", uses = PostulacionMapper.class)
public interface GrupoCapacitacionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "detalles", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    GrupoCapacitacion toEntity(GrupoCapacitacionRequest request);

    GrupoCapacitacionResponse toResponse(GrupoCapacitacion entity);

    GrupoCapacitacionDetalleResponse toResponse(GrupoCapacitacionDetalle entity);
}
