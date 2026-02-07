package pe.albrugroup.rrhh_service.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPagoRequest;
import pe.albrugroup.rrhh_service.entity.response.PagoResponse;
import pe.albrugroup.rrhh_service.usecase.IPago;

import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@Tag(name = "Pagos", description = "Gestion y registro de Pagos en contratos activos")
@RequestMapping("/pagos")
public class PagoController {

    private final IPago pagoService;

    @GetMapping("/{id}/contrato")
    public ResponseEntity<List<PagoResponse>>  listarPagosPorContrato(@PathVariable Long id) {
        return ResponseEntity.ok(pagoService.getPagosPorContrato(id));
    }
    @GetMapping("/{id}/empleado")
    public ResponseEntity<List<PagoResponse>>  listarPagosPorEmpleado(@PathVariable Long id) {
        return ResponseEntity.ok(pagoService.getPagosPorEmpleado(id));
    }
    @PostMapping("/{id}/pagar-contrato")
    public ResponseEntity<PagoResponse> registrarPago(@RequestBody RegistrarPagoRequest request,
                                                      @PathVariable @Positive Long id) {
        var pago = pagoService.registrarPago(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(pago);
    }
}
