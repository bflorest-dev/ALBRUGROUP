package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.request.CampanaRequest;
import pe.albrugroup.lead_service.entity.request.CampanaWhatsappRequest;
import pe.albrugroup.lead_service.entity.response.CampanaResponse;

@Mapper(componentModel = "spring")
public interface CampanaMapper {

    @Mapping(target = "numeroWhatsappEmpresa", source = "numeroWhatsappEmpresa")
    @Mapping(target = "cuentaPublicitaria", ignore = true)
    @Mapping(target = "proveedor", ignore = true)
    @Mapping(target = "activo", ignore = true)
    Campana toEntity(CampanaRequest request);

    @Mapping(target = "idCuentaPublicitaria", source = "cuentaPublicitaria.id")
    @Mapping(target = "numeroCuenta", source = "cuentaPublicitaria.numeroCuenta")
    @Mapping(target = "nombreCuenta", source = "cuentaPublicitaria.nombreCuenta")
    @Mapping(target = "idProveedor", source = "proveedor.id")
    @Mapping(target = "nombreProveedor", source = "proveedor.nombre")
    CampanaResponse toResponse(Campana entity);

    @Mapping(target = "numeroWhatsappEmpresa", source = "numeroWhatsappEmpresa")
    void updateNumeroWhatsappCampana(CampanaWhatsappRequest request, @MappingTarget Campana entity);
}
