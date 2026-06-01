package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import pe.albrugroup.lead_service.entity.request.*;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.*;
import pe.albrugroup.lead_service.service.LeadExcelIntakeService;
import pe.albrugroup.lead_service.service.LeadService;

import java.time.LocalDate;
import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/preventa")
public class PreventaController {

    private final LeadService  leadService;
    private final LeadExcelIntakeService leadExcelIntakeService;

    //GTR

    // 1. Registrar un Lead, independientemente si es nuevo o ya esté registrado
    @PostMapping("/intake") @PreAuthorize("hasAuthority('CREATE_LEADS')")
    public ResponseEntity<Void> registrarIngresoLead(@Valid @RequestBody LeadIntakeRequest request) {
        leadService.registrarIngresoLead(request);
        return ResponseEntity.noContent().build();
    }
    // 1.1. Enriqueser un Lead solo con la información puntual que podria detectar si el Lead es válido para seguir en el proceso de recopilar información
    @PostMapping(value = "/intake-masivo/excel", consumes = "multipart/form-data") @PreAuthorize("hasAuthority('CREATE_LEADS')")
    public ResponseEntity<LeadIntakeMasivoExcelResponse> registrarIngresoLeadsExcel(
            @RequestPart("file") MultipartFile file
    ) {
        var response = leadExcelIntakeService.registrarDesdeExcel(file);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
    @PatchMapping("/{idLead}/snapshots") @PreAuthorize("hasAuthority('CREATE_LEADS')")
    public ResponseEntity<Void> actualizarSnapshotsLead(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadSnapshotsRequest request
    ) {
        leadService.actualizarSnapshotsLead(idLead, request);
        return ResponseEntity.noContent().build();
    }
    // 2. Listar los Leads registrados y para gestionar Leads del día
    @GetMapping("/gtr") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<PageResponse<LeadGtrResponse>> listarBandejaGtr(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) String lead,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarBandejaGtr(fecha, lead, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }
    // 2.1. Metricas acumuladas del dia para la operacion GTR
    @GetMapping("/gtr/metricas") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<LeadGtrMetricasResponse> obtenerMetricasGtr(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        var metricas = leadService.obtenerMetricasGtr(fecha);
        return ResponseEntity.status(HttpStatus.OK).body(metricas);
    }
    // 2.2. Ranking de asesores para la vista GTR
    @GetMapping("/gtr/ranking") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<List<GtrRankingAsesorResponse>> listarRankingGtr(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "true") boolean soloActivos
    ) {
        var ranking = leadService.listarRankingGtr(desde, hasta, soloActivos);
        return ResponseEntity.ok(ranking);
    }

    // 2.3. Distribucion de tipificaciones por campana para la vista GTR
    @GetMapping("/gtr/tipificaciones-campana") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<List<GtrTipificacionCampanaResponse>> listarTipificacionesCampanaGtr(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "true") boolean soloActivos
    ) {
        var tipificaciones = leadService.listarTipificacionesCampanaGtr(desde, hasta, soloActivos);
        return ResponseEntity.ok(tipificaciones);
    }

    // 3. Asignar un Lead a un asesor de ventas
    @PatchMapping("/{idLead}/asignacion") @PreAuthorize("hasAuthority('ASSIGN_LEADS')")
    public ResponseEntity<Void> asignarLead(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadAsignacionRequest request
    ) {
        leadService.asignarLead(idLead, request);
        return ResponseEntity.noContent().build();
    }
    // 4. Asignar una seleccion multiple de Leads a un asesor de ventas
    @PatchMapping("/asignacion-masiva") @PreAuthorize("hasAuthority('ASSIGN_LEADS')")
    public ResponseEntity<LeadAsignacionMasivaResponse> asignarLeads(
            @Valid @RequestBody LeadAsignacionMasivaRequest request
    ) {
        var response = leadService.asignarLeads(request);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
    // 5. Listar los Leads tipificados como AGENDADOS para que puedan ser asignados nuevamente
    @GetMapping("/gtr/agendados") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<PageResponse<LeadAgendadoGtrResponse>> listarAgendadosGtr(
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarAgendadosGtr(pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }
    // GENERAL. Ver detalle de un Lead
    @GetMapping("/{idLead}/detalle-asesor") @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<LeadDetalleResponse> obtenerDetalleAsesor(@PathVariable Long idLead) {
        var lead = leadService.obtenerDetalleLeadAsignado(idLead, Etapa.PREVENTA);
        return ResponseEntity.status(HttpStatus.OK).body(lead);
    }

    // SUPERVISOR VENTAS

    // 1. Listar resumen de pre ventas gestionadas por asesor
    @GetMapping("/supervisor-ventas/resumen") @PreAuthorize("hasAuthority('READ_LEADS_SUPERVISOR_VENTAS_RESUMEN')")
    public ResponseEntity<List<SupervisorVentasResumenResponse>> listarResumenSupervisorVentas(
            @RequestParam(required = false) List<Long> idsAsesor
    ) {
        var resumen = leadService.listarResumenSupervisorVentas(idsAsesor);
        return ResponseEntity.status(HttpStatus.OK).body(resumen);
    }
    // 2. Listar bandeja de pre ventas de los asesores
    @GetMapping("/supervisor-ventas/asesor/{idAsesor}/bandeja") @PreAuthorize("hasAuthority('READ_LEADS_SUPERVISOR_VENTAS_BANDEJA')")
    public ResponseEntity<PageResponse<LeadAsesorVentasResponse>> listarBandejaSupervisorVentas(
            @PathVariable Long idAsesor,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarBandejaAsesorVentas(idAsesor, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }

    // ASESOR VENTAS

    // 1. Listar los Leads asignados al asesor en la etapa Preventa
    @GetMapping("/asesor-ventas") @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<PageResponse<LeadAsesorVentasResponse>> listarBandejaAsesorVentas(
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarBandejaAsesorVentas(pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }
    // 1.1. Marcar el Lead como EN_GESTION antes de abrir el flujo operativo
    @PatchMapping("/{idLead}/gestion") @PreAuthorize("hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<Void> iniciarGestionLead(@PathVariable Long idLead) {
        leadService.iniciarGestionPreventa(idLead);
        return ResponseEntity.noContent().build();
    }
    // 2. Registrar evento de contacto con el Lead
    @PostMapping("/{idLead}/contacto") @PreAuthorize("hasAuthority('CONTACT_LEADS')")
    public ResponseEntity<Void> registrarContactoLead(@PathVariable Long idLead) {
        leadService.registrarContacto(idLead);
        return ResponseEntity.noContent().build();
    }
    // GENERAL. Completar/Editar las distintas partes de un Lead para completar su información
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
    // GENERAL. Tipificar un Lead en PreVenta.
    @PostMapping("/{idLead}/tipificacion") @PreAuthorize("hasAuthority('TYPIFY_LEADS')")
    public ResponseEntity<Void> tipificarLead(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadTipificacionRequest request
    ) {
        leadService.tipificarLead(idLead, request);
        return ResponseEntity.noContent().build();
    }
}
