package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadDatosPreventaRequest;
import pe.albrugroup.lead_service.entity.request.LeadDireccionRequest;
import pe.albrugroup.lead_service.entity.request.LeadOfertaComercialRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionRequest;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.entity.response.LeadDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.service.EventoService;
import pe.albrugroup.lead_service.service.LeadService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/venta")
public class VentaController {

    private final LeadService leadService;
    private final EventoService eventoService;

    // BackOffice
    // 1. Listar Leads que se encuentren en la etapa de Venta
    @GetMapping @PreAuthorize("hasAuthority('READ_LEADS_VENTA')")
    public ResponseEntity<PageResponse<LeadResponse>> listarBandejaVenta(
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarBandejaVenta(pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }
    // 2. Asignarse el lead, ahora la diferencia seria que el mismo backoffice se asigna lead si mismo
    // Una vez un backoffice se haga responsable de un lead, otro no podra hacerlo durante esa etapa.
    @PatchMapping("/{idLead}/asignacion") @PreAuthorize("hasAuthority('ASSIGN_LEADS')")
    public ResponseEntity<Void> tomarLeadVenta(@PathVariable Long idLead) {
        leadService.tomarLeadDisponible(idLead, Etapa.VENTA);
        return ResponseEntity.noContent().build();
    }
    // 3. Registrar evento de contacto con el Lead
    @PatchMapping("/{idLead}/contacto") @PreAuthorize("hasAuthority('CONTACT_LEADS')")
    public ResponseEntity<Void> registrarContactoLeadVenta(@PathVariable Long idLead) {
        leadService.registrarContactoVenta(idLead);
        return ResponseEntity.noContent().build();
    }
    // 4. Ver detalle del Lead similar al endpoint
    @GetMapping("/{idLead}/detalle-asesor") @PreAuthorize("hasAuthority('READ_LEADS_VENTA')")
    public ResponseEntity<LeadDetalleResponse> obtenerDetalleLeadVenta(@PathVariable Long idLead) {
        var lead = leadService.obtenerDetalleLeadAsignado(idLead, Etapa.VENTA);
        return ResponseEntity.status(HttpStatus.OK).body(lead);
    }
    // 5. Ver el historial de eventos de un Lead, esto solo se permitira para el asesor asignado
    @GetMapping("/{idLead}/eventos") @PreAuthorize("hasAuthority('READ_EVENTOS_LEADS')")
    public ResponseEntity<PageResponse<EventoResponse>> listarEventosLeadVenta(
            @PathVariable Long idLead,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var eventos = eventoService.listarPorLeadAsignado(idLead, Etapa.VENTA, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(eventos);
    }
    // 6. Editar Lead. El Backoffice, solo puede actualizar la OfertaComercial 1 sola vez.
    @PatchMapping("/{idLead}/datos-preventa") @PreAuthorize("hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<Void> actualizarDatosPreventaVenta(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadDatosPreventaRequest request
    ) {
        leadService.actualizarDatosPreventaVenta(idLead, request);
        return ResponseEntity.noContent().build();
    }
    @PatchMapping("/{idLead}/direccion") @PreAuthorize("hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<Void> actualizarDireccionVenta(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadDireccionRequest request
    ) {
        leadService.actualizarDireccionVenta(idLead, request);
        return ResponseEntity.noContent().build();
    }
    @PatchMapping("/{idLead}/oferta-comercial") @PreAuthorize("hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<Void> actualizarOfertaComercialVenta(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadOfertaComercialRequest request
    ) {
        leadService.actualizarOfertaComercialVenta(idLead, request);
        return ResponseEntity.noContent().build();
    }
    // 7. Tipificar Leads, cualquier tipi que cambie de etapa limpia el Lead
    @PatchMapping("/{idLead}/tipificacion") @PreAuthorize("hasAuthority('TYPIFY_LEADS')")
    public ResponseEntity<Void> tipificarLeadVenta(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadTipificacionRequest request
    ) {
        leadService.tipificarLeadVenta(idLead, request);
        return ResponseEntity.noContent().build();
    }
}
