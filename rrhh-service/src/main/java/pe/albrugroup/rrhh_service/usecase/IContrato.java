package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.request.contrato.CerrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.request.contrato.RegistrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.response.ContratoRegistroResponse;
import pe.albrugroup.rrhh_service.entity.response.ContratoResponse;

import java.util.List;

public interface IContrato {

    List<ContratoResponse> listarContratosEmpleado(Long idEmpleado);
    ContratoResponse getContratoVigente(Long idEmpleado);

    ContratoRegistroResponse registrarContrato(Long idEmpleado, RegistrarContratoRequest nuevoContrato, String authHeader);
    ContratoResponse finalizarContrato(Long idEmpleado, CerrarContratoRequest contratoCerrado, String authHeader);
    void registrarContratos(List<Long> idEmpleados, List<RegistrarContratoRequest> nuevosContratosVigentes, String authHeader);
}
