package pe.albrugroup.schedule_service.entity.enums;

/** Alcance de un dia no laborable. Resolucion: el mas angosto que aplique (EMPLEADO > EQUIPO > GLOBAL). */
public enum AlcanceDiaNoLaborable {
    GLOBAL,
    EQUIPO,
    EMPLEADO
}
