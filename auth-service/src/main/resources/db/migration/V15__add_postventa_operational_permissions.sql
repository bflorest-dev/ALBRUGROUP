INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT permiso.nombre, permiso.descripcion, permiso.recurso, permiso.accion
FROM (
    VALUES
        ('READ_POSTVENTA_FACTURACION', 'Puede consultar periodos, facturas y pagos de postventa', 'POSTVENTA_FACTURACION', 'READ'),
        ('UPDATE_POSTVENTA_FACTURACION', 'Puede confirmar facturas y cerrar periodos de postventa', 'POSTVENTA_FACTURACION', 'UPDATE'),
        ('READ_POSTVENTA_PLATAFORMA_DIGITAL', 'Puede consultar plataformas digitales, paquetes, credenciales y entregas', 'POSTVENTA_PLATAFORMA_DIGITAL', 'READ'),
        ('CREATE_POSTVENTA_PLATAFORMA_DIGITAL', 'Puede crear plataformas digitales, paquetes y credenciales', 'POSTVENTA_PLATAFORMA_DIGITAL', 'CREATE'),
        ('UPDATE_POSTVENTA_PLATAFORMA_DIGITAL', 'Puede entregar credenciales de plataformas digitales', 'POSTVENTA_PLATAFORMA_DIGITAL', 'UPDATE')
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
WHERE rol.nombre = 'ADMINISTRADOR'
  AND permiso.nombre IN (
      'READ_POSTVENTA_FACTURACION',
      'UPDATE_POSTVENTA_FACTURACION',
      'READ_POSTVENTA_PLATAFORMA_DIGITAL',
      'CREATE_POSTVENTA_PLATAFORMA_DIGITAL',
      'UPDATE_POSTVENTA_PLATAFORMA_DIGITAL'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM rol_permiso asignacion
      WHERE asignacion.rol_id = rol.id
        AND asignacion.permiso_id = permiso.id
  );

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT rol.id, permiso.id
FROM roles rol
CROSS JOIN permisos permiso
WHERE rol.nombre IN ('ASESOR_POSTVENTA', 'SUPERVISOR_POSTVENTA')
  AND permiso.nombre IN (
      'READ_POSTVENTA_FACTURACION',
      'UPDATE_POSTVENTA_FACTURACION',
      'READ_POSTVENTA_PLATAFORMA_DIGITAL',
      'UPDATE_POSTVENTA_PLATAFORMA_DIGITAL'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM rol_permiso asignacion
      WHERE asignacion.rol_id = rol.id
        AND asignacion.permiso_id = permiso.id
  );
