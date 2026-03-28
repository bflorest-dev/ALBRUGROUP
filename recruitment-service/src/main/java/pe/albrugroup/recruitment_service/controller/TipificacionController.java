package pe.albrugroup.recruitment_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.request.CatalogoEstadoRequest;
import pe.albrugroup.recruitment_service.entity.request.CatalogoTipificacionRequest;
import pe.albrugroup.recruitment_service.entity.request.SubtipificacionRequest;
import pe.albrugroup.recruitment_service.entity.response.CatalogoTipificacionResponse;
import pe.albrugroup.recruitment_service.entity.response.SubtipificacionResponse;
import pe.albrugroup.recruitment_service.service.TipificacionService;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/tipificaciones")
public class TipificacionController {

    private final TipificacionService tipificacionService;

    @GetMapping("/{etapa}/catalogo")
    @PreAuthorize("hasAuthority('READ_TIPIFICACIONES')")
    public ResponseEntity<CatalogoTipificacionResponse> getCatalogo(
            @PathVariable Etapa etapa,
            @RequestParam(required = false) PuestoObjetivo puestoObjetivo
    ) {
        return ResponseEntity.ok(tipificacionService.getCatalogoPorEtapa(etapa, puestoObjetivo));
    }

    @PostMapping("/catalogo")
    @PreAuthorize("hasAuthority('UPDATE_TIPIFICACIONES')")
    public ResponseEntity<CatalogoTipificacionResponse> crearCatalogo(
            @Valid @RequestBody CatalogoTipificacionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tipificacionService.crearCatalogo(request));
    }

    @PatchMapping("/estado")
    @PreAuthorize("hasAuthority('UPDATE_TIPIFICACIONES')")
    public ResponseEntity<CatalogoTipificacionResponse> actualizarEstadoCatalogo(
            @Valid @RequestBody CatalogoEstadoRequest request
    ) {
        return ResponseEntity.ok(tipificacionService.actualizarEstadoCatalogo(request));
    }

    @PostMapping("/{idTipificacion}/subtipificaciones")
    @PreAuthorize("hasAuthority('UPDATE_TIPIFICACIONES')")
    public ResponseEntity<SubtipificacionResponse> crearSubtipificacion(
            @PathVariable @Positive Long idTipificacion,
            @Valid @RequestBody SubtipificacionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tipificacionService.crearSubtipificacion(idTipificacion, request));
    }
}
