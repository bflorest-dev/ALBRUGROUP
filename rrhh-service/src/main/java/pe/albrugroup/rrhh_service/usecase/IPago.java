package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.request.pago.RegistrarPagoRequest;
import pe.albrugroup.rrhh_service.entity.response.PagoResponse;

import java.time.LocalDate;
import java.util.List;

public interface IPago {

    List<PagoResponse> getPagos(Long idContrato, Long idEmpleado, LocalDate desde, LocalDate hasta);

    PagoResponse registrarPago(Long idContrato, RegistrarPagoRequest nuevoPago);
    void registrarPagos(List<Long> idContratos, List<RegistrarPagoRequest> nuevosPagos);
}
