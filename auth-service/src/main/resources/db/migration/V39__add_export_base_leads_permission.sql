INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'EXPORT_BASE_LEADS',
       'Puede exportar base de leads como archivos encriptados ALB',
       'LEAD',
       'EXPORT'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'EXPORT_BASE_LEADS');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'EXPORT_BASE_LEADS'
  AND r.nombre = 'ADMINISTRADOR'
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
