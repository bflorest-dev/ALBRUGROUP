-- ============================================================
-- V4: Permiso READ_LEADS_DIARIOS
-- Habilita la vista "Leads del día": listado de leads ingresados
-- durante el día consultando los eventos con ACCION = REGISTRO
-- (GET /eventos/registros-diarios).
--
-- Se crea un permiso dedicado en lugar de reutilizar
-- READ_EVENTOS_LEADS para no abrir a COMMUNITY el histórico de
-- eventos por-lead. Se asigna a GTR (asesor/supervisor), COMMUNITY
-- y ADMINISTRADOR.
--
-- Idempotente: usa INSERT ... WHERE NOT EXISTS, así puede
-- re-ejecutarse manualmente si fuera necesario.
-- ============================================================

INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'READ_LEADS_DIARIOS',
       'Puede ver el listado de leads ingresados durante el día',
       'EVENTO_LEAD',
       'READ'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'READ_LEADS_DIARIOS');

-- Asociar el permiso a los roles definidos.
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'READ_LEADS_DIARIOS'
  AND r.nombre IN ('ADMINISTRADOR', 'ASESOR_GTR', 'SUPERVISOR_GTR', 'COMMUNITY')
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
