package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoVenta;
import pe.albrugroup.lead_service.entity.request.LeadDatosPreventaRequest;
import pe.albrugroup.lead_service.entity.request.LeadDireccionRequest;
import pe.albrugroup.lead_service.entity.request.LeadOfertaComercialRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionVentaRequest;
import pe.albrugroup.lead_service.entity.request.LeadTomaVentaRequest;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.entity.response.LeadContextoLookupResponse;
import pe.albrugroup.lead_service.entity.response.LeadDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadResponse;
import pe.albrugroup.lead_service.entity.response.LeadVentaAgrupacionesResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.PlanResponse;
import pe.albrugroup.lead_service.service.EventoService;
import pe.albrugroup.lead_service.service.LeadService;

import java.time.LocalDate;
import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/venta")
public class VentaController {

    private final LeadService leadService;
    private final EventoService eventoService;

    // BackOffice
    // 1. Listar Leads que se encuentren en la etapa de Venta. Permite filtrar por numero de lead.
    @GetMapping @PreAuthorize("hasAuthority('READ_LEADS_VENTA')")
    public ResponseEntity<PageResponse<LeadResponse>> listarBandejaVenta(
            @RequestParam(required = false) String lead,
            @RequestParam(required = false) TipoGrupoVenta tipoGrupo,
            @RequestParam(required = false) List<String> valorGrupo,
            @RequestParam(required = false, defaultValue = "false") boolean sinValor,
            @RequestParam(required = false) Long idEquipo,
            @RequestParam(required = false) LocalDate fechaDesde,
            @RequestParam(required = false) LocalDate fechaHasta,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarBandejaVenta(
                lead, tipoGrupo, valorGrupo, sinValor, idEquipo, fechaDesde, fechaHasta, pageRequest
        );
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }
    @GetMapping("/agrupaciones") @PreAuthorize("hasAuthority('READ_LEADS_VENTA')")
    public ResponseEntity<LeadVentaAgrupacionesResponse> listarAgrupacionesBandejaVenta(
            @RequestParam(required = false) String lead,
            @RequestParam(required = false) Long idEquipo,
            @RequestParam(required = false) LocalDate fechaDesde,
            @RequestParam(required = false) LocalDate fechaHasta
    ) {
        var agrupaciones = leadService.listarAgrupacionesBandejaVenta(lead, idEquipo, fechaDesde, fechaHasta);
        return ResponseEntity.status(HttpStatus.OK).body(agrupaciones);
    }
    // 1.1. Buscar el contexto de un lead por numero: indica si esta en VENTA y disponible,
    //      o por que no se puede visualizar (otra etapa o tomado por otro asesor).
    @GetMapping("/lookup") @PreAuthorize("hasAuthority('READ_LEADS_VENTA')")
    public ResponseEntity<LeadContextoLookupResponse> buscarContextoLeadVenta(
            @RequestParam String lead
    ) {
        var response = leadService.buscarContextoLeadVenta(lead);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
    // 2. Listar los Leads PROGRAMADOS compartidos, ordenados por fecha y hora de programacion.
    @GetMapping("/programados/asignados") @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<PageResponse<LeadResponse>> listarLeadsVentaProgramadosAsignados(
            @RequestParam(required = false) Long idEquipo,
            @RequestParam(required = false) LocalDate fechaDesde,
            @RequestParam(required = false) LocalDate fechaHasta,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarLeadsVentaProgramadosAsignados(pageRequest, idEquipo, fechaDesde, fechaHasta);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }
    // 2.1. Listar rechazos de venta por fecha operativa, incluso si el lead retorno a PREVENTA.
    @GetMapping("/rechazados") @PreAuthorize("hasAuthority('READ_LEADS_VENTA')")
    public ResponseEntity<PageResponse<LeadResponse>> listarLeadsVentaRechazados(
            @RequestParam(required = false) LocalDate fechaDesde,
            @RequestParam(required = false) LocalDate fechaHasta,
            @RequestParam(required = false) Long idEquipo,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarLeadsVentaRechazados(fechaDesde, fechaHasta, pageRequest, idEquipo);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }

    @GetMapping("/subsanables") @PreAuthorize("hasAuthority('READ_LEADS_VENTA')")
    public ResponseEntity<PageResponse<LeadResponse>> listarLeadsVentaSubsanables(
            @RequestParam(required = false) LocalDate fechaDesde,
            @RequestParam(required = false) LocalDate fechaHasta,
            @RequestParam(required = false) Long idEquipo,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarLeadsVentaSubsanables(fechaDesde, fechaHasta, pageRequest, idEquipo);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }

    // 3. Asignarse el lead, ahora la diferencia seria que el mismo backoffice se asigna lead si mismo
    // Una vez un backoffice se haga responsable de un lead, otro no podra hacerlo durante esa etapa.
    @PatchMapping("/{idLead}/asignacion") @PreAuthorize("hasAuthority('ASSIGN_LEADS')")
    public ResponseEntity<Void> tomarLeadVenta(
            @PathVariable Long idLead,
            @RequestBody(required = false) LeadTomaVentaRequest request
    ) {
        leadService.tomarLeadVenta(
                idLead,
                request != null && Boolean.TRUE.equals(request.getConfirmarReasignacion())
        );
        return ResponseEntity.noContent().build();
    }
    @DeleteMapping("/{idLead}/asignacion") @PreAuthorize("hasAuthority('ASSIGN_LEADS')")
    public ResponseEntity<Void> liberarAsignacionVenta(@PathVariable Long idLead) {
        leadService.liberarAsignacionVenta(idLead);
        return ResponseEntity.noContent().build();
    }
    // 4. Registrar evento de contacto con el Lead
    @PatchMapping("/{idLead}/contacto") @PreAuthorize("hasAuthority('CONTACT_LEADS')")
    public ResponseEntity<Void> registrarContactoLeadVenta(@PathVariable Long idLead) {
        leadService.registrarContactoVenta(idLead);
        return ResponseEntity.noContent().build();
    }
    // 5. Ver detalle del Lead
    @GetMapping("/{idLead}/detalle-asesor") @PreAuthorize("hasAuthority('READ_LEADS_VENTA')")
    public ResponseEntity<LeadDetalleResponse> obtenerDetalleLeadVenta(@PathVariable Long idLead) {
        var lead = leadService.obtenerDetalleLeadAsignado(idLead, Etapa.VENTA);
        return ResponseEntity.status(HttpStatus.OK).body(lead);
    }
    // 5.1. Planes comerciales del proveedor operativo del lead abierto.
    @GetMapping("/{idLead}/planes-oferta") @PreAuthorize("hasAuthority('READ_LEADS_VENTA')")
    public ResponseEntity<List<PlanResponse>> listarPlanesOfertaVenta(@PathVariable Long idLead) {
        return ResponseEntity.ok(leadService.listarPlanesOfertaVenta(idLead));
    }
    // 6. Ver el historial de eventos de un Lead, esto solo se permitira para el asesor asignado
    @GetMapping("/{idLead}/eventos") @PreAuthorize("hasAuthority('READ_EVENTOS_LEADS')")
    public ResponseEntity<PageResponse<EventoResponse>> listarEventosLeadVenta(
            @PathVariable Long idLead,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var eventos = eventoService.listarPorLeadAsignado(idLead, Etapa.VENTA, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(eventos);
    }
    // 7. Editar Lead. El Backoffice, solo puede actualizar la OfertaComercial 1 sola vez.
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
    // 8. Tipificar Leads, cualquier tipi que cambie de etapa limpia el Lead
    @PatchMapping("/{idLead}/tipificacion") @PreAuthorize("hasAuthority('TYPIFY_LEADS')")
    public ResponseEntity<Void> tipificarLeadVenta(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadTipificacionVentaRequest request
    ) {
        leadService.tipificarLeadVenta(idLead, request);
        return ResponseEntity.noContent().build();
    }
}
