INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'CORREGIR_MERITO_PREVENTA',
       'Puede corregir el asesor de merito de una preventa',
       'LEAD_PREVENTA_MERITO',
       'CORRECT'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'CORREGIR_MERITO_PREVENTA');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'CORREGIR_MERITO_PREVENTA'
  AND r.nombre IN ('ADMINISTRADOR', 'SUPERVISOR_VENTAS')
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
