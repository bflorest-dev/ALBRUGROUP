package pe.albrugroup.lead_service.entity.enums;

/**
 * Enfoque del detalle del dashboard de VENTA para los estados del cuadrante:
 *  - DIA: cohorte de preventas nacidas en el período (ancla fechaIngresoEtapa).
 *  - GENERAL: acumulado sobre todos los cohortes (vivos al cierre / hecho en el período).
 * Las métricas que no son de estado (PREVENTAS, RANKING, EMBUDO_*, etc.) ignoran este enfoque.
 */
public enum EnfoqueVenta {
    DIA,
    GENERAL
}
