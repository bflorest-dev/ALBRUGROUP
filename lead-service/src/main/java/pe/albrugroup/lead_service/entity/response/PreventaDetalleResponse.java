package pe.albrugroup.lead_service.entity.response;

import java.time.Instant;

/**
 * Una fila del detalle de preventas del RESUMEN DIARIO: el lead que está detrás del contador de
 * preventas de un card (Ingresos o Gestión del día). {@code lead} y {@code usermeta} vienen por
 * separado; el frontend los apila en una sola columna (lead con énfasis, usermeta debajo). Algunos
 * leads no tienen número {@code lead} y solo traen {@code usermeta}.
 *
 * <p>{@code numeroDocumento} y {@code nombreCompleto} son del titular del servicio (datos de
 * preventa) y pueden venir nulos si aún no se cargaron. El asesor sale del evento de tipificación a
 * PREVENTA (más reciente) en ambos modos.
 */
public record PreventaDetalleResponse(
        Long idLead,
        String lead,
        String usermeta,
        String numeroDocumento,
        String nombreCompleto,
        String nombreAsesor,
        Instant tipificadoAt,
        String nombreCampana
) {
}
