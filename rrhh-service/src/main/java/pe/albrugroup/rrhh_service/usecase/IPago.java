package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.request.PageRequest;
import pe.albrugroup.rrhh_service.entity.request.pago.RegistrarPagoRequest;
import pe.albrugroup.rrhh_service.entity.response.PageResponse;
import pe.albrugroup.rrhh_service.entity.response.PagoResponse;

import java.time.LocalDate;
import java.util.List;

public interface IPago {

    PageResponse<PagoResponse> getPagos(Long idContrato, Long idEmpleado, LocalDate desde, LocalDate hasta,
                                        PageRequest pageRequest);

    PagoResponse registrarPago(Long idContrato, RegistrarPagoRequest nuevoPago, Long responsableId);
    void registrarPagos(List<Long> idContratos, List<RegistrarPagoRequest> nuevosPagos, Long responsableId);
}
