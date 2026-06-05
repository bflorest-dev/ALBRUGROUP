-- ============================================================
-- V6: Permiso DELETE_LEADS
-- Habilita el borrado integral de leads por id.
-- Se asigna solo a ADMINISTRADOR por ser una operacion destructiva.
-- ============================================================

INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'DELETE_LEADS',
       'Puede eliminar integralmente leads',
       'LEAD',
       'DELETE'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'DELETE_LEADS');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'DELETE_LEADS'
  AND r.nombre = 'ADMINISTRADOR'
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
