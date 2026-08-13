-- ============================================================
-- V12: permitir PAUSA_ACTIVA en asistencia.estado_actual
--
-- El check existente restringe estado_actual a los 5 estados viejos. Se agrega
-- PAUSA_ACTIVA (nuevo estado). No destructivo: solo afloja el check para admitir
-- un valor mas; no altera datos existentes.
--
-- Idempotente: usa IF EXISTS en el DROP (mismo patron que V3). El check no siempre
-- existe: Hibernate lo genera en algunos esquemas y en otros no (la copia de prod puede
-- traerlo o no). Sin IF EXISTS, la migracion revienta donde el check no esta. Tras el
-- ADD, estado_actual queda acotado a los 6 estados en cualquier caso.
-- ============================================================

ALTER TABLE asistencia
    DROP CONSTRAINT IF EXISTS asistencia_estado_actual_check;

ALTER TABLE asistencia
    ADD CONSTRAINT asistencia_estado_actual_check
        CHECK (estado_actual IN (
            'OFFLINE', 'ONLINE', 'ALMUERZO', 'SERVICIOS', 'CAPACITACION', 'PAUSA_ACTIVA'
        ));
