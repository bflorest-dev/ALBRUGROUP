package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.request.PagoPostventaRequest;
import pe.albrugroup.lead_service.entity.request.PagoPostventaUpdateRequest;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.PagoPostventaResponse;
import pe.albrugroup.lead_service.service.PagoPostventaService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/postventa")
public class PostventaPagoController {

    private final PagoPostventaService pagoPostventaService;

    @PostMapping("/leads/{idLead}/pagos") @PreAuthorize("hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<PagoPostventaResponse> registrarPago(
            @PathVariable Long idLead,
            @Valid @RequestBody PagoPostventaRequest request
    ) {
        var pago = pagoPostventaService.registrarPago(idLead, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(pago);
    }

    @PatchMapping("/pagos/{idPago}") @PreAuthorize("hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<PagoPostventaResponse> actualizarPago(
            @PathVariable Long idPago,
            @Valid @RequestBody PagoPostventaUpdateRequest request
    ) {
        var pago = pagoPostventaService.actualizarPago(idPago, request);
        return ResponseEntity.status(HttpStatus.OK).body(pago);
    }

    @GetMapping("/leads/{idLead}/pagos") @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<PageResponse<PagoPostventaResponse>> listarPagosPorLead(
            @PathVariable Long idLead,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var pagos = pagoPostventaService.listarPagosPorLead(idLead, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(pagos);
    }

    @GetMapping("/periodos/{idPeriodoFacturacion}/pagos") @PreAuthorize("hasAuthority('READ_POSTVENTA_FACTURACION')")
    public ResponseEntity<PageResponse<PagoPostventaResponse>> listarPagosPorPeriodo(
            @PathVariable Long idPeriodoFacturacion,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var pagos = pagoPostventaService.listarPagosPorPeriodo(idPeriodoFacturacion, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(pagos);
    }
}
