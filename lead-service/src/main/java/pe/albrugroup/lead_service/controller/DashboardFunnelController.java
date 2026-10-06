package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.response.DashboardFunnelResponse;
import pe.albrugroup.lead_service.service.DashboardFunnelService;
import pe.albrugroup.lead_service.service.MetricasPeriodoGuard;

import java.time.LocalDate;
import java.util.List;

@RestController @Validated
@RequestMapping("/funnel")
@RequiredArgsConstructor
public class DashboardFunnelController {

    private final DashboardFunnelService dashboardFunnelService;
    private final MetricasPeriodoGuard metricasPeriodoGuard;

    @GetMapping("/dashboard/proveedores")
    @PreAuthorize("hasAuthority('READ_DASHBOARD_FUNNEL')")
    public ResponseEntity<List<DashboardFunnelResponse.ProveedorRef>> listarProveedores() {
        return ResponseEntity.ok(dashboardFunnelService.proveedoresSeleccionables());
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('READ_DASHBOARD_FUNNEL')")
    public ResponseEntity<DashboardFunnelResponse> obtenerDashboard(
            @RequestParam Long idProveedor,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        var rango = metricasPeriodoGuard.protegerRango(desde, hasta);
        return ResponseEntity.ok(dashboardFunnelService.obtener(idProveedor, rango.desde(), rango.hasta()));
    }
}
