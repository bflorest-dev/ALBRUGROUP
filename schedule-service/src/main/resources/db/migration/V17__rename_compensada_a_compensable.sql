-- ============================================================
-- V17: renombrar el concepto "compensada" -> "compensable" en el corrimiento por tardanza.
--
-- Motivo: "compensada" chocaba con la razon COMPENSACION (el tramo aditivo que cubre la deuda).
-- La tardanza que MUEVE el horario y puede dejar horas por recuperar es COMPENSABLE (no notificada),
-- distinta de las HORAS de compensacion que la cubren. Solo copy/nombre; la mecanica no cambia.
--
-- Alcance:
--   1) ajuste_jornada.razon: valor 'CORRIMIENTO_COMPENSADA' -> 'CORRIMIENTO_COMPENSABLE' + CHECK.
--   2) resumen_asistencia_mensual: columna dias_tardanza_compensada -> dias_tardanza_compensable.
--
-- Idempotente en el CHECK (DROP IF EXISTS + ADD), como V12. Corre en prod tras V11/V15 (cutover
-- V5->V17); la copia local ya esta en v16, la columna y el check existen en ambos escenarios.
-- ============================================================

-- 1) Valor de razon + CHECK
UPDATE ajuste_jornada
    SET razon = 'CORRIMIENTO_COMPENSABLE'
    WHERE razon = 'CORRIMIENTO_COMPENSADA';

ALTER TABLE ajuste_jornada
    DROP CONSTRAINT IF EXISTS ajuste_jornada_razon_check;

ALTER TABLE ajuste_jornada
    ADD CONSTRAINT ajuste_jornada_razon_check
        CHECK (razon IS NULL OR razon IN (
            'AMPLIACION_OPERATIVA',
            'CORRIMIENTO_COMPENSABLE',
            'CORRIMIENTO_JUSTIFICADA',
            'COMPENSACION'
        ));

-- 2) Columna del desglose en el resumen mensual
ALTER TABLE resumen_asistencia_mensual
    RENAME COLUMN dias_tardanza_compensada TO dias_tardanza_compensable;
