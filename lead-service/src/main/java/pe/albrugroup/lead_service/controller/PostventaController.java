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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionPostventaRequest;
import pe.albrugroup.lead_service.entity.request.LeadTomaVentaRequest;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.entity.response.LeadDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadPostventaBandejaResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.service.EventoService;
import pe.albrugroup.lead_service.service.LeadService;
import pe.albrugroup.lead_service.service.PostventaBandejaService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/postventa")
public class PostventaController {

    private final LeadService leadService;
    private final EventoService eventoService;
    private final PostventaBandejaService postventaBandejaService;

    @GetMapping("/bandeja") @PreAuthorize("hasAuthority('READ_LEADS_POSTVENTA')")
    public ResponseEntity<PageResponse<LeadPostventaBandejaResponse>> listarBandejaOperativaPostventa(
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = postventaBandejaService.listarBandeja(pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }

    // Gestion compartida de POSTVENTA: al gestionar, el lead queda asignado a este asesor (lock
    // transitorio). Si otro asesor ya lo tiene en gestion, el 409 pide confirmar el relevo; al
    // tipificar el lead se libera de nuevo al pool (ver tipificarLeadPostventa). Mismo patron que VENTA.
    @PatchMapping("/{idLead}/asignacion") @PreAuthorize("hasAuthority('ASSIGN_LEADS')")
    public ResponseEntity<Void> tomarLeadPostventa(
            @PathVariable Long idLead,
            @RequestBody(required = false) LeadTomaVentaRequest request
    ) {
        leadService.tomarLeadPostventaGestion(
                idLead,
                request != null && Boolean.TRUE.equals(request.getConfirmarReasignacion())
        );
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{idLead}/contacto") @PreAuthorize("hasAuthority('CONTACT_LEADS')")
    public ResponseEntity<Void> registrarContactoLeadPostventa(@PathVariable Long idLead) {
        leadService.registrarContactoPostventa(idLead);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{idLead}/detalle-asesor") @PreAuthorize("hasAuthority('READ_LEADS_POSTVENTA')")
    public ResponseEntity<LeadDetalleResponse> obtenerDetalleLeadPostventa(@PathVariable Long idLead) {
        var lead = leadService.obtenerDetalleLeadAsignado(idLead, Etapa.POSTVENTA);
        return ResponseEntity.status(HttpStatus.OK).body(lead);
    }

    @GetMapping("/{idLead}/eventos") @PreAuthorize("hasAuthority('READ_EVENTOS_LEADS')")
    public ResponseEntity<PageResponse<EventoResponse>> listarEventosLeadPostventa(
            @PathVariable Long idLead,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var eventos = eventoService.listarPorLeadAsignado(idLead, Etapa.POSTVENTA, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(eventos);
    }

    @PatchMapping("/{idLead}/tipificacion") @PreAuthorize("hasAuthority('TYPIFY_LEADS')")
    public ResponseEntity<Void> tipificarLeadPostventa(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadTipificacionPostventaRequest request
    ) {
        leadService.tipificarLeadPostventa(idLead, request);
        return ResponseEntity.noContent().build();
    }

}
