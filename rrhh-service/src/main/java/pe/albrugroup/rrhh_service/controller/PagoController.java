package pe.albrugroup.rrhh_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPagoRequest;
import pe.albrugroup.rrhh_service.entity.response.PagoResponse;
import pe.albrugroup.rrhh_service.usecase.IPago;

import java.time.LocalDate;
import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@Tag(name = "Pagos", description = "Gestion y registro de Pagos en contratos activos")
@RequestMapping("/pagos")
public class PagoController {

    private final IPago pagoService;

    @Operation(summary = "Listado de pagos",
        description = "Obtiene pagos filtrados por contrato, empleado y/o rango de fechas. Todos los parámetros son opcionales.")
    @GetMapping
    public ResponseEntity<List<PagoResponse>> getPagos(
    @Parameter(description = "ID del contrato", example = "100")
            @RequestParam(required = false) @Positive Long contrato,
    @Parameter(description = "ID del empleado", example = "10")
            @RequestParam(required = false) @Positive Long empleado,
    @Parameter(description = "Fecha inicial del rango (formato: YYYY-MM-DD). Si no se especifica, no se aplica filtro de fecha inicial.", example = "2026-01-01")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
    @Parameter(description = "Fecha final del rango (formato: YYYY-MM-DD). Si no se especifica, no se aplica filtro de fecha final.", example = "2026-02-28")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta)
    {
        return ResponseEntity.ok(pagoService.getPagos(contrato, empleado, desde, hasta));
    }

    @Operation(summary = "Registrar pago",
            description = "Registra un pago asociado a un contrato. Si no se indican fechas, se toma el mes actual.")
    @PostMapping("/{id}/pagar-contrato")
    public ResponseEntity<PagoResponse> registrarPago(@RequestBody RegistrarPagoRequest request,
                                              @Parameter(description = "ID del contrato", example = "100")
                                                      @PathVariable @Positive Long id) {
        var pago = pagoService.registrarPago(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(pago);
    }
}
