INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'SUBSANAR_LEAD_ADMIN',
       'Puede crear o reconstruir historicamente un lead completo',
       'LEAD',
       'SUBSANACION'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'SUBSANAR_LEAD_ADMIN');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'SUBSANAR_LEAD_ADMIN'
  AND r.nombre = 'ADMINISTRADOR'
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
