package pe.albrugroup.rrhh_service.service.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.request.*;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;

@Mapper(componentModel = "spring")
public interface EmpleadoMapper {

    Empleado toEntity(RegistrarEmpleadoRequest request);
    Empleado toEntity(RegistrarPostulanteRequest request);
    EmpleadoResponse toResponse(Empleado entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateDatosPersonales(DatosPersonalesRequest request, @MappingTarget Empleado entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateDatosFinancieros(DatosFinancierosRequest request, @MappingTarget Empleado entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateDatosContactoUbicacion(DatosContactoUbicacionRequest request, @MappingTarget Empleado entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateDatosContactoCorporativo(DatosContactoCorporativoRequest request, @MappingTarget Empleado entity);
}
