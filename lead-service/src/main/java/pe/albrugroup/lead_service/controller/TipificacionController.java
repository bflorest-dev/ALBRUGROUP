package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.CatalogoEstadoRequest;
import pe.albrugroup.lead_service.entity.request.CatalogoRequest;
import pe.albrugroup.lead_service.entity.request.MatrizCatalogoRequest;
import pe.albrugroup.lead_service.entity.response.CatalogoResponse;
import pe.albrugroup.lead_service.service.TipificacionService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/tipificaciones")
public class TipificacionController {

    private final TipificacionService service;

    @GetMapping("/{etapa}/catalogo") @PreAuthorize("@tipificacionPermissionEvaluator.canRead(authentication, #etapa)")
    public ResponseEntity<CatalogoResponse> getCatalogo(@PathVariable Etapa etapa) {
        var catalogo = service.getCatalogoPorEtapa(etapa);
        return ResponseEntity.ok(catalogo);
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
}
