package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.lead_service.entity.request.AdicionalRequest;
import pe.albrugroup.lead_service.entity.request.PlanRequest;
import pe.albrugroup.lead_service.entity.request.PlanUpdateRequest;
import pe.albrugroup.lead_service.entity.response.AdicionalResponse;
import pe.albrugroup.lead_service.entity.response.PlanResponse;
import pe.albrugroup.lead_service.entity.response.ServiciosProveedorResponse;
import pe.albrugroup.lead_service.service.PlanService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/planes")
public class PlanController {

    private final PlanService service;
    
    @PostMapping("/adicionales")
    public ResponseEntity<AdicionalResponse> registrarAdicional(@Valid @RequestBody AdicionalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrarAdicional(request));
    }

    @PostMapping
    public ResponseEntity<PlanResponse> registrarPlan(@Valid @RequestBody PlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrarPlan(request));
    }

    @GetMapping
    public ResponseEntity<List<PlanResponse>> listarPlanes(
            @RequestParam(required = false) Long idProveedor,
            @RequestParam(defaultValue = "false") boolean soloVigentes
    ) {
        return ResponseEntity.ok(service.listarPlanes(idProveedor, soloVigentes));
    }

    @GetMapping("/adicionales")
    public ResponseEntity<List<AdicionalResponse>> listarAdicionales(@RequestParam Long idProveedor) {
        return ResponseEntity.ok(service.listarAdicionales(idProveedor));
    }

    @GetMapping("/servicios")
    public ResponseEntity<ServiciosProveedorResponse> listarServicios(@RequestParam Long idProveedor) {
        return ResponseEntity.ok(service.listarServicios(idProveedor));
    }

    @PutMapping("/{idPlan}")
    public ResponseEntity<PlanResponse> actualizarPlan(
            @PathVariable Long idPlan,
            @Valid @RequestBody PlanUpdateRequest request
    ) {
        return ResponseEntity.ok(service.actualizarPlan(idPlan, request));
    }

    @DeleteMapping("/{idPlan}")
    public ResponseEntity<PlanResponse> desactivarPlan(@PathVariable Long idPlan) {
        return ResponseEntity.ok(service.desactivarPlan(idPlan));
    }
}
