package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.lead_service.entity.Departamento;
import pe.albrugroup.lead_service.entity.Distrito;
import pe.albrugroup.lead_service.entity.Provincia;
import pe.albrugroup.lead_service.entity.response.DepartamentoResponse;
import pe.albrugroup.lead_service.entity.response.DistritoResponse;
import pe.albrugroup.lead_service.entity.response.ProvinciaResponse;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UbigeoMapper {

    DepartamentoResponse toResponse(Departamento entity);

    @Mapping(target = "idDepartamento", source = "departamento.id")
    ProvinciaResponse toResponse(Provincia entity);

    @Mapping(target = "idProvincia", source = "provincia.id")
    @Mapping(target = "idDepartamento", source = "departamento.id")
    DistritoResponse toResponse(Distrito entity);

    List<DepartamentoResponse> toDepartamentoResponse(List<Departamento> entities);
    List<ProvinciaResponse> toProvinciaResponse(List<Provincia> entities);
    List<DistritoResponse> toDistritoResponse(List<Distrito> entities);
}
