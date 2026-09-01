package pe.albrugroup.lead_service.entity.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Bloque 4 del DASHBOARD de VENTA: matriz tramo horario × día (hoy / mañana / pasado) de la cartera viva
 * de PROGRAMADO, tomando fecha y hora del evento de programación vigente. Foto relativa a HOY (no usa el
 * período del dashboard), filtrada por proveedor. Ver docs/PLAN_DASHBOARD_VENTA.md §7 y §10.
 */
public record DashboardVentaTramosResponse(
        DashboardVentaResponse.ProveedorRef proveedor,
        LocalDate hoy,
        LocalDate manana,
        LocalDate pasado,
        List<Tramo> tramos
) {
    /** Un tramo horario con su conteo por día. {@code OTROS} agrupa horas fuera de 08:00–20:00. */
    public record Tramo(
            String codigo,     // TRAMO_1 | TRAMO_2 | TRAMO_3 | OTROS
            LocalTime desde,   // null para OTROS
            LocalTime hasta,   // null para OTROS
            long hoy,
            long manana,
            long pasado
    ) {}
}
