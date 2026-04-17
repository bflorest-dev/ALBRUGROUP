package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.LeadAsignacionRequest;
import pe.albrugroup.lead_service.entity.request.LeadDatosPreventaRequest;
import pe.albrugroup.lead_service.entity.request.LeadDireccionRequest;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRequest;
import pe.albrugroup.lead_service.entity.request.LeadOfertaComercialRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionRequest;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse;
import pe.albrugroup.lead_service.entity.response.LeadAsesorDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadAsesorVentasResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.SupervisorVentasResumenResponse;
import pe.albrugroup.lead_service.service.LeadService;

import java.time.LocalDate;
import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/leads")
public class LeadController {

    private final LeadService leadService;

    @PostMapping("/intake") @PreAuthorize("hasAuthority('CREATE_LEADS')")
    public ResponseEntity<Void> registrarIngresoLead(@Valid @RequestBody LeadIntakeRequest request) {
        leadService.registrarIngresoLead(request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{idLead}/asignacion") @PreAuthorize("hasAuthority('ASSIGN_LEADS')")
    public ResponseEntity<Void> asignarLead(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadAsignacionRequest request
    ) {
        leadService.asignarLead(idLead, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/asesor-ventas") @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<PageResponse<LeadAsesorVentasResponse>> listarBandejaAsesorVentas(
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarBandejaAsesorVentas(pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }

    @GetMapping("/supervisor-ventas/resumen") @PreAuthorize("hasAuthority('READ_LEADS_SUPERVISOR_VENTAS_RESUMEN')")
    public ResponseEntity<List<SupervisorVentasResumenResponse>> listarResumenSupervisorVentas(
            @RequestParam(required = false) List<Long> idsAsesor
    ) {
        var resumen = leadService.listarResumenSupervisorVentas(idsAsesor);
        return ResponseEntity.status(HttpStatus.OK).body(resumen);
    }

    @GetMapping("/supervisor-ventas/asesor/{idAsesor}/bandeja") @PreAuthorize("hasAuthority('READ_LEADS_SUPERVISOR_VENTAS_BANDEJA')")
    public ResponseEntity<PageResponse<LeadAsesorVentasResponse>> listarBandejaSupervisorVentas(
            @PathVariable Long idAsesor,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarBandejaAsesorVentas(idAsesor, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }

    @GetMapping("/{idLead}/detalle-asesor") @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<LeadAsesorDetalleResponse> obtenerDetalleAsesor(@PathVariable Long idLead) {
        var lead = leadService.obtenerDetalleAsesor(idLead);
        return ResponseEntity.status(HttpStatus.OK).body(lead);
    }

    @PatchMapping("/{idLead}/datos-preventa") @PreAuthorize("hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<Void> actualizarDatosPreventa(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadDatosPreventaRequest request
    ) {
        leadService.actualizarDatosPreventa(idLead, request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{idLead}/direccion") @PreAuthorize("hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<Void> actualizarDireccion(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadDireccionRequest request
    ) {
        leadService.actualizarDireccion(idLead, request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{idLead}/oferta-comercial") @PreAuthorize("hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<Void> actualizarOfertaComercial(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadOfertaComercialRequest request
    ) {
        leadService.actualizarOfertaComercial(idLead, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{idLead}/tipificacion") @PreAuthorize("hasAuthority('TYPIFY_LEADS')")
    public ResponseEntity<Void> tipificarLead(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadTipificacionRequest request
    ) {
        leadService.tipificarLead(idLead, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{idLead}/contacto") @PreAuthorize("hasAuthority('CONTACT_LEADS')")
    public ResponseEntity<Void> registrarContactoLead(@PathVariable Long idLead) {
        leadService.registrarContacto(idLead);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/gtr") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<PageResponse<LeadGtrResponse>> listarBandejaGtr(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarBandejaGtr(fecha, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }

    @GetMapping("/gtr/agendados") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<PageResponse<LeadAgendadoGtrResponse>> listarAgendadosGtr(
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarAgendadosGtr(pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }
}
