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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.CampoTipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.ModoConteo;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoGtr;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.entity.response.GestionPorCampanaCeldaResponse;
import pe.albrugroup.lead_service.entity.response.LeadDiarioResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionesResponse;
import pe.albrugroup.lead_service.entity.response.LeadsDiariosMetricasEquipoResponse;
import pe.albrugroup.lead_service.entity.response.LeadsDiariosMetricasResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.RegistroDiarioLeadResponse;
import pe.albrugroup.lead_service.service.EventoService;

import java.time.LocalDate;
import java.util.List;
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/eventos")
public class EventoController {

    private final EventoService eventoService;

    @GetMapping("/lead/{idLead}") @PreAuthorize("hasAuthority('READ_EVENTOS_LEADS')")
    public ResponseEntity<PageResponse<EventoResponse>> listarEventosPorLead(
            @PathVariable Long idLead,
            @RequestParam(required = false) Accion accion,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var eventos = eventoService.listarPorLead(idLead, accion, fechaDesde, fechaHasta, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(eventos);
    }

    @GetMapping("/registros-diarios") @PreAuthorize("hasAuthority('READ_LEADS_DIARIOS')")
    public ResponseEntity<PageResponse<LeadDiarioResponse>> listarRegistrosDiarios(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) TipoGrupoGtr tipoGrupo,
            @RequestParam(required = false) Long idGrupo,
            @RequestParam(required = false) String codigoTipificacion,
            @RequestParam(required = false) String codigoSubtipificacion,
            @RequestParam(required = false) String lead,
            @RequestParam(defaultValue = "false") boolean sinValor,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var registros = eventoService.listarRegistrosDiarios(
                fecha,
                tipoGrupo,
                idGrupo,
                codigoTipificacion,
                codigoSubtipificacion,
                lead,
                sinValor,
                pageRequest
        );
        return ResponseEntity.status(HttpStatus.OK).body(registros);
    }

    @GetMapping("/registros-diarios/lead/{idLead}") @PreAuthorize("hasAuthority('READ_LEADS_DIARIOS')")
    public ResponseEntity<List<RegistroDiarioLeadResponse>> listarRegistrosDiariosDeLead(
            @PathVariable Long idLead,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        return ResponseEntity.ok(eventoService.listarRegistrosDiariosDeLead(idLead, fecha));
    }

    @GetMapping("/registros-diarios/agrupaciones") @PreAuthorize("hasAuthority('READ_LEADS_DIARIOS')")
    public ResponseEntity<LeadGtrAgrupacionesResponse> listarAgrupacionesRegistrosDiarios(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) String lead
    ) {
        return ResponseEntity.ok(eventoService.listarAgrupacionesRegistrosDiarios(fecha, lead));
    }

    @GetMapping("/registros-diarios/metricas") @PreAuthorize("hasAuthority('READ_LEADS_DIARIOS')")
    public ResponseEntity<LeadsDiariosMetricasResponse> obtenerMetricasRegistrosDiarios(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        return ResponseEntity.ok(eventoService.obtenerMetricasRegistrosDiarios(fecha));
    }

    /**
     * `fecha` se mantiene por compatibilidad (la usan el DASHBOARD y "Leads del día") y equivale a
     * desde = hasta = fecha. Con los defaults la respuesta es idéntica a la versión previa.
     */
    @GetMapping("/registros-diarios/metricas-por-equipo") @PreAuthorize("hasAuthority('READ_LEADS_DIARIOS')")
    public ResponseEntity<List<LeadsDiariosMetricasEquipoResponse>> obtenerMetricasRegistrosDiariosPorEquipo(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "ULTIMA") CampoTipificacion campo
    ) {
        LocalDate desdeResuelto = desde != null ? desde : fecha;
        LocalDate hastaResuelto = hasta != null ? hasta : fecha;
        return ResponseEntity.ok(
                eventoService.obtenerMetricasRegistrosDiariosPorEquipo(desdeResuelto, hastaResuelto, campo));
    }

    @GetMapping("/metricas/gestion-por-campana") @PreAuthorize("hasAuthority('READ_LEADS_DIARIOS')")
    public ResponseEntity<List<GestionPorCampanaCeldaResponse>> obtenerGestionPorCampana(
            @RequestParam(defaultValue = "PREVENTA") Etapa etapa,
            @RequestParam(defaultValue = "MAYOR") CampoTipificacion campo,
            @RequestParam(defaultValue = "GESTIONADOS") ModoConteo modo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        return ResponseEntity.ok(eventoService.obtenerGestionPorCampana(etapa, campo, modo, desde, hasta));
    }

    @GetMapping("/empleado/{idEmpleado}") @PreAuthorize("hasAuthority('READ_EVENTOS_LEADS')")
    public ResponseEntity<PageResponse<EventoResponse>> listarEventosPorEmpleado(
            @PathVariable Long idEmpleado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var eventos = eventoService.listarPorEmpleado(idEmpleado, fechaDesde, fechaHasta, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(eventos);
    }
}
