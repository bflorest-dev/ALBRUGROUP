package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.CerrarPeriodoFacturacionRequest;
import pe.albrugroup.lead_service.entity.request.PeriodoFacturacionFacturaRequest;
import pe.albrugroup.lead_service.entity.response.PeriodoFacturacionPostventaResponse;
import pe.albrugroup.lead_service.service.FacturacionPostventaService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/postventa")
public class PostventaFacturacionController {

    private final FacturacionPostventaService facturacionPostventaService;

    @GetMapping("/leads/{idLead}/periodos") @PreAuthorize("hasAuthority('READ_POSTVENTA_FACTURACION')")
    public ResponseEntity<List<PeriodoFacturacionPostventaResponse>> listarPeriodosPorLead(
            @PathVariable Long idLead
    ) {
        var periodos = facturacionPostventaService.listarPeriodosPorLead(idLead);
        return ResponseEntity.status(HttpStatus.OK).body(periodos);
    }

    @GetMapping("/periodos/{idPeriodo}") @PreAuthorize("hasAuthority('READ_POSTVENTA_FACTURACION')")
    public ResponseEntity<PeriodoFacturacionPostventaResponse> obtenerPeriodo(
            @PathVariable Long idPeriodo
    ) {
        var periodo = facturacionPostventaService.obtenerPeriodo(idPeriodo);
        return ResponseEntity.status(HttpStatus.OK).body(periodo);
    }

    @PatchMapping("/periodos/{idPeriodo}/factura") @PreAuthorize("hasAuthority('UPDATE_POSTVENTA_FACTURACION')")
    public ResponseEntity<PeriodoFacturacionPostventaResponse> confirmarFactura(
            @PathVariable Long idPeriodo,
            @Valid @RequestBody PeriodoFacturacionFacturaRequest request
    ) {
        var periodo = facturacionPostventaService.confirmarFactura(idPeriodo, request);
        return ResponseEntity.status(HttpStatus.OK).body(periodo);
    }

    @PatchMapping("/periodos/{idPeriodo}/cierre") @PreAuthorize("hasAuthority('UPDATE_POSTVENTA_FACTURACION')")
    public ResponseEntity<PeriodoFacturacionPostventaResponse> cerrarPeriodo(
            @PathVariable Long idPeriodo,
            @Valid @RequestBody CerrarPeriodoFacturacionRequest request
    ) {
        var periodo = facturacionPostventaService.cerrarPeriodo(idPeriodo, request);
        return ResponseEntity.status(HttpStatus.OK).body(periodo);
    }
}
