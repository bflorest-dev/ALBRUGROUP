package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.request.PageRequest;
import pe.albrugroup.rrhh_service.entity.request.contrato.CerrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.request.contrato.RegistrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.response.ContratoResponse;
import pe.albrugroup.rrhh_service.entity.response.PageResponse;

import java.util.List;

public interface IContrato {

    PageResponse<ContratoResponse> listarContratosEmpleado(Long idEmpleado, PageRequest pageRequest);
    ContratoResponse getContratoVigente(Long idEmpleado);

    ContratoResponse registrarContrato(Long idEmpleado, RegistrarContratoRequest nuevoContrato, String authHeader, Long responsableId);
    ContratoResponse finalizarContrato(Long idEmpleado, CerrarContratoRequest contratoCerrado, String authHeader);
    void registrarContratos(List<Long> idEmpleados, List<RegistrarContratoRequest> nuevosContratosVigentes, String authHeader, Long responsableId);
}
