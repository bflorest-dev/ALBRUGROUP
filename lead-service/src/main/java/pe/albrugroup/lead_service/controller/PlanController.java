package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.lead_service.entity.request.AdicionalRequest;
import pe.albrugroup.lead_service.entity.request.PlanRequest;
import pe.albrugroup.lead_service.entity.request.PlanUpdateRequest;
import pe.albrugroup.lead_service.entity.response.AdicionalResponse;
import pe.albrugroup.lead_service.entity.response.PlanResponse;
import pe.albrugroup.lead_service.entity.response.ServiciosProveedorResponse;
import pe.albrugroup.lead_service.service.CatalogoEquipoService;
import pe.albrugroup.lead_service.service.PlanService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/planes")
public class PlanController {

    private final PlanService service;
    private final CatalogoEquipoService catalogoEquipoService;
    
    @PostMapping("/adicionales") @PreAuthorize("hasAuthority('CREATE_ADICIONALES')")
    public ResponseEntity<AdicionalResponse> registrarAdicional(@Valid @RequestBody AdicionalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrarAdicional(request));
    }

    @PostMapping @PreAuthorize("hasAuthority('CREATE_PLANES')")
    public ResponseEntity<PlanResponse> registrarPlan(@Valid @RequestBody PlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrarPlan(request));
    }

    @GetMapping @PreAuthorize("hasAuthority('READ_PLANES')")
    public ResponseEntity<List<PlanResponse>> listarPlanes(
            @RequestParam(required = false) Long idProveedor,
            @RequestParam(defaultValue = "false") boolean soloVigentes
    ) {
        return ResponseEntity.ok(catalogoEquipoService.listarPlanesVisibles(idProveedor, soloVigentes));
    }

    @GetMapping("/adicionales") @PreAuthorize("hasAuthority('READ_ADICIONALES')")
    public ResponseEntity<List<AdicionalResponse>> listarAdicionales(@RequestParam Long idProveedor) {
        return ResponseEntity.ok(service.listarAdicionales(idProveedor));
    }

    @GetMapping("/servicios") @PreAuthorize("hasAuthority('READ_PLANES')")
    public ResponseEntity<ServiciosProveedorResponse> listarServicios(@RequestParam Long idProveedor) {
        return ResponseEntity.ok(service.listarServicios(idProveedor));
    }

    @PutMapping("/{idPlan}") @PreAuthorize("hasAuthority('UPDATE_PLANES')")
    public ResponseEntity<PlanResponse> actualizarPlan(
            @PathVariable Long idPlan,
            @Valid @RequestBody PlanUpdateRequest request
    ) {
        return ResponseEntity.ok(service.actualizarPlan(idPlan, request));
    }

    @DeleteMapping("/{idPlan}") @PreAuthorize("hasAuthority('DELETE_PLANES')")
    public ResponseEntity<PlanResponse> desactivarPlan(@PathVariable Long idPlan) {
        return ResponseEntity.ok(service.desactivarPlan(idPlan));
    }
}
