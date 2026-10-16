package pe.albrugroup.lead_service.entity.response;

/** Cantidad de leads cuya última tipificación de la hora corresponde a un código. */
public record TipificacionPorHoraSegmentoResponse(
        String codigoTipificacion,
        long cantidad,
        double porcentaje
) {
}
