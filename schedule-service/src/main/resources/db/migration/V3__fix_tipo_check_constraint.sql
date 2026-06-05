-- ============================================================
-- V3: Ampliar CHECK constraint de excepcion_horario.tipo
--
-- Hibernate genero un CHECK CONSTRAINT cuando creo el esquema original con los
-- 3 valores del enum TipoExcepcionHorario (CAMBIO_COMPLETO, DIA_LIBRE, COMPENSACION).
-- Al agregar AMPLIACION en V2, el constraint bloqueaba el INSERT del nuevo tipo.
-- Este script lo reemplaza por uno que incluye los 4 valores.
--
-- Idempotente: usa IF EXISTS en el DROP.
-- ============================================================

ALTER TABLE excepcion_horario
    DROP CONSTRAINT IF EXISTS excepcion_horario_tipo_check;

ALTER TABLE excepcion_horario
    ADD CONSTRAINT excepcion_horario_tipo_check
        CHECK (tipo IN ('CAMBIO_COMPLETO', 'DIA_LIBRE', 'COMPENSACION', 'AMPLIACION'));
