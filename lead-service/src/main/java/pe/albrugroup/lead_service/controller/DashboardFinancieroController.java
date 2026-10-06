package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.response.ResumenFinancieroDiaResponse;
import pe.albrugroup.lead_service.service.MetricasPeriodoGuard;
import pe.albrugroup.lead_service.service.ResumenFinancieroDiaService;

import java.time.LocalDate;
import java.util.List;

@RestController @Validated
@RequestMapping("/financiero")
@RequiredArgsConstructor
public class DashboardFinancieroController {

    private final ResumenFinancieroDiaService resumenService;
    private final MetricasPeriodoGuard metricasPeriodoGuard;

    @GetMapping("/dashboard/proveedores")
    @PreAuthorize("hasAuthority('READ_DASHBOARD_FINANCIERO')")
    public ResponseEntity<List<ResumenFinancieroDiaResponse.ProveedorRef>> listarProveedores() {
        return ResponseEntity.ok(resumenService.proveedoresSeleccionables());
    }

    @GetMapping("/resumen-diario")
    @PreAuthorize("hasAuthority('READ_DASHBOARD_FINANCIERO')")
    public ResponseEntity<List<ResumenFinancieroDiaResponse>> consultar(
            @RequestParam Long idProveedor,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        var rango = metricasPeriodoGuard.protegerRango(desde, hasta);
        return ResponseEntity.ok(resumenService.consultar(idProveedor, rango.desde(), rango.hasta()));
    }

    @PostMapping("/resumen-diario/recalcular")
    @PreAuthorize("hasAuthority('WRITE_DASHBOARD_FINANCIERO')")
    public ResponseEntity<List<ResumenFinancieroDiaResponse>> recalcular(
            @RequestParam Long idProveedor,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        return ResponseEntity.ok(resumenService.recalcular(idProveedor, desde, hasta));
    }
}
