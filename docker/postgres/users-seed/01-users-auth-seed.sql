CREATE TEMP TABLE seed_users (
    empleado_id BIGINT,
    usuario_id BIGINT,
    contrato_id BIGINT,
    horario_id BIGINT,
    nombres TEXT,
    apellidos TEXT,
    puesto_trabajo TEXT,
    numero_documento TEXT,
    correo_personal TEXT,
    username TEXT,
    celular_personal TEXT,
    fecha_nacimiento DATE,
    direccion TEXT,
    cuenta_bancaria TEXT,
    cuenta_interbancaria TEXT
);

\copy seed_users FROM '/seeds/users-seed.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

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
    su.correo_personal,
    su.empleado_id,
    su.numero_documento,
    su.nombres || ' ' || su.apellidos,
    TRUE,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM seed_users su
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
USING usuarios u, seed_users su
WHERE ur.usuario_id = u.id
  AND u.empleado_id = su.empleado_id;

INSERT INTO usuario_rol (usuario_id, rol_id)
SELECT
    u.id,
    r.id
FROM seed_users su
JOIN usuarios u ON u.empleado_id = su.empleado_id
JOIN roles r ON r.nombre = su.puesto_trabajo;

SELECT setval(
    pg_get_serial_sequence('usuarios', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM usuarios), 1),
    TRUE
);
