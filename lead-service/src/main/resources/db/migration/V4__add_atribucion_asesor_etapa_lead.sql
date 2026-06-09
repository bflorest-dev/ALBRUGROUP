-- Atribucion por etapa en lead: que asesor concreto cada etapa y cuando.
-- Soporta sobre-escritura (last-writer-wins): si el lead regresa y otro asesor lo vuelve a
-- concretar, la captura en vivo actualiza estos campos. Aqui solo se rellena el historico.

ALTER TABLE lead
    ADD COLUMN IF NOT EXISTS id_asesor_preventa  BIGINT,
    ADD COLUMN IF NOT EXISTS fecha_preventa      TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS id_asesor_venta     BIGINT,
    ADD COLUMN IF NOT EXISTS fecha_venta         TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS id_asesor_postventa BIGINT,
    ADD COLUMN IF NOT EXISTS fecha_postventa     TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS id_asesor_cobranza  BIGINT,
    ADD COLUMN IF NOT EXISTS fecha_cobranza      TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_lead_id_asesor_preventa_fecha  ON lead (id_asesor_preventa, fecha_preventa);
CREATE INDEX IF NOT EXISTS idx_lead_id_asesor_venta_fecha     ON lead (id_asesor_venta, fecha_venta);
CREATE INDEX IF NOT EXISTS idx_lead_id_asesor_postventa_fecha ON lead (id_asesor_postventa, fecha_postventa);
CREATE INDEX IF NOT EXISTS idx_lead_id_asesor_cobranza_fecha  ON lead (id_asesor_cobranza, fecha_cobranza);

-- Backfill de PREVENTA (unico caso historico: aun no hay postventa ni cobranza).
-- Por cada lead, el evento de cierre de preventa mas reciente
-- (TIPIFICACION / PREVENTA_COMPLETA / VENTA_CERRADA) define quien lo concreto y cuando.
-- Si el evento no afecta filas (sin coincidencias) el UPDATE es un no-op seguro.
UPDATE lead l
SET id_asesor_preventa = e.id_actor,
    fecha_preventa     = e.created_at
FROM (
    SELECT DISTINCT ON (ev.id_lead) ev.id_lead, ev.id_actor, ev.created_at
    FROM evento ev
    WHERE ev.accion = 'TIPIFICACION'
      AND ev.tipificacion = 'PREVENTA_COMPLETA'
      AND ev.subtipificacion = 'VENTA_CERRADA'
    ORDER BY ev.id_lead, ev.created_at DESC
) e
WHERE l.id = e.id_lead;
