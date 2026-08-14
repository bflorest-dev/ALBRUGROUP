package pe.albrugroup.schedule_service.entity.enums;

/**
 * Status del dia (Fork 4): NO es columna, se DERIVA de los hechos. PRESENTE/TARDANZA/FALTA desde la
 * marcacion; TARDANZA_COMPENSABLE/JUSTIFICADA desde {@code AjusteJornada.razon}; NO_LABORABLE desde
 * {@code DiaNoLaborable}/base. Lo usa el resumen mensual para agregar; el ms de calculo penaliza segun
 * el status.
 */
public enum EstadoDia {
    PRESENTE,
    TARDANZA,
    TARDANZA_COMPENSABLE,
    TARDANZA_JUSTIFICADA,
    FALTA,
    NO_LABORABLE
}
