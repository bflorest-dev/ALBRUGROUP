INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT rol.id, permiso.id
FROM roles rol
CROSS JOIN permisos permiso
WHERE rol.nombre IN ('ASESOR_VENTAS', 'OJT', 'SUPERVISOR_VENTAS', 'ASESOR_GTR', 'SUPERVISOR_GTR')
  AND permiso.nombre = 'READ_POSTVENTA_PLATAFORMA_DIGITAL'
  AND NOT EXISTS (
      SELECT 1
      FROM rol_permiso asignacion
      WHERE asignacion.rol_id = rol.id
        AND asignacion.permiso_id = permiso.id
  );
