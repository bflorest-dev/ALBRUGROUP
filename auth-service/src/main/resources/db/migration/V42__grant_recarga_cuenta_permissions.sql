-- Permisos para registrar y listar recargas de cuentas publicitarias

INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'REGISTRAR_RECARGA_CUENTA',
       'Puede registrar recargas de cuentas publicitarias',
       'CUENTA_PUBLICITARIA',
       'CREATE'
WHERE NOT EXISTS (
    SELECT 1 FROM permisos WHERE nombre = 'REGISTRAR_RECARGA_CUENTA'
);

INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'READ_RECARGAS_CUENTA',
       'Puede listar recargas de cuentas publicitarias',
       'CUENTA_PUBLICITARIA',
       'READ'
WHERE NOT EXISTS (
    SELECT 1 FROM permisos WHERE nombre = 'READ_RECARGAS_CUENTA'
);

-- Asignar ambos permisos al rol COMMUNITY
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'COMMUNITY'
  AND p.nombre = 'REGISTRAR_RECARGA_CUENTA'
  AND NOT EXISTS (
        SELECT 1 FROM rol_permiso rp
        WHERE rp.rol_id = r.id AND rp.permiso_id = p.id
  );

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'COMMUNITY'
  AND p.nombre = 'READ_RECARGAS_CUENTA'
  AND NOT EXISTS (
        SELECT 1 FROM rol_permiso rp
        WHERE rp.rol_id = r.id AND rp.permiso_id = p.id
  );

-- Asignar READ al ADMINISTRADOR para ver recargas en dashboard
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'ADMINISTRADOR'
  AND p.nombre = 'READ_RECARGAS_CUENTA'
  AND NOT EXISTS (
        SELECT 1 FROM rol_permiso rp
        WHERE rp.rol_id = r.id AND rp.permiso_id = p.id
  );
