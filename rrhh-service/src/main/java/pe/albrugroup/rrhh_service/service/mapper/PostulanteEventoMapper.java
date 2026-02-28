package pe.albrugroup.rrhh_service.service.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import pe.albrugroup.rrhh_service.entity.PostulanteEvento;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarEventoPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteEventoResponse;

@Mapper(componentModel = "spring")
public interface PostulanteEventoMapper {

    @BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "etapaProceso", source = "etapaProceso")
    @Mapping(target = "evento", source = "evento")
    @Mapping(target = "estado", source = "estado")
    @Mapping(target = "subestado", source = "subestado")
    @Mapping(target = "fechaEvento", source = "fechaEvento")
    @Mapping(target = "inicioCapa", source = "inicioCapa")
    @Mapping(target = "finCapa", source = "finCapa")
    @Mapping(target = "turnoHorario", source = "turnoHorario")
    @Mapping(target = "pagoDiaCapa", source = "pagoDiaCapa")
    PostulanteEvento toEntity(RegistrarEventoPostulanteRequest request);

    @Mapping(target = "postulanteId", source = "postulante.id")
    @Mapping(target = "responsableId", source = "responsable.id")
    PostulanteEventoResponse toResponse(PostulanteEvento entity);
}
