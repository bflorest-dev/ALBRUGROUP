INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'READ_DASHBOARD_FINANCIERO',
       'Puede ver el dashboard financiero diario por proveedor',
       'DASHBOARD_FINANCIERO',
       'READ'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'READ_DASHBOARD_FINANCIERO');

INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'WRITE_DASHBOARD_FINANCIERO',
       'Puede recalcular el resumen financiero diario por proveedor',
       'DASHBOARD_FINANCIERO',
       'WRITE'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'WRITE_DASHBOARD_FINANCIERO');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'ADMINISTRADOR'
  AND p.nombre IN ('READ_DASHBOARD_FINANCIERO', 'WRITE_DASHBOARD_FINANCIERO')
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
