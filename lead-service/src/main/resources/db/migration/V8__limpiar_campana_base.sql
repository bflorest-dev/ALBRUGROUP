-- =====================================================================
-- Limpieza de las campañas "BASE" ficticias (id 1 y 17).
--
-- Con el modelo de campaña opcional, un lead puede existir sin campaña y
-- permanece en la bandeja de su equipo. Las dos campañas BASE dejan de usarse:
--   * id 1  -> respaldo histórico de la carga masiva por Excel.
--   * id 17 -> workaround del segundo equipo.
-- Esta migración:
--   1) respalda los leads afectados (rollback),
--   2) respalda y borra un gasto erróneo cargado sobre la campaña 1,
--   3) pasa esos leads a "Sin campaña" (id_campana = NULL),
--   4) desactiva las campañas (no se borran: evento.id_campana es un valor
--      plano sin FK, y conviene conservar el nombre en el histórico; además
--      campana_gasto_registro tiene FK NOT NULL hacia campana).
--
-- Verificado contra copia de producción (2026-06-23):
--   campaña 1 -> 25 391 leads (equipo 1), campaña 17 -> 48 leads (equipo 2),
--   1 gasto erróneo (S/ 570.22). Tras migrar, 0 leads quedan sin equipo.
--
-- Idempotente: si se reejecuta o los ids ya no existen, no hace nada.
-- Flyway ejecuta el script dentro de una transacción (no usar BEGIN/COMMIT).
-- =====================================================================

-- 1) Respaldo de los leads afectados (permite revertir la migración).
CREATE TABLE IF NOT EXISTS _backup_campana_base_leads (
    id_lead             bigint PRIMARY KEY,
    id_campana_anterior bigint      NOT NULL,
    respaldado_at       timestamptz NOT NULL DEFAULT now()
);
INSERT INTO _backup_campana_base_leads (id_lead, id_campana_anterior)
SELECT id, id_campana FROM lead WHERE id_campana IN (1, 17)
ON CONFLICT (id_lead) DO NOTHING;

-- 2) Respaldo del/los gasto(s) erróneo(s) antes de borrarlos.
CREATE TABLE IF NOT EXISTS _backup_campana_base_gastos (LIKE campana_gasto_registro);
INSERT INTO _backup_campana_base_gastos
SELECT * FROM campana_gasto_registro WHERE id_campana IN (1, 17);

-- 3) Leads BASE -> Sin campaña.
UPDATE lead SET id_campana = NULL WHERE id_campana IN (1, 17);

-- 4) Borrar gastos erróneos/descartables de las BASE (ensuciarían finanzas).
DELETE FROM campana_gasto_registro WHERE id_campana IN (1, 17);

-- 5) Desactivar las campañas BASE.
UPDATE campana SET activo = false, updated_at = now() WHERE id IN (1, 17);

-- =====================================================================
-- ROLLBACK manual (si fuera necesario):
--   UPDATE campana SET activo = true WHERE id IN (1, 17);
--   UPDATE lead l SET id_campana = b.id_campana_anterior
--     FROM _backup_campana_base_leads b WHERE l.id = b.id_lead;
--   INSERT INTO campana_gasto_registro SELECT * FROM _backup_campana_base_gastos;
-- Limpieza de respaldos cuando todo esté confirmado:
--   DROP TABLE _backup_campana_base_leads;
--   DROP TABLE _backup_campana_base_gastos;
-- =====================================================================
