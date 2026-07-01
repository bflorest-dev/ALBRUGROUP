-- ============================================================
-- V12: Historial de eventos de leads para COMMUNITY
--
-- La vista "Leads del día" ya permite a COMMUNITY listar los leads
-- diarios con READ_LEADS_DIARIOS. El botón de historial abre
-- GET /eventos/lead/{idLead}, protegido por READ_EVENTOS_LEADS.
--
-- Se otorga el permiso al rol COMMUNITY para mantener coherencia
-- con la acción disponible en la interfaz.
--
-- Idempotente: no duplica la relación si ya existe.
-- ============================================================

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'COMMUNITY'
  AND p.nombre = 'READ_EVENTOS_LEADS'
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
