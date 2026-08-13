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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.schedule_service.entity.response.asistencia.ResumenMensualResponse;
import pe.albrugroup.schedule_service.service.ResumenMensualService;

/**
 * Resumen mensual CERRADO (Fase 3.4.a). Devuelve el snapshot inmutable de un mes pasado (lo materializa
 * al primer acceso). El mes en curso se consulta en vivo por {@code /asistencia/mes}. Reusa el permiso
 * READ_ASISTENCIAS_CUMPLIMIENTO (admin/RRHH/supervisor con scope por filtros); no calcula dinero. El
 * sufijo v2 se limpia en la fase final.
 */
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/asistencia/v2/resumen-mensual")
public class ResumenMensualController {

    private final ResumenMensualService resumenMensualService;

    @GetMapping("/{idEmpleado}")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS_CUMPLIMIENTO')")
    public ResponseEntity<ResumenMensualResponse> obtener(
            @PathVariable @Positive Long idEmpleado,
            @RequestParam @Min(2000) Integer anio,
            @RequestParam @Min(1) @Max(12) Integer mes
    ) {
        return ResponseEntity.ok(resumenMensualService.obtener(idEmpleado, anio, mes));
    }
}
