package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.request.CerrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.response.ContratoResponse;

import java.util.List;

@Component
public interface IContrato {

    List<ContratoResponse> listarContratosEmpleado(Long idEmpleado);
    ContratoResponse getContratoVigente(Long idEmpleado);

    ContratoResponse registrarContrato(Long idEmpleado, RegistrarContratoRequest nuevoContrato);
    ContratoResponse finalizarContrato(Long idEmpleado, CerrarContratoRequest contratoCerrado);
    void registrarContratos(List<Long> idEmpleados, List<RegistrarContratoRequest> nuevosContratosVigentes);
}
