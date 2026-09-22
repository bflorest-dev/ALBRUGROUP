INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'READ_DASHBOARD_FUNNEL',
       'Puede ver el dashboard FUNNEL de leads (del intake a la instalacion)',
       'DASHBOARD_FUNNEL',
       'READ'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'READ_DASHBOARD_FUNNEL');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'READ_DASHBOARD_FUNNEL'
  AND r.nombre = 'ADMINISTRADOR'
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
