package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.lead_service.entity.request.FreelanceVentaCrearRequest;
import pe.albrugroup.lead_service.entity.request.FreelanceVentaReenvioRequest;
import pe.albrugroup.lead_service.entity.response.*;
import pe.albrugroup.lead_service.service.FreelanceService;

import java.time.LocalDate;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/freelance")
public class FreelanceController {

    private final FreelanceService freelanceService;

    @GetMapping("/opciones")
    @PreAuthorize("hasAuthority('FREELANCE_READ')")
    public ResponseEntity<FreelanceOpcionesResponse> opciones(
            @RequestParam(required = false) Long idProveedor) {
        return ResponseEntity.ok(freelanceService.obtenerOpciones(idProveedor));
    }

    @GetMapping("/identidad/disponibilidad")
    @PreAuthorize("hasAuthority('FREELANCE_CREATE')")
    public ResponseEntity<FreelanceIdentidadDisponibilidadResponse> disponibilidad(
            @RequestParam String prefijo,
            @RequestParam String lead,
            @RequestParam(required = false) String usermeta) {
        return ResponseEntity.ok(freelanceService.validarDisponibilidad(prefijo, lead, usermeta));
    }

    @PostMapping("/ventas")
    @PreAuthorize("hasAuthority('FREELANCE_CREATE')")
    public ResponseEntity<FreelanceVentaResponse> crear(
            @Valid @RequestBody FreelanceVentaCrearRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(freelanceService.crear(request));
    }

    @GetMapping("/seguimiento")
    @PreAuthorize("hasAuthority('FREELANCE_READ')")
    public ResponseEntity<FreelanceSeguimientoResponse> seguimiento(
            @RequestParam(required = false) LocalDate desde,
            @RequestParam(required = false) LocalDate hasta,
            @RequestParam(required = false) Long idProveedor) {
        return ResponseEntity.ok(freelanceService.obtenerSeguimiento(desde, hasta, idProveedor));
    }

    @GetMapping("/ventas/{idLead}")
    @PreAuthorize("hasAuthority('FREELANCE_READ')")
    public ResponseEntity<FreelanceVentaPreparacionResponse> preparar(@PathVariable Long idLead) {
        return ResponseEntity.ok(freelanceService.prepararCorreccion(idLead));
    }

    @PutMapping("/ventas/{idLead}/reenviar")
    @PreAuthorize("hasAuthority('FREELANCE_CORRECT')")
    public ResponseEntity<FreelanceVentaResponse> reenviar(
            @PathVariable Long idLead,
            @Valid @RequestBody FreelanceVentaReenvioRequest request) {
        return ResponseEntity.ok(freelanceService.reenviar(idLead, request));
    }
}
