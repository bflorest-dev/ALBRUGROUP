INSERT INTO roles (nombre, descripcion)
VALUES ('FREELANCE', 'Registro y seguimiento personal de ventas')
ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion;

INSERT INTO permisos (nombre, descripcion, recurso, accion)
VALUES
    ('FREELANCE_READ', 'Puede consultar su seguimiento personal de ventas', 'FREELANCE_VENTA', 'READ'),
    ('FREELANCE_CREATE', 'Puede registrar ventas freelance', 'FREELANCE_VENTA', 'CREATE'),
    ('FREELANCE_CORRECT', 'Puede corregir y reenviar sus ventas retornadas', 'FREELANCE_VENTA', 'CORRECT')
ON CONFLICT (nombre) DO UPDATE
SET descripcion = EXCLUDED.descripcion,
    recurso = EXCLUDED.recurso,
    accion = EXCLUDED.accion;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.nombre IN (
    'FREELANCE_READ', 'FREELANCE_CREATE', 'FREELANCE_CORRECT',
    'READ_UBIGEO', 'READ_ASISTENCIAS_SELF', 'UPDATE_ASISTENCIAS'
)
WHERE r.nombre = 'FREELANCE'
ON CONFLICT DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.nombre IN ('FREELANCE_READ', 'FREELANCE_CREATE', 'FREELANCE_CORRECT')
WHERE r.nombre = 'ADMINISTRADOR'
ON CONFLICT DO NOTHING;
