package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.lead_service.entity.request.SubsanacionRequest;
import pe.albrugroup.lead_service.entity.response.SubsanacionLeadBusquedaResponse;
import pe.albrugroup.lead_service.entity.response.SubsanacionOpcionesResponse;
import pe.albrugroup.lead_service.entity.response.SubsanacionResponse;
import pe.albrugroup.lead_service.service.SubsanacionService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/subsanaciones")
@PreAuthorize("hasAuthority('SUBSANAR_LEAD_ADMIN')")
public class SubsanacionController {

    private final SubsanacionService subsanacionService;

    @GetMapping("/leads")
    public ResponseEntity<List<SubsanacionLeadBusquedaResponse>> buscarLeads(
            @RequestParam(required = false) String buscar
    ) {
        return ResponseEntity.ok(subsanacionService.buscarLeads(buscar));
    }

    @GetMapping("/opciones")
    public ResponseEntity<SubsanacionOpcionesResponse> obtenerOpciones(
            @RequestParam Long idEquipo,
            @RequestParam(required = false) Long idProveedor
    ) {
        return ResponseEntity.ok(subsanacionService.obtenerOpciones(idEquipo, idProveedor));
    }

    @PostMapping
    public ResponseEntity<SubsanacionResponse> subsanar(@Valid @RequestBody SubsanacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(subsanacionService.subsanar(request));
    }

    @GetMapping("/{idSubsanacion}")
    public ResponseEntity<SubsanacionResponse> obtener(@PathVariable Long idSubsanacion) {
        return ResponseEntity.ok(subsanacionService.obtener(idSubsanacion));
    }
}
