-- ============================================================
-- V11: ajuste_jornada - dimension de RAZON (intencion)
--
-- Ortogonal a 'origen' (mecanica). La razon decide status del dia, balance
-- (horas extra / compensacion) y autorizacion:
--   AMPLIACION_OPERATIVA   -> tramo aditivo, horas extra (no ensucia status)
--   CORRIMIENTO_COMPENSADA -> mueve base por tardanza no notificada
--   CORRIMIENTO_JUSTIFICADA-> mueve base por tardanza notificada (solo RRHH)
--   COMPENSACION           -> tramo aditivo que neutraliza deficit
-- rol_autor: auditoria + reglas de autorizacion en la capa service.
--
-- Nullable: filas de agosto ya existentes (25) se rellenan en el backfill.
-- Aditivo.
-- ============================================================

ALTER TABLE ajuste_jornada
    ADD COLUMN razon     VARCHAR(30),
    ADD COLUMN rol_autor VARCHAR(50);

ALTER TABLE ajuste_jornada
    ADD CONSTRAINT ajuste_jornada_razon_check
        CHECK (razon IS NULL OR razon IN (
            'AMPLIACION_OPERATIVA',
            'CORRIMIENTO_COMPENSADA',
            'CORRIMIENTO_JUSTIFICADA',
            'COMPENSACION'
        ));
