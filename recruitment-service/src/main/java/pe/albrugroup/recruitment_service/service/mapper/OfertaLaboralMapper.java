package pe.albrugroup.recruitment_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.recruitment_service.entity.OfertaLaboral;
import pe.albrugroup.recruitment_service.entity.request.OfertaLaboralRequest;
import pe.albrugroup.recruitment_service.entity.response.OfertaLaboralResponse;

@Mapper(componentModel = "spring", uses = OfertaAmpliacionMapper.class)
public interface OfertaLaboralMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "idSolicitante", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "ampliaciones", ignore = true)
    OfertaLaboral toEntity(OfertaLaboralRequest request);

    OfertaLaboralResponse toResponse(OfertaLaboral entity);
}
