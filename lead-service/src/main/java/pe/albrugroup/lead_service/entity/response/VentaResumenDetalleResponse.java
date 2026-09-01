package pe.albrugroup.lead_service.entity.response;

import java.time.Instant;

/**
 * Una fila del detalle de leads detrás de un contador del RESUMEN de VENTA (Preventas/Registradas/
 * Programadas/Rechazadas/Instaladas). El orden de los campos calza con la proyección {@code SELECT new ...}.
 * `fechaRegistro` = ingreso a VENTA (fechaIngresoEtapa); `numeroDocumento`+`lead` se apilan en la columna
 * "Cliente"; `tipificacion`+`subtipificacion` = tipi VIVA del Lead; `fechaUltimaGestion` = última gestión en
 * VENTA. Los "días" (ingreso → última gestión) los calcula el frontend.
 */
public record VentaResumenDetalleResponse(
        Instant fechaRegistro,
        String numeroDocumento,
        String lead,
        String nombreCliente,
        String tipificacion,
        String subtipificacion,
        Instant fechaUltimaGestion
) {
}
