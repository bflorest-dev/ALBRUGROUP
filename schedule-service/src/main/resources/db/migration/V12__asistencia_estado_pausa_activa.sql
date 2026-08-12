-- ============================================================
-- V12: permitir PAUSA_ACTIVA en asistencia.estado_actual
--
-- El check existente restringe estado_actual a los 5 estados viejos. Se agrega
-- PAUSA_ACTIVA (nuevo estado). No destructivo: solo afloja el check para admitir
-- un valor mas; no altera datos existentes.
-- ============================================================

ALTER TABLE asistencia
    DROP CONSTRAINT asistencia_estado_actual_check;

ALTER TABLE asistencia
    ADD CONSTRAINT asistencia_estado_actual_check
        CHECK (estado_actual IN (
            'OFFLINE', 'ONLINE', 'ALMUERZO', 'SERVICIOS', 'CAPACITACION', 'PAUSA_ACTIVA'
        ));
