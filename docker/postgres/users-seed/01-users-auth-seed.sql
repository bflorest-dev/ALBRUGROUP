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
    cuenta_interbancaria TEXT,
    hora_entrada TIME,
    hora_salida TIME,
    inicio_almuerzo TIME,
    fin_almuerzo TIME
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

CREATE TEMP TABLE seed_equipos (
    id BIGINT,
    nombre TEXT,
    descripcion TEXT
);

INSERT INTO seed_equipos (id, nombre, descripcion) VALUES
(101, 'Equipo Demo 1', 'Equipo de prueba para usuarios operativos'),
(102, 'Equipo Demo 2', 'Equipo de prueba para usuarios operativos'),
(103, 'Equipo Demo 3', 'Equipo de prueba para usuarios operativos');

INSERT INTO equipos (
    id,
    nombre,
    descripcion,
    activo,
    created_at,
    updated_at
)
SELECT
    se.id,
    se.nombre,
    se.descripcion,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM seed_equipos se
ON CONFLICT (id) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    activo = EXCLUDED.activo,
    created_at = COALESCE(equipos.created_at, EXCLUDED.created_at),
    updated_at = CURRENT_TIMESTAMP;

CREATE TEMP TABLE seed_usuario_equipo (
    empleado_id BIGINT,
    equipo_id BIGINT
);

INSERT INTO seed_usuario_equipo (empleado_id, equipo_id) VALUES
(1025, 101),
(1052, 102),
(1053, 103),
(1026, 101),
(1054, 102),
(1055, 103),
(1027, 101),
(1056, 102),
(1057, 103),
(1028, 101),
(1058, 102),
(1059, 103),
(1029, 101),
(1060, 102),
(1061, 103),
(1030, 101),
(1062, 102),
(1063, 103),
(1034, 101),
(1064, 102),
(1065, 103),
(1035, 101),
(1066, 102),
(1067, 103),
(1036, 101),
(1068, 102),
(1069, 103),
(1040, 101),
(1070, 102),
(1071, 103),
(1041, 101),
(1072, 102),
(1073, 103),
(1042, 101),
(1074, 102),
(1075, 103);

DELETE FROM usuario_equipo ue
USING usuarios u, seed_usuario_equipo sue
WHERE ue.usuario_id = u.id
  AND u.empleado_id = sue.empleado_id;

INSERT INTO usuario_equipo (usuario_id, equipo_id)
SELECT
    u.id,
    sue.equipo_id
FROM seed_usuario_equipo sue
JOIN usuarios u ON u.empleado_id = sue.empleado_id
JOIN equipos e ON e.id = sue.equipo_id
ON CONFLICT (usuario_id, equipo_id) DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('equipos', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM equipos), 1),
    TRUE
);
