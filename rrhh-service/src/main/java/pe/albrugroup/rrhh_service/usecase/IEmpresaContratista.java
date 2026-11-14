package pe.albrugroup.rrhh_service.usecase;

import pe.albrugroup.rrhh_service.entity.request.empresaContratista.AsignarEmpresaContratistaRequest;
import pe.albrugroup.rrhh_service.entity.request.empresaContratista.RegistrarEmpresaContratistaRequest;
import pe.albrugroup.rrhh_service.entity.response.EmpresaContratistaResponse;

import java.util.List;

public interface IEmpresaContratista {

    EmpresaContratistaResponse registrarEmpresaContratista(RegistrarEmpresaContratistaRequest request);

    List<EmpresaContratistaResponse> listarEmpresasContratistas(Boolean activo);

    EmpresaContratistaResponse desactivarEmpresaContratista(Long idEmpresaContratista);

    List<EmpresaContratistaResponse> misEmpresasContratistas(Long empleadoId, List<String> roles);

    List<EmpresaContratistaResponse> listarAsignacionesEmpleado(Long idEmpleado);

    void asignarEmpresasContratistas(AsignarEmpresaContratistaRequest request);

    void desasignarEmpresaContratista(Long idEmpleado, Long idEmpresaContratista);
}
