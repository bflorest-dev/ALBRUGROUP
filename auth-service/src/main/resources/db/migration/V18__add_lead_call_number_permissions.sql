INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT permiso.nombre, permiso.descripcion, 'LEAD_NUMERO_LLAMADA', permiso.accion
FROM (
    VALUES
        ('READ_LEAD_NUMEROS_LLAMADA', 'Puede listar los numeros disponibles para llamadas de un lead', 'READ'),
        ('UPDATE_LEAD_NUMERO_LLAMADA', 'Puede actualizar el numero operativo para llamar a un lead', 'UPDATE')
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
WHERE rol.nombre IN (
        'ADMINISTRADOR',
        'ASESOR_GTR',
        'ASESOR_VENTAS',
        'OJT',
        'SUPERVISOR_VENTAS',
        'ASESOR_BACKOFFICE',
        'SUPERVISOR_BACKOFFICE',
        'ASESOR_POSTVENTA',
        'SUPERVISOR_POSTVENTA'
    )
  AND permiso.nombre IN ('READ_LEAD_NUMEROS_LLAMADA', 'UPDATE_LEAD_NUMERO_LLAMADA')
  AND NOT EXISTS (
      SELECT 1
      FROM rol_permiso asignacion
      WHERE asignacion.rol_id = rol.id
        AND asignacion.permiso_id = permiso.id
  );
