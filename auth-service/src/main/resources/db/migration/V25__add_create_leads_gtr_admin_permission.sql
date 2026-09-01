-- ============================================================
-- V25: Permiso CREATE_LEADS_GTR_ADMIN
-- Habilita el intake GTR por equipo desde vistas ADMIN.
-- Es exclusivo de ADMINISTRADOR para no alterar el flujo normal GTR.
-- ============================================================

INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'CREATE_LEADS_GTR_ADMIN',
       'Puede registrar leads GTR dentro de un equipo desde Administracion',
       'LEAD_GTR_ADMIN',
       'CREATE'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'CREATE_LEADS_GTR_ADMIN');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'CREATE_LEADS_GTR_ADMIN'
  AND r.nombre = 'ADMINISTRADOR'
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
