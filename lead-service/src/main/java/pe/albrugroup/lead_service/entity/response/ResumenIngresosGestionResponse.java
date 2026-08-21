package pe.albrugroup.lead_service.entity.response;

/**
 * Tabla 1 del RESUMEN DIARIO: preventas conseguidas respecto a los leads ingresados y a los
 * gestionados en el período. Las dos filas se muestran siempre (no dependen del toggle de modo).
 *
 * <ul>
 *   <li>INGRESOS DEL DÍA: {@code ingresosTotal} = leads únicos ingresados; {@code ingresosPreventas}
 *       = cuántos de esa cohorte llegaron a preventa.</li>
 *   <li>GESTIÓN DEL DÍA: {@code gestionTotal} = leads gestionados (tipificados) en el período;
 *       {@code gestionPreventas} = preventas ocurridas en el período.</li>
 * </ul>
 *
 * El porcentaje (preventas / total) lo calcula el frontend.
 */
public record ResumenIngresosGestionResponse(
        long ingresosTotal,
        long ingresosPreventas,
        long gestionTotal,
        long gestionPreventas
) {
}
