package pe.albrugroup.rrhh_service.service.mapper;

import org.mapstruct.Mapper;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoRolResponse;
import pe.albrugroup.rrhh_service.repository.projection.EmpleadoRolProjection;

import java.util.List;

@Mapper(componentModel = "spring")
public interface EmpleadoRolMapper {

    EmpleadoRolResponse toResponse(EmpleadoRolProjection projection);

    List<EmpleadoRolResponse> toResponseList(List<EmpleadoRolProjection> projections);
}
