package pe.albrugroup.lead_service.entity.enums;

/**
 * Cohorte que arma el reporte de gestión por campaña:
 *  - GESTIONADOS: leads cuya tipificación (según el campo elegido) cayó en el período. Ancla en la
 *    fecha de esa tipificación.
 *  - INGRESADOS: leads con un evento REGISTRO en el período (los "leads del día"), agrupados por su
 *    tipificación actual. Ancla en la fecha del registro.
 */
public enum ModoConteo {
    GESTIONADOS,
    INGRESADOS
}
