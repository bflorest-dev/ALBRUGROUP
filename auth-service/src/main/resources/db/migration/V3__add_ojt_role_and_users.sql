-- Rol OJT para postulantes que realizan practica operativa como asesores de venta.
INSERT INTO roles (nombre, descripcion)
VALUES ('OJT', 'On the job training - Gestion de leads asignados')
ON CONFLICT (nombre) DO UPDATE
SET descripcion = EXCLUDED.descripcion;

-- OJT hereda los permisos operativos actuales de ASESOR_VENTAS.
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT ojt.id, rp.permiso_id
FROM roles ojt
JOIN roles asesor ON asesor.nombre = 'ASESOR_VENTAS'
JOIN rol_permiso rp ON rp.rol_id = asesor.id
WHERE ojt.nombre = 'OJT'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

CREATE TEMP TABLE seed_ojt_users (
    empleado_id BIGINT,
    usuario_id BIGINT,
    numero_documento TEXT,
    email TEXT,
    username TEXT,
    nombre_completo TEXT
);

INSERT INTO seed_ojt_users (
    empleado_id,
    usuario_id,
    numero_documento,
    email,
    username,
    nombre_completo
)
SELECT
    900000 + n,
    910000 + n,
    (70000000 + n)::TEXT,
    'OJT' || LPAD(n::TEXT, 2, '0') || '@gmail.com',
    'OJT' || LPAD(n::TEXT, 2, '0') || '@albru.ojt.pe',
    'OJT ' || LPAD(n::TEXT, 2, '0')
FROM generate_series(1, 40) AS gs(n);

INSERT INTO usuarios (
    id,
    username,
    password,
    email,
    empleado_id,
    dni,
    nombre_completo,
    activo,
    password_inicializada,
    created_at,
    updated_at
)
OVERRIDING SYSTEM VALUE
SELECT
    su.usuario_id,
    su.username,
    '$2a$10$EuVlRz.tIqNAnsOhz6zKpORDWllZ9/hRPPSCphurSpMG1XP3NC0tC',
    su.email,
    su.empleado_id,
    su.numero_documento,
    su.nombre_completo,
    TRUE,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM seed_ojt_users su
ON CONFLICT (id) DO UPDATE
SET username = EXCLUDED.username,
    password = EXCLUDED.password,
    email = EXCLUDED.email,
    empleado_id = EXCLUDED.empleado_id,
    dni = EXCLUDED.dni,
    nombre_completo = EXCLUDED.nombre_completo,
    activo = EXCLUDED.activo,
    password_inicializada = EXCLUDED.password_inicializada,
    created_at = COALESCE(usuarios.created_at, EXCLUDED.created_at),
    updated_at = CURRENT_TIMESTAMP;

DELETE FROM usuario_rol ur
USING usuarios u, seed_ojt_users su
WHERE ur.usuario_id = u.id
  AND u.empleado_id = su.empleado_id;

INSERT INTO usuario_rol (usuario_id, rol_id)
SELECT u.id, r.id
FROM seed_ojt_users su
JOIN usuarios u ON u.empleado_id = su.empleado_id
JOIN roles r ON r.nombre = 'OJT'
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('usuarios', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM usuarios), 1),
    TRUE
);
