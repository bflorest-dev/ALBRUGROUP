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

DELETE FROM usuario_equipo ue
USING usuarios u, seed_users su
WHERE ue.usuario_id = u.id
  AND u.empleado_id = su.empleado_id
  AND su.puesto_trabajo = 'FREELANCE';

INSERT INTO usuario_equipo (usuario_id, equipo_id)
SELECT
    u.id,
    e.id
FROM seed_users su
JOIN usuarios u ON u.empleado_id = su.empleado_id
JOIN equipos e
  ON e.id = :freelance_equipo_id
 AND e.activo = TRUE
WHERE su.puesto_trabajo = 'FREELANCE'
ON CONFLICT (usuario_id, equipo_id) DO NOTHING;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM seed_users su
        JOIN usuarios u ON u.empleado_id = su.empleado_id
        LEFT JOIN usuario_equipo ue ON ue.usuario_id = u.id
        WHERE su.puesto_trabajo = 'FREELANCE'
        GROUP BY u.id
        HAVING COUNT(ue.equipo_id) <> 1
    ) THEN
        RAISE EXCEPTION 'Every seeded FREELANCE user must belong to exactly one active team';
    END IF;
END
$$;
