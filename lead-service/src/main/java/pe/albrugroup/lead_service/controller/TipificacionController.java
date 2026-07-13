package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.CatalogoEstadoRequest;
import pe.albrugroup.lead_service.entity.request.CatalogoRequest;
import pe.albrugroup.lead_service.entity.request.ClonarMatrizRequest;
import pe.albrugroup.lead_service.entity.request.MatrizCatalogoRequest;
import pe.albrugroup.lead_service.entity.response.CatalogoResponse;
import pe.albrugroup.lead_service.service.LeadService;
import pe.albrugroup.lead_service.service.TipificacionService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/tipificaciones")
public class TipificacionController {

    private final TipificacionService service;
    private final LeadService leadService;

    // ADMIN: catálogo de una etapa para un equipo concreto (selector de equipo en la tab TIPIFICACIONES).
    @GetMapping("/{etapa}/catalogo") @PreAuthorize("@tipificacionPermissionEvaluator.canRead(authentication, #etapa)")
    public ResponseEntity<CatalogoResponse> getCatalogo(
            @PathVariable Etapa etapa,
            @RequestParam Long idEquipo
    ) {
        return ResponseEntity.ok(service.getCatalogo(etapa, idEquipo));
    }

    // ASESOR: catálogo que aplica a un lead concreto. El backend resuelve el equipo desde el lead (el
    // usuario puede estar en varios equipos), garantizando que se muestre la misma matriz que se usará
    // al tipificar. Fail-closed: si el equipo del lead no tiene matriz, el catálogo viene vacío.
    @GetMapping("/lead/{idLead}/{etapa}/catalogo")
    @PreAuthorize("@tipificacionPermissionEvaluator.canRead(authentication, #etapa)")
    public ResponseEntity<CatalogoResponse> getCatalogoPorLead(
            @PathVariable Long idLead,
            @PathVariable Etapa etapa
    ) {
        return ResponseEntity.ok(leadService.getCatalogoTipificacionesPorLead(idLead, etapa));
    }

    // SUPERVISOR (bandeja diaria/ranking/histórico GTR): catálogo AGREGADO cross-equipo (unión por código)
    // para paletas de color y dropdowns de filtro. No resuelve la matriz de un lead.
    @GetMapping("/{etapa}/catalogo-agregado") @PreAuthorize("@tipificacionPermissionEvaluator.canRead(authentication, #etapa)")
    public ResponseEntity<CatalogoResponse> getCatalogoAgregado(@PathVariable Etapa etapa) {
        return ResponseEntity.ok(service.getCatalogoAgregado(etapa));
    }

    @PutMapping("/catalogo") @PreAuthorize("hasAuthority('UPDATE_TIPIFICACIONES')")
    public ResponseEntity<CatalogoResponse> upsertCatalogo(@Valid @RequestBody CatalogoRequest request) {
        var catalogo = service.upsertCatalogo(request);
        return ResponseEntity.ok(catalogo);
    }

    @PatchMapping("/catalogo/estado") @PreAuthorize("hasAuthority('UPDATE_TIPIFICACIONES')")
    public ResponseEntity<CatalogoResponse> actualizarEstadoCatalogo(@Valid @RequestBody CatalogoEstadoRequest request) {
        var catalogo = service.actualizarEstadoCatalogo(request);
        return ResponseEntity.ok(catalogo);
    }

    @PutMapping("/catalogo/matriz") @PreAuthorize("hasAuthority('UPDATE_TIPIFICACIONES')")
    public ResponseEntity<CatalogoResponse> guardarMatrizCatalogo(@Valid @RequestBody MatrizCatalogoRequest request) {
        return ResponseEntity.ok(service.guardarMatrizCatalogo(request));
    }

    // Clona la matriz de una etapa desde un equipo origen a un equipo destino (alta de equipo nuevo o
    // dejar un equipo igual a otro).
    @PostMapping("/catalogo/clonar") @PreAuthorize("hasAuthority('UPDATE_TIPIFICACIONES')")
    public ResponseEntity<CatalogoResponse> clonarMatriz(@Valid @RequestBody ClonarMatrizRequest request) {
        return ResponseEntity.ok(service.clonarMatriz(
                request.getEtapa(), request.getIdEquipoOrigen(), request.getIdEquipoDestino()));
    }
}
