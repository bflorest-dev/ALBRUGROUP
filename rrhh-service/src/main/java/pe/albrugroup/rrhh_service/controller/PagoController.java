package pe.albrugroup.rrhh_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.rrhh_service.entity.request.PageRequest;
import pe.albrugroup.rrhh_service.entity.request.pago.RegistrarPagoRequest;
import pe.albrugroup.rrhh_service.entity.response.PageResponse;
import pe.albrugroup.rrhh_service.entity.response.PagoResponse;
import pe.albrugroup.rrhh_service.security.UserSession;
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
    @GetMapping @PreAuthorize("hasAuthority('CREATE_PAGOS')")
    public ResponseEntity<PageResponse<PagoResponse>> getPagos(
    @Parameter(description = "ID del contrato", example = "100")
            @RequestParam(required = false) @Positive Long contrato,
    @Parameter(description = "ID del empleado", example = "10")
            @RequestParam(required = false) @Positive Long empleado,
    @Parameter(description = "Fecha inicial del rango (formato: YYYY-MM-DD). Si no se especifica, no se aplica filtro de fecha inicial.", example = "2026-01-01")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
    @Parameter(description = "Fecha final del rango (formato: YYYY-MM-DD). Si no se especifica, no se aplica filtro de fecha final.", example = "2026-02-28")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @Valid @ModelAttribute PageRequest pageRequest)
    {
        return ResponseEntity.ok(
                pagoService.getPagos(contrato, empleado, desde, hasta, pageRequest)
        );
    }

    @Operation(summary = "Registrar pago",
            description = "Registra un pago asociado a un contrato. Si no se indican fechas, se toma el mes actual.")
    @PostMapping("/{id}/pagar-contrato") @PreAuthorize("hasAuthority('CREATE_PAGOS')")
    public ResponseEntity<PagoResponse> registrarPago(@RequestBody RegistrarPagoRequest request,
                                               @Parameter(description = "ID del contrato", example = "100")
                                                       @PathVariable @Positive Long id,
                                               @AuthenticationPrincipal UserSession user) {
        var pago = pagoService.registrarPago(id, request, user.empleadoId());
        return ResponseEntity.status(HttpStatus.CREATED).body(pago);
    }
}
