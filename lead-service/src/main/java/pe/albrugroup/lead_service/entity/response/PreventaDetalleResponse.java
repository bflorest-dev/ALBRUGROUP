package pe.albrugroup.lead_service.entity.response;

import java.time.Instant;

/**
 * Una fila del detalle de preventas del RESUMEN DIARIO: el lead que está detrás del contador de
 * preventas de un card (Ingresos o Gestión del día). {@code lead} y {@code usermeta} vienen por
 * separado; el frontend los apila en una sola columna (lead con énfasis, usermeta debajo). Algunos
 * leads no tienen número {@code lead} y solo traen {@code usermeta}.
 *
 * <p>En modo GESTIONADOS el asesor/rol/subtip/fecha salen del evento de tipificación a PREVENTA; en
 * INGRESADOS salen del resumen de la etapa ({@code <campo>...}) y {@code rolAsesor} queda nulo.
 */
public record PreventaDetalleResponse(
        Long idLead,
        String lead,
        String usermeta,
        String nombreAsesor,
        String rolAsesor,
        String subtipificacion,
        Instant tipificadoAt,
        String nombreCampana
) {
}
