package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPagoRequest;
import pe.albrugroup.rrhh_service.entity.response.PagoResponse;

import java.time.LocalDate;
import java.util.List;

@Component
public interface IPago {

    List<PagoResponse> getPagos(Long idContrato, Long idEmpleado, LocalDate desde, LocalDate hasta);

    PagoResponse registrarPago(Long idContrato, RegistrarPagoRequest nuevoPago);
    void registrarPagos(List<Long> idContratos, List<RegistrarPagoRequest> nuevosPagos);
}
