package pe.albrugroup.schedule_service.controller;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.schedule_service.entity.response.asistencia.ResumenMensualResponse;
import pe.albrugroup.schedule_service.service.ResumenMensualService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/asistencia/reporte-mensual")
public class ReporteAsistenciaController {

    private final ResumenMensualService resumenMensualService;

    @GetMapping("/bulk")
    @PreAuthorize("hasAnyAuthority('READ_ASISTENCIAS_CUMPLIMIENTO', 'SERVICE_INTERNAL')")
    public ResponseEntity<List<ResumenMensualResponse>> obtenerBulk(
            @RequestParam List<Long> ids,
            @RequestParam @Min(2000) Integer anio,
            @RequestParam @Min(1) @Max(12) Integer mes
    ) {
        return ResponseEntity.ok(resumenMensualService.obtenerBulk(ids, anio, mes));
    }

    @PostMapping("/recalcular")
    @PreAuthorize("hasAnyAuthority('READ_ASISTENCIAS_CUMPLIMIENTO', 'SERVICE_INTERNAL')")
    public ResponseEntity<List<ResumenMensualResponse>> recalcularBulk(
            @RequestParam List<Long> ids,
            @RequestParam @Min(2000) Integer anio,
            @RequestParam @Min(1) @Max(12) Integer mes
    ) {
        return ResponseEntity.ok(resumenMensualService.recalcularBulk(ids, anio, mes));
    }
}
