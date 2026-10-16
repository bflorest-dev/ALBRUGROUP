package pe.albrugroup.lead_service.entity.response;

import java.util.List;

/** Resumen de leads tipificados dentro de una hora operativa del día consultado. */
public record TipificacionesPorHoraResponse(
        int hora,
        long total,
        List<TipificacionPorHoraSegmentoResponse> tipificaciones
) {
}
