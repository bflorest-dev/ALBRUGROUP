package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.Etapa;

/**
 * Una fila del detalle de leads detrás del contador de un ASESOR en el dashboard de VENTA. El orden de
 * los campos calza con la proyección {@code SELECT new ...} de la query paginada. `lead`+`usermeta` se
 * apilan en el modal (énfasis en el lead); `tipificacion`+`subtipificacion` son la tipi VIVA del Lead
 * (refleja la etapa actual). `ultimoComentario` = comentario del último evento de tipificación.
 */
public record VentaAsesorDetalleResponse(
        Long idLead,
        String lead,
        String usermeta,
        String numeroDocumento,
        String nombreCliente,
        Etapa etapa,
        String tipificacion,
        String subtipificacion,
        String ultimoComentario
) {
}
