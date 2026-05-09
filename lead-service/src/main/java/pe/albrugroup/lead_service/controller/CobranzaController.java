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
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.entity.response.LeadDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadPostventaResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.service.EventoService;
import pe.albrugroup.lead_service.service.LeadService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/cobranza")
public class CobranzaController {

    private final LeadService leadService;
    private final EventoService eventoService;

    @GetMapping @PreAuthorize("hasAuthority('READ_LEADS_COBRANZA')")
    public ResponseEntity<PageResponse<LeadPostventaResponse>> listarBandejaCobranza(
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarBandejaCobranza(pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }

    @GetMapping("/asignados") @PreAuthorize("hasAuthority('READ_LEADS_COBRANZA')")
    public ResponseEntity<PageResponse<LeadPostventaResponse>> listarLeadsCobranzaAsignados(
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarLeadsCobranzaAsignados(pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }

    @PatchMapping("/{idLead}/asignacion") @PreAuthorize("hasAuthority('ASSIGN_LEADS')")
    public ResponseEntity<Void> tomarLeadCobranza(@PathVariable Long idLead) {
        leadService.tomarLeadDisponible(idLead, Etapa.COBRANZA);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{idLead}/contacto") @PreAuthorize("hasAuthority('CONTACT_LEADS')")
    public ResponseEntity<Void> registrarContactoLeadCobranza(@PathVariable Long idLead) {
        leadService.registrarContactoCobranza(idLead);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{idLead}/detalle-asesor") @PreAuthorize("hasAuthority('READ_LEADS_COBRANZA')")
    public ResponseEntity<LeadDetalleResponse> obtenerDetalleLeadCobranza(@PathVariable Long idLead) {
        var lead = leadService.obtenerDetalleLeadAsignado(idLead, Etapa.COBRANZA);
        return ResponseEntity.status(HttpStatus.OK).body(lead);
    }

    @GetMapping("/{idLead}/eventos") @PreAuthorize("hasAuthority('READ_EVENTOS_LEADS')")
    public ResponseEntity<PageResponse<EventoResponse>> listarEventosLeadCobranza(
            @PathVariable Long idLead,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var eventos = eventoService.listarPorLeadAsignado(idLead, Etapa.COBRANZA, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(eventos);
    }

    @PatchMapping("/{idLead}/tipificacion") @PreAuthorize("hasAuthority('TYPIFY_LEADS')")
    public ResponseEntity<Void> tipificarLeadCobranza(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadTipificacionPostventaRequest request
    ) {
        leadService.tipificarLeadCobranza(idLead, request);
        return ResponseEntity.noContent().build();
    }
}
