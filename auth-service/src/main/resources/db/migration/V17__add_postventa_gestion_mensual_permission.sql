INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT p.nombre, p.descripcion, p.recurso, p.accion
FROM (
    VALUES
        ('READ_POSTVENTA_GESTION_MENSUAL', 'Puede ver las metricas de gestion mensual de postventa', 'POSTVENTA_FACTURACION', 'READ')
) AS p(nombre, descripcion, recurso, accion)
WHERE NOT EXISTS (
    SELECT 1
    FROM permisos existente
    WHERE existente.nombre = p.nombre
);

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT rol.id, permiso.id
FROM roles rol
CROSS JOIN permisos permiso
WHERE rol.nombre = 'ADMINISTRADOR'
  AND permiso.nombre = 'READ_POSTVENTA_GESTION_MENSUAL'
  AND NOT EXISTS (
      SELECT 1
      FROM rol_permiso asignacion
      WHERE asignacion.rol_id = rol.id
        AND asignacion.permiso_id = permiso.id
  );
