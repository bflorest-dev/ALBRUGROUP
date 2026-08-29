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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.request.LeadCorreccionRequest;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.entity.response.LeadCorreccionBusquedaResponse;
import pe.albrugroup.lead_service.entity.response.LeadDetalleResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.service.CorreccionAdminService;

import java.time.LocalDate;
import java.util.List;

/**
 * Tab de correccion integral de leads. Exclusiva del ADMIN: todos los metodos exigen el permiso
 * {@code CORREGIR_LEAD_ADMIN}, que la migracion V24 de auth-service concede solo a ADMINISTRADOR.
 */
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/correcciones-admin")
public class CorreccionAdminController {

    private final CorreccionAdminService correccionAdminService;

    @GetMapping("/buscar")
    @PreAuthorize("hasAuthority('CORREGIR_LEAD_ADMIN')")
    public ResponseEntity<List<LeadCorreccionBusquedaResponse>> buscar(@RequestParam(required = false) String buscar) {
        return ResponseEntity.ok(correccionAdminService.buscar(buscar));
    }

    @GetMapping("/{idLead}/detalle")
    @PreAuthorize("hasAuthority('CORREGIR_LEAD_ADMIN')")
    public ResponseEntity<LeadDetalleResponse> obtenerDetalle(@PathVariable Long idLead) {
        return ResponseEntity.ok(correccionAdminService.obtenerDetalle(idLead));
    }

    @GetMapping("/{idLead}/historial")
    @PreAuthorize("hasAuthority('CORREGIR_LEAD_ADMIN')")
    public ResponseEntity<PageResponse<EventoResponse>> listarHistorial(
            @PathVariable Long idLead,
            @RequestParam(required = false) Accion accion,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        return ResponseEntity.ok(
                correccionAdminService.listarHistorial(idLead, accion, fechaDesde, fechaHasta, pageRequest));
    }

    @PostMapping("/{idLead}/aplicar")
    @PreAuthorize("hasAuthority('CORREGIR_LEAD_ADMIN')")
    public ResponseEntity<LeadDetalleResponse> aplicarCorreccion(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadCorreccionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(correccionAdminService.aplicarCorreccion(idLead, request));
    }
}
