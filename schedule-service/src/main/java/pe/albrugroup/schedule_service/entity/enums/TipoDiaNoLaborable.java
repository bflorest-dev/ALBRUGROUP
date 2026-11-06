package pe.albrugroup.schedule_service.entity.enums;

/** Motivo de un dia no laborable / override de calendario. */
public enum TipoDiaNoLaborable {
    FERIADO,
    VACACIONES,
    DESCANSO_MEDICO,
    PERMISO,
    /** @deprecated remplazado por PERMISO (ver reworks/40.UpdateDiasNoLaborables.md, backfill). Se elimina en Fase 5. */
    @Deprecated
    DESCANSO_EQUIPO
}
