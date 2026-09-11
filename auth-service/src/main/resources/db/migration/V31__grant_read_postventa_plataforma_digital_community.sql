INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT rol.id, permiso.id
FROM roles rol
JOIN permisos permiso ON permiso.nombre = 'READ_POSTVENTA_PLATAFORMA_DIGITAL'
WHERE rol.nombre = 'COMMUNITY'
  AND NOT EXISTS (
      SELECT 1
      FROM rol_permiso asignacion
      WHERE asignacion.rol_id = rol.id
        AND asignacion.permiso_id = permiso.id
  );
