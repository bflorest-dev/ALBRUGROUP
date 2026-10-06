INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT permiso.nombre, permiso.descripcion, permiso.recurso, permiso.accion
FROM (
    VALUES
        ('CHANGE_CORTE_POSTVENTA', 'Puede cambiar el corte de facturacion de un lead en postventa', 'POSTVENTA_FACTURACION', 'UPDATE')
) AS permiso(nombre, descripcion, recurso, accion)
WHERE NOT EXISTS (
    SELECT 1
    FROM permisos existente
    WHERE existente.nombre = permiso.nombre
);

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT rol.id, permiso.id
FROM roles rol
CROSS JOIN permisos permiso
WHERE rol.nombre IN ('ADMINISTRADOR', 'ASESOR_POSTVENTA', 'SUPERVISOR_POSTVENTA')
  AND permiso.nombre = 'CHANGE_CORTE_POSTVENTA'
  AND NOT EXISTS (
      SELECT 1
      FROM rol_permiso asignacion
      WHERE asignacion.rol_id = rol.id
        AND asignacion.permiso_id = permiso.id
  );
