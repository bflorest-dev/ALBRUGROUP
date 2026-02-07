package pe.albrugroup.rrhh_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.albrugroup.rrhh_service.entity.Pago;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPagoRequest;
import pe.albrugroup.rrhh_service.entity.response.PagoResponse;

@Mapper(componentModel = "spring")
public interface PagoMapper {

    Pago toEntity(RegistrarPagoRequest request);
    @Mapping(source = "contrato.id", target = "idContrato")
    PagoResponse toResponse(Pago pago);
}
