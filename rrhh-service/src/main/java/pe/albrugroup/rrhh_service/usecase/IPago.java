package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPagoRequest;
import pe.albrugroup.rrhh_service.entity.response.PagoResponse;

import java.util.List;

@Component
public interface IPago {

    List<PagoResponse> getPagosPorContrato(Long idContrato);
    List<PagoResponse> getPagosPorEmpleado(Long idEmpleado);

    List<PagoResponse> registrarPagos(List<Long> idContratos, List<RegistrarPagoRequest> nuevosPagos);
    PagoResponse registrarPago(Long idContrato, RegistrarPagoRequest nuevoPago);
}
