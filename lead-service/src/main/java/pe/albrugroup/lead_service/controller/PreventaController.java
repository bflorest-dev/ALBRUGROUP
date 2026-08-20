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
import pe.albrugroup.lead_service.entity.enums.CampoTipificacion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.ModoConteo;
import pe.albrugroup.lead_service.entity.enums.OrdenRankingAsesor;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoGtr;
import pe.albrugroup.lead_service.entity.response.*;
import pe.albrugroup.lead_service.service.LeadCampanaCorreccionService;
import pe.albrugroup.lead_service.service.LeadExcelIntakeService;
import pe.albrugroup.lead_service.service.LeadMeritoCorreccionService;
import pe.albrugroup.lead_service.service.LeadService;

import java.time.LocalDate;
import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/preventa")
public class PreventaController {

    private final LeadService  leadService;
    private final LeadExcelIntakeService leadExcelIntakeService;
    private final LeadCampanaCorreccionService leadCampanaCorreccionService;
    private final LeadMeritoCorreccionService leadMeritoCorreccionService;

    //GTR

    // 1. Registrar un Lead, independientemente si es nuevo o ya esté registrado
    @PostMapping("/intake") @PreAuthorize("hasAuthority('CREATE_LEADS')")
    public ResponseEntity<Void> registrarIngresoLead(@Valid @RequestBody LeadIntakeRequest request) {
        leadService.registrarIngresoLead(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/correcciones/campana") @PreAuthorize("hasAuthority('CORREGIR_CAMPANA_LEAD')")
    public ResponseEntity<List<LeadCampanaCorreccionCandidatoResponse>> buscarCorreccionCampana(
            @RequestParam String lead
    ) {
        return ResponseEntity.ok(leadCampanaCorreccionService.buscarPorLead(lead));
    }

    @GetMapping("/correcciones/campana/{idLead}/campanas") @PreAuthorize("hasAuthority('CORREGIR_CAMPANA_LEAD')")
    public ResponseEntity<List<CampanaResponse>> listarCampanasCorreccionLead(@PathVariable Long idLead) {
        return ResponseEntity.ok(leadCampanaCorreccionService.listarCampanasCompatibles(idLead));
    }

    @PatchMapping("/correcciones/campana/{idLead}") @PreAuthorize("hasAuthority('CORREGIR_CAMPANA_LEAD')")
    public ResponseEntity<LeadCampanaCorreccionResponse> corregirCampanaLead(
            @PathVariable Long idLead,
            @RequestBody(required = false) LeadCampanaCorreccionRequest request
    ) {
        return ResponseEntity.ok(leadCampanaCorreccionService.corregirCampana(idLead, request));
    }

    @GetMapping("/correcciones/merito-preventa") @PreAuthorize("hasAuthority('CORREGIR_MERITO_PREVENTA')")
    public ResponseEntity<List<LeadMeritoCorreccionCandidatoResponse>> buscarCorreccionMeritoPreventa(
            @RequestParam String buscar
    ) {
        return ResponseEntity.ok(leadMeritoCorreccionService.buscar(buscar));
    }

    @PatchMapping("/correcciones/merito-preventa/{idLead}") @PreAuthorize("hasAuthority('CORREGIR_MERITO_PREVENTA')")
    public ResponseEntity<LeadMeritoCorreccionResponse> corregirMeritoPreventa(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadMeritoCorreccionRequest request
    ) {
        return ResponseEntity.ok(leadMeritoCorreccionService.corregirMerito(idLead, request));
    }

    @PostMapping("/intake/retroactivo") @PreAuthorize("hasAuthority('CREATE_LEADS')")
    public ResponseEntity<Void> registrarIngresoLeadRetroactivo(
            @Valid @RequestBody LeadIntakeRetroactivoRequest request
    ) {
        leadService.registrarIngresoLeadRetroactivo(request);
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
    @PatchMapping("/{idLead}/snapshots") @PreAuthorize("hasAnyAuthority('CREATE_LEADS','UPDATE_LEADS_ASESOR')")
    public ResponseEntity<Void> actualizarSnapshotsLead(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadSnapshotsRequest request
    ) {
        leadService.actualizarSnapshotsLead(idLead, request);
        return ResponseEntity.noContent().build();
    }
    // 2. Listar los Leads registrados y para gestionar Leads del día
    @PatchMapping("/{idLead}/identidad") @PreAuthorize("hasAnyAuthority('CREATE_LEADS','UPDATE_LEADS_ASESOR')")
    public ResponseEntity<Void> completarIdentidadLead(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadIdentidadRequest request
    ) {
        leadService.completarIdentidadLead(idLead, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{idLead}") @PreAuthorize("hasAuthority('DELETE_LEADS')")
    public ResponseEntity<Void> eliminarLeadIntegral(@PathVariable Long idLead) {
        leadService.eliminarLeadIntegral(idLead);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/gtr") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<PageResponse<LeadGtrResponse>> listarBandejaGtr(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) String lead,
            @RequestParam(required = false) TipoGrupoGtr tipoGrupo,
            @RequestParam(required = false) Long idGrupo,
            @RequestParam(required = false) EstadoSeguimiento estado,
            @RequestParam(required = false) String codigoTipificacion,
            @RequestParam(required = false) String codigoSubtipificacion,
            @RequestParam(defaultValue = "false") boolean sinValor,
            @RequestParam(required = false) Long idEquipo,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarBandejaGtr(
                fecha,
                lead,
                tipoGrupo,
                idGrupo,
                estado,
                codigoTipificacion,
                codigoSubtipificacion,
                sinValor,
                idEquipo,
                pageRequest
        );
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }
    @GetMapping("/gtr/agrupaciones") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<LeadGtrAgrupacionesResponse> listarAgrupacionesBandejaGtr(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long idEquipo
    ) {
        return ResponseEntity.ok(leadService.listarAgrupacionesBandejaGtr(fecha, idEquipo));
    }
    @GetMapping("/gtr/lookup") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<LeadGtrLookupResponse> buscarContextoLeadGtr(
            @RequestParam String lead
    ) {
        var response = leadService.buscarContextoLeadGtr(lead);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
    // 2.0.1. Leads pendientes agrupados por asesor (para detectar abandonados cuando se desconectan)
    @GetMapping("/gtr/leads-pendientes-asesor") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<List<AsesorLeadsPendientesResponse>> listarLeadsPendientesPorAsesor() {
        return ResponseEntity.status(HttpStatus.OK).body(leadService.listarLeadsPendientesPorAsesor());
    }
    // 2.1. Metricas acumuladas del dia para la operacion GTR
    @GetMapping("/gtr/metricas") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<LeadGtrMetricasResponse> obtenerMetricasGtr(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long idEquipo
    ) {
        var metricas = leadService.obtenerMetricasGtr(fecha, idEquipo);
        return ResponseEntity.status(HttpStatus.OK).body(metricas);
    }
    // 2.2. Ranking de asesores para la vista GTR
    @GetMapping("/gtr/ranking") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<List<GtrRankingAsesorResponse>> listarRankingGtr(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "true") boolean soloActivos,
            @RequestParam(required = false) Long idEquipo,
            @RequestParam(defaultValue = "GESTIONADOS") ModoConteo modo,
            @RequestParam(defaultValue = "PREVENTAS_PERIODO") OrdenRankingAsesor ordenarPor
    ) {
        var ranking = leadService.listarRankingGtr(desde, hasta, soloActivos, idEquipo, modo, ordenarPor);
        return ResponseEntity.ok(ranking);
    }

    // 2.3. Distribucion de tipificaciones por campana para la vista GTR
    @GetMapping("/gtr/tipificaciones-campana") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<List<GtrTipificacionCampanaResponse>> listarTipificacionesCampanaGtr(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "true") boolean soloActivos,
            @RequestParam(required = false) Long idEquipo
    ) {
        var tipificaciones = leadService.listarTipificacionesCampanaGtr(desde, hasta, soloActivos, idEquipo);
        return ResponseEntity.ok(tipificaciones);
    }

    @GetMapping("/gtr/tipificaciones") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<List<GtrTipificacionRankingResponse>> listarTipificacionesRankingGtr(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "true") boolean soloActivos,
            @RequestParam(required = false) Long idEquipo,
            @RequestParam(defaultValue = "GESTIONADOS") ModoConteo modo,
            @RequestParam(defaultValue = "MAYOR") CampoTipificacion campo
    ) {
        return ResponseEntity.ok(leadService.listarTipificacionesRankingGtr(desde, hasta, soloActivos, idEquipo, modo, campo));
    }

    @GetMapping("/gtr/tipificaciones/{codigoTipificacion}/subtipificaciones") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<List<GtrSubtipificacionRankingResponse>> listarSubtipificacionesRankingGtr(
            @PathVariable String codigoTipificacion,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "true") boolean soloActivos,
            @RequestParam(required = false) Long idEquipo,
            @RequestParam(defaultValue = "GESTIONADOS") ModoConteo modo,
            @RequestParam(defaultValue = "MAYOR") CampoTipificacion campo
    ) {
        return ResponseEntity.ok(leadService.listarSubtipificacionesRankingGtr(
                codigoTipificacion, desde, hasta, soloActivos, idEquipo, modo, campo));
    }

    @PostMapping("/gtr/{idLead}/tomar-gestion")
    @PreAuthorize("hasAuthority('READ_LEADS_GTR') and hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<Void> tomarGestionGtr(
            @PathVariable Long idLead,
            @RequestBody(required = false) LeadTomaGestionGtrRequest request
    ) {
        leadService.tomarGestionGtr(idLead, request == null ? new LeadTomaGestionGtrRequest() : request);
        return ResponseEntity.noContent().build();
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
            @RequestParam(required = false) Long idEquipo,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarAgendadosGtr(pageRequest, idEquipo);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }
    @GetMapping("/gtr/agendados/resumen") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<AgendadosGtrResumenResponse> obtenerResumenAgendadosGtr(
            @RequestParam(required = false) Long idEquipo
    ) {
        return ResponseEntity.ok(leadService.obtenerResumenAgendadosGtr(idEquipo));
    }
    // GENERAL. Ver detalle de un Lead
    @GetMapping("/{idLead}/detalle-asesor") @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<LeadDetalleResponse> obtenerDetalleAsesor(@PathVariable Long idLead) {
        var lead = leadService.obtenerDetalleLeadAsignado(idLead);
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
    // 1.1. Desde cuando cada asesor no tiene leads para gestionar
    @GetMapping("/supervisor-ventas/sin-leads-desde") @PreAuthorize("hasAuthority('READ_LEADS_SUPERVISOR_VENTAS_RESUMEN')")
    public ResponseEntity<List<AsesorSinLeadsResponse>> listarSinLeadsDesde(
            @RequestParam(required = false) List<Long> idsAsesor
    ) {
        return ResponseEntity.status(HttpStatus.OK).body(leadService.listarSinLeadsDesde(idsAsesor));
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
    // 1.1. Listar (read-only) las preventas que el asesor paso a VENTA, para seguimiento
    @GetMapping("/asesor-ventas/mis-preventas") @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<PageResponse<MisPreventaResponse>> listarMisPreventas(
            @Valid @ModelAttribute PageRequest pageRequest,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta
    ) {
        var leads = leadService.listarMisPreventas(pageRequest, fechaDesde, fechaHasta);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }
    @GetMapping("/asesor-ventas/mis-preventas/resumen") @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<MisPreventasResumenResponse> obtenerResumenMisPreventas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta
    ) {
        var resumen = leadService.obtenerResumenMisPreventas(fechaDesde, fechaHasta);
        return ResponseEntity.status(HttpStatus.OK).body(resumen);
    }
    @GetMapping("/asesor-ventas/mis-preventas/por-resumen") @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<PageResponse<MisPreventaResponse>> listarMisPreventasPorResumenEtapa(
            @Valid @ModelAttribute PageRequest pageRequest,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta
    ) {
        var leads = leadService.listarMisPreventasPorResumenEtapa(pageRequest, fechaDesde, fechaHasta);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }
    @GetMapping("/asesor-ventas/mis-preventas/por-resumen/resumen") @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<MisPreventasResumenResponse> obtenerResumenMisPreventasPorResumenEtapa(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta
    ) {
        var resumen = leadService.obtenerResumenMisPreventasPorResumenEtapa(fechaDesde, fechaHasta);
        return ResponseEntity.status(HttpStatus.OK).body(resumen);
    }
    // 1.2. Ver (read-only) el detalle actual de una preventa propia
    @GetMapping("/{idLead}/detalle-mi-preventa") @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<LeadDetalleResponse> obtenerDetalleMiPreventa(@PathVariable Long idLead) {
        var lead = leadService.obtenerDetalleMiPreventa(idLead);
        return ResponseEntity.status(HttpStatus.OK).body(lead);
    }
    // 1.3. Marcar el Lead como EN_GESTION antes de abrir el flujo operativo
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
    // MULTI-TITULAR. Crear otra oportunidad para el mismo contacto (otro titular/documento).
    @PostMapping("/{idLead}/oportunidad-adicional") @PreAuthorize("hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<Long> crearOportunidadAdicional(@PathVariable Long idLead) {
        return ResponseEntity.status(HttpStatus.CREATED).body(leadService.crearOportunidadAdicional(idLead));
    }
    // MULTI-TITULAR. Listar las oportunidades del contacto (para el selector del asesor y la lupa GTR).
    @GetMapping("/{idLead}/oportunidades-contacto")
    @PreAuthorize("hasAnyAuthority('READ_LEADS_ASESOR','READ_LEADS_GTR')")
    public ResponseEntity<List<OportunidadHermanaResponse>> listarOportunidadesDelContacto(@PathVariable Long idLead) {
        return ResponseEntity.ok(leadService.listarOportunidadesDelContacto(idLead));
    }
    // MULTI-TITULAR. Descartar una oportunidad creada por error (solo si está vacía).
    @DeleteMapping("/{idLead}/oportunidad") @PreAuthorize("hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<Void> descartarOportunidad(@PathVariable Long idLead) {
        leadService.descartarOportunidad(idLead);
        return ResponseEntity.noContent().build();
    }

    // ATENCIÓN GTR. Cerrar la atención de un lead que sigue en otra etapa sin tipificarlo (libera
    // al asesor para que el lead vuelva a estar disponible en su etapa, sin alterar su gestión).
    @PatchMapping("/{idLead}/atencion/cerrar") @PreAuthorize("hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<Void> cerrarAtencion(@PathVariable Long idLead) {
        leadService.cerrarAtencion(idLead);
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
