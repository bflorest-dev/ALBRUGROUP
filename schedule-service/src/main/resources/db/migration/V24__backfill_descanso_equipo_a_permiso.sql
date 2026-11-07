-- Fase 2 del plan reworks/40.UpdateDiasNoLaborables.md
-- Backfill: remapea los dias no laborables historicos DESCANSO_EQUIPO a PERMISO.
-- Motivo: DESCANSO_EQUIPO se elimina del catalogo de tipos (no tiene sentido de negocio).
-- PERMISO = permiso con goce (dia libre pagado, no penaliza), mismo efecto que tenian estas filas
-- (todas con laborable=false). No hay cambio de esquema: dia_no_laborable.tipo es varchar sin CHECK.
--
-- El WHERE alcanza cualquier fila existente al momento de ejecutar (incluidas las que hayan aparecido
-- en produccion despues de sacar la copia local), por lo que no quedan registros huerfanos.
-- El valor DESCANSO_EQUIPO se quita del enum Java recien en la Fase 5, tras validar este backfill.

UPDATE dia_no_laborable
SET tipo = 'PERMISO'
WHERE tipo = 'DESCANSO_EQUIPO';
