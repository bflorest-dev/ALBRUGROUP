package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pe.albrugroup.lead_service.entity.*;
import pe.albrugroup.lead_service.entity.request.*;
import pe.albrugroup.lead_service.entity.response.*;

@Mapper(componentModel = "spring")
public interface PlanMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "proveedor", ignore = true)
    @Mapping(target = "planes", ignore = true)
    @Mapping(target = "leads", ignore = true)
    @Mapping(target = "activo", ignore = true)
    Adicional toEntity(AdicionalRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "proveedor", ignore = true)
    @Mapping(target = "activo", ignore = true)
    Internet toEntity(InternetRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "proveedor", ignore = true)
    @Mapping(target = "activo", ignore = true)
    Television toEntity(TelevisionRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "proveedor", ignore = true)
    @Mapping(target = "activo", ignore = true)
    Telefono toEntity(TelefonoRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "proveedor", ignore = true)
    @Mapping(target = "internet", ignore = true)
    @Mapping(target = "television", ignore = true)
    @Mapping(target = "telefono", ignore = true)
    @Mapping(target = "zona", ignore = true)
    @Mapping(target = "adicionales", ignore = true)
    @Mapping(target = "activo", ignore = true)
    Plan toEntity(PlanRequest request);

    void updatePlan(PlanUpdateRequest request, @MappingTarget Plan entity);

    @Mapping(target = "idProveedor", source = "proveedor.id")
    @Mapping(target = "nombreProveedor", source = "proveedor.nombre")
    AdicionalResponse toResponse(Adicional entity);

    InternetResponse toResponse(Internet entity);

    TelevisionResponse toResponse(Television entity);

    TelefonoResponse toResponse(Telefono entity);

    @Mapping(target = "idAdicional", source = "adicional.id")
    @Mapping(target = "nombreAdicional", source = "adicional.nombre")
    PlanAdicionalResponse toResponse(PlanAdicional entity);
}
