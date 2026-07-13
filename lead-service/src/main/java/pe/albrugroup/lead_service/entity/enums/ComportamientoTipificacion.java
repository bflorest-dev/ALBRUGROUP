package pe.albrugroup.lead_service.entity.enums;

/**
 * Comportamientos que una subtipificación puede disparar al usarse. Reemplazan a los antiguos códigos
 * hardcodeados (AGENDADO, SUBIDO, GRABADO, …): cada equipo marca en su matriz qué subtipi tiene cada
 * comportamiento, de modo que renombrar una tipi ya no rompe la lógica asociada. Vocabulario controlado
 * (no texto libre) para que front y back puedan confiar en los valores.
 */
public enum ComportamientoTipificacion {
    /** El modal exige hora programada (antes: tipi AGENDADO / PROGRAMADO). */
    REQUIERE_HORA_PROGRAMADA,
    /** El modal exige fecha de programación (antes: tipi PROGRAMADO en VENTA). */
    REQUIERE_FECHA_PROGRAMACION,
    /** El modal exige fecha de instalación (antes: subtip que pasa a POSTVENTA). */
    REQUIERE_FECHA_INSTALACION,
    /** El modal muestra los campos SEC/SOT (antes: tipi SUBIDO), sujeto a que el proveedor lo requiera. */
    REQUIERE_SEC_SOT,
    /** La subtipi que atribuye el mérito de su etapa al asesor que la usa (PREVENTA: cierre de venta;
     *  VENTA: instalación). Una sola subtipi por matriz/etapa debería tenerla. */
    RECIBE_MERITO,
    /** Cierra la preventa hacia venta / cuenta como preventa completa (antes: PREVENTA_COMPLETA + VENTA_CERRADA). */
    ES_CIERRE_PREVENTA,
    /** La subtipi aparece en la bandeja de Agendados GTR (antes: tipi AGENDADO). Lectura diferida (reportería). */
    APARECE_EN_AGENDADOS_GTR,
    /** Cancela una programación previa (antes: subtip PROGRAMACION_CANCELADA). Lectura diferida (reportería). */
    ES_CANCELACION_PROGRAMACION
}
