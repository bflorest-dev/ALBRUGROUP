package pe.albrugroup.rrhh_service.service.mapper;

import org.mapstruct.Mapper;
import pe.albrugroup.rrhh_service.entity.EmpresaContratista;
import pe.albrugroup.rrhh_service.entity.request.empresaContratista.RegistrarEmpresaContratistaRequest;
import pe.albrugroup.rrhh_service.entity.response.EmpresaContratistaResponse;

@Mapper(componentModel = "spring")
public interface EmpresaContratistaMapper {

    EmpresaContratista toEntity(RegistrarEmpresaContratistaRequest request);

    EmpresaContratistaResponse toResponse(EmpresaContratista entity);
}
