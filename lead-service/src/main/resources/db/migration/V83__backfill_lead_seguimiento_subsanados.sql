-- V83: Backfill de lead_seguimiento para leads SUBSANADOS creados antes de que la subsanacion
-- escribiera LeadSeguimiento. Regla: registroCrm = grabacion = instalacion = la fecha_instalacion
-- del acta de subsanacion mas reciente por lead (subsanacion_auditoria).
-- fecha_registro_crm / fecha_grabacion son instant a medianoche (America/Lima); fecha_instalacion es DATE.

-- 1) Asegurar fila de seguimiento para cada lead subsanado.
INSERT INTO lead_seguimiento (id_lead)
SELECT DISTINCT a.id_lead
FROM subsanacion_auditoria a
WHERE NOT EXISTS (SELECT 1 FROM lead_seguimiento s WHERE s.id_lead = a.id_lead);

-- 2) Poblar las 3 fechas desde el acta mas reciente por lead.
UPDATE lead_seguimiento seg
SET fecha_instalacion  = u.fecha_instalacion,
    fecha_registro_crm = (u.fecha_instalacion + TIME '00:00') AT TIME ZONE 'America/Lima',
    fecha_grabacion    = (u.fecha_instalacion + TIME '00:00') AT TIME ZONE 'America/Lima'
FROM (
    SELECT DISTINCT ON (id_lead) id_lead, fecha_instalacion
    FROM subsanacion_auditoria
    ORDER BY id_lead, ejecutado_at DESC
) u
WHERE seg.id_lead = u.id_lead;
