package pe.albrugroup.schedule_service.controller;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.schedule_service.entity.response.asistencia.ResumenMensualResponse;
import pe.albrugroup.schedule_service.service.ResumenMensualService;

/**
 * Resumen mensual para service-to-service (ms de calculo). Mismo snapshot que la ruta de usuario, pero
 * protegido con el secreto compartido (SERVICE_INTERNAL via InternalAuthFilter), no con JWT de usuario.
 * {@code recalcular} reabre un mes cerrado (correccion, caso raro): borra el snapshot y lo recomputa.
 */
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/asistencia/internal/resumen-mensual")
public class ResumenMensualInternalController {

    private final ResumenMensualService resumenMensualService;

    @GetMapping("/{idEmpleado}")
    @PreAuthorize("hasAuthority('SERVICE_INTERNAL')")
    public ResponseEntity<ResumenMensualResponse> obtener(
            @PathVariable @Positive Long idEmpleado,
            @RequestParam @Min(2000) Integer anio,
            @RequestParam @Min(1) @Max(12) Integer mes
    ) {
        return ResponseEntity.ok(resumenMensualService.obtener(idEmpleado, anio, mes));
    }

    @PostMapping("/{idEmpleado}/recalcular")
    @PreAuthorize("hasAuthority('SERVICE_INTERNAL')")
    public ResponseEntity<ResumenMensualResponse> recalcular(
            @PathVariable @Positive Long idEmpleado,
            @RequestParam @Min(2000) Integer anio,
            @RequestParam @Min(1) @Max(12) Integer mes
    ) {
        return ResponseEntity.ok(resumenMensualService.recalcular(idEmpleado, anio, mes));
    }
}
