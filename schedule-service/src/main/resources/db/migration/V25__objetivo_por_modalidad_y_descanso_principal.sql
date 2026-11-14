-- Fase 1 del plan reworks/41.UpdateHorasObjetivoDescansoPrincipal.md
-- Objetivo pasa a calcularse por MODALIDAD (horas operativas/dia) x dias no-descanso-principal,
-- en vez de leer las horas del horario_detalle. Agrega:
--   1. politica_modalidad.minutos_operativos_dia : horas operativas netas de la modalidad (sin almuerzo).
--   2. horario_detalle.descanso_principal        : marca el descanso base que LIBERA el objetivo.
-- Fuente de verdad: reworks/CasoDeUsoHorariosPlanilla.txt. Horas op/dia confirmadas por el usuario:
--   PART_TIME=4h(240), SEMI_FULL=6h(360), FULL_TIME=8h(480), SUPER_FULL=10h(600). Almuerzo NO entra.

-- 1. minutos_operativos_dia por modalidad -------------------------------------------------
ALTER TABLE politica_modalidad ADD COLUMN minutos_operativos_dia INTEGER;

UPDATE politica_modalidad SET minutos_operativos_dia = CASE modalidad
    WHEN 'PART_TIME'  THEN 240
    WHEN 'SEMI_FULL'  THEN 360
    WHEN 'FULL_TIME'  THEN 480
    WHEN 'SUPER_FULL' THEN 600
END;

-- Fallar ruidosamente si alguna modalidad no mapeo (fila nueva no contemplada).
DO $$
DECLARE n INT;
BEGIN
    SELECT COUNT(*) INTO n FROM politica_modalidad WHERE minutos_operativos_dia IS NULL;
    IF n > 0 THEN
        RAISE EXCEPTION 'V25: % politica(s) de modalidad sin minutos_operativos_dia mapeado', n;
    END IF;
END $$;

ALTER TABLE politica_modalidad ALTER COLUMN minutos_operativos_dia SET NOT NULL;

-- 2. descanso_principal en horario_detalle ------------------------------------------------
ALTER TABLE horario_detalle ADD COLUMN descanso_principal BOOLEAN NOT NULL DEFAULT false;

-- Backfill: exactamente un descanso principal por horario que tenga descansos.
-- Regla: preferir DOMINGO (descanso dominante); si no hay DOMINGO y hay un unico descanso, ese.
UPDATE horario_detalle hd SET descanso_principal = true
WHERE hd.laborable = false AND hd.dia = 'DOMINGO';

UPDATE horario_detalle hd SET descanso_principal = true
WHERE hd.laborable = false
  AND hd.horario_id NOT IN (
        SELECT horario_id FROM horario_detalle WHERE laborable = false AND dia = 'DOMINGO')
  AND hd.horario_id IN (
        SELECT horario_id FROM horario_detalle WHERE laborable = false
        GROUP BY horario_id HAVING COUNT(*) = 1);

-- Fallar ruidosamente si algun horario con descansos NO quedo con exactamente 1 principal
-- (p.ej. 2+ descansos sin DOMINGO: requiere decision manual del gestor; no se adivina).
DO $$
DECLARE n INT;
BEGIN
    SELECT COUNT(*) INTO n FROM (
        SELECT horario_id FROM horario_detalle WHERE laborable = false
        GROUP BY horario_id
        HAVING COUNT(*) FILTER (WHERE descanso_principal) <> 1
    ) t;
    IF n > 0 THEN
        RAISE EXCEPTION 'V25: % horario(s) con descansos sin exactamente 1 descanso_principal (revisar manualmente)', n;
    END IF;
END $$;
