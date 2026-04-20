package pe.albrugroup.schedule_service.service.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import pe.albrugroup.schedule_service.entity.ExcepcionHorario;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.HorarioDetalle;
import pe.albrugroup.schedule_service.entity.request.horario.BloqueHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarExcepcionHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarHorarioRequest;
import pe.albrugroup.schedule_service.entity.response.horario.ExcepcionHorarioResponse;
import pe.albrugroup.schedule_service.entity.response.horario.HorarioDetalleResponse;
import pe.albrugroup.schedule_service.entity.response.horario.HorarioResponse;

@Mapper(componentModel = "spring")
public interface HorarioMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "politicaModalidad", ignore = true)
    @Mapping(target = "modalidadContrato", source = "modalidad")
    @Mapping(target = "horasObjetivoSemanal", ignore = true)
    @Mapping(target = "horasObjetivoMensual", ignore = true)
    @Mapping(target = "minutosAlmuerzo", ignore = true)
    @Mapping(target = "minutosServicios", ignore = true)
    @Mapping(target = "fechaFin", ignore = true)
    @Mapping(target = "detalles", ignore = true)
    @Mapping(target = "excepciones", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Horario toEntity(RegistrarHorarioRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "horario", ignore = true)
    HorarioDetalle toDetalle(BloqueHorarioRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "horario", ignore = true)
    ExcepcionHorario toExcepcion(RegistrarExcepcionHorarioRequest request);

    @Mapping(source = "modalidadContrato", target = "modalidad")
    HorarioResponse toResponse(Horario entity);

    HorarioDetalleResponse toResponse(HorarioDetalle entity);

    ExcepcionHorarioResponse toResponse(ExcepcionHorario entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "horario", ignore = true)
    void updateExcepcion(RegistrarExcepcionHorarioRequest request, @MappingTarget ExcepcionHorario entity);
}
