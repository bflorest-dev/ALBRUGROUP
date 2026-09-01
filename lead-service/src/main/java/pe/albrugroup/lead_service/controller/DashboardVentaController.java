package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse;
import pe.albrugroup.lead_service.entity.response.DashboardVentaTramosResponse;
import pe.albrugroup.lead_service.service.DashboardVentaService;

import java.time.LocalDate;
import java.util.List;

/**
 * DASHBOARD de la etapa VENTA. Filtra por proveedor (obligatorio) y período; si el período no viene,
 * usa el mes operativo en curso. Todos los porcentajes los calcula el frontend (el back solo da absolutos).
 */
@RestController
@RequestMapping("/venta")
@RequiredArgsConstructor
public class DashboardVentaController {

    private final DashboardVentaService dashboardVentaService;

    // Proveedores seleccionables en el dashboard (asignados si el rol está acotado, o todos si no).
    @GetMapping("/dashboard/proveedores")
    @PreAuthorize("hasAuthority('READ_DASHBOARD_VENTA')")
    public ResponseEntity<List<DashboardVentaResponse.ProveedorRef>> listarProveedoresDashboard() {
        return ResponseEntity.ok(dashboardVentaService.proveedoresSeleccionables());
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('READ_DASHBOARD_VENTA')")
    public ResponseEntity<DashboardVentaResponse> obtenerDashboardVenta(
            @RequestParam Long idProveedor,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        return ResponseEntity.ok(dashboardVentaService.obtener(idProveedor, desde, hasta));
    }

    // Bloque 4: matriz tramo horario × día (hoy/mañana/pasado). Foto actual; no usa período.
    @GetMapping("/dashboard/programados-tramos")
    @PreAuthorize("hasAuthority('READ_DASHBOARD_VENTA')")
    public ResponseEntity<DashboardVentaTramosResponse> obtenerTramosProgramados(
            @RequestParam Long idProveedor
    ) {
        return ResponseEntity.ok(dashboardVentaService.obtenerTramos(idProveedor));
    }
}
