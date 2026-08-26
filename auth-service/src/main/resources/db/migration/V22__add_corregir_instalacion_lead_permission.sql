INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'CORREGIR_INSTALACION_LEAD',
       'Puede corregir SEC, SOT y fecha de instalacion de un lead instalado',
       'LEAD_INSTALACION',
       'CORRECT'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'CORREGIR_INSTALACION_LEAD');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'CORREGIR_INSTALACION_LEAD'
  AND r.nombre IN (
      'ADMINISTRADOR',
      'ASESOR_BACKOFFICE',
      'SUPERVISOR_BACKOFFICE',
      'ASESOR_POSTVENTA',
      'SUPERVISOR_POSTVENTA'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM rol_permiso rp
      WHERE rp.rol_id = r.id
        AND rp.permiso_id = p.id
  );
