-- Autorización por permisos para cada operación de equipos.
-- ADMINISTRADOR y RRHH reciben el conjunto completo; futuras asignaciones
-- o revocaciones se resuelven exclusivamente desde rol_permiso.

INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT permiso.nombre, permiso.descripcion, 'EQUIPO', permiso.accion
FROM (
    VALUES
        ('CREATE_EQUIPOS', 'Puede crear equipos', 'CREATE'),
        ('READ_EQUIPOS', 'Puede listar equipos e integrantes', 'READ'),
        ('UPDATE_EQUIPOS', 'Puede actualizar equipos', 'UPDATE'),
        ('DELETE_EQUIPOS', 'Puede eliminar equipos', 'DELETE'),
        ('ASSIGN_EQUIPOS', 'Puede asignar integrantes a equipos', 'ASSIGN')
) AS permiso(nombre, descripcion, accion)
WHERE NOT EXISTS (
    SELECT 1
    FROM permisos existente
    WHERE existente.nombre = permiso.nombre
);

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT rol.id, permiso.id
FROM roles rol
CROSS JOIN permisos permiso
WHERE rol.nombre IN ('ADMINISTRADOR', 'RRHH')
  AND permiso.nombre IN (
      'CREATE_EQUIPOS',
      'READ_EQUIPOS',
      'UPDATE_EQUIPOS',
      'DELETE_EQUIPOS',
      'ASSIGN_EQUIPOS'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM rol_permiso asignacion
      WHERE asignacion.rol_id = rol.id
        AND asignacion.permiso_id = permiso.id
  );
