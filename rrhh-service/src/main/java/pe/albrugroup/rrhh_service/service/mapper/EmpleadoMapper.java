package pe.albrugroup.rrhh_service.service.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.request.DatosContactoUbicacionRequest;
import pe.albrugroup.rrhh_service.entity.request.DatosFinancierosRequest;
import pe.albrugroup.rrhh_service.entity.request.DatosPersonalesRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarEmpleadoRequest;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;

@Mapper(componentModel = "spring")
public interface EmpleadoMapper {

    Empleado toEntity(RegistrarEmpleadoRequest request);
    EmpleadoResponse toResponse(Empleado entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateDatosPersonales(DatosPersonalesRequest request, @MappingTarget Empleado entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateDatosFinancieros(DatosFinancierosRequest request, @MappingTarget Empleado entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateDatosContactoUbicacion(DatosContactoUbicacionRequest request, @MappingTarget Empleado entity);
}
