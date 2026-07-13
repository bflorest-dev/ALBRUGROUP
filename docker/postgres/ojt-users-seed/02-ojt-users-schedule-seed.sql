CREATE TEMP TABLE seed_ojt_users (
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

\copy seed_ojt_users FROM '/seeds/ojt-users-seed.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

INSERT INTO politica_modalidad (
    modalidad,
    horas_objetivo_semanal,
    horas_objetivo_mensual,
    minutos_almuerzo,
    minutos_servicios
)
VALUES ('FULL_TIME', 48, 192, 60, 30)
ON CONFLICT (modalidad) DO UPDATE
SET horas_objetivo_semanal = EXCLUDED.horas_objetivo_semanal,
    horas_objetivo_mensual = EXCLUDED.horas_objetivo_mensual,
    minutos_almuerzo = EXCLUDED.minutos_almuerzo,
    minutos_servicios = EXCLUDED.minutos_servicios;

INSERT INTO horario (
    id,
    id_empleado,
    id_contrato,
    modalidad_contrato,
    politica_modalidad_id,
    horas_objetivo_semanal,
    horas_objetivo_mensual,
    minutos_almuerzo,
    minutos_servicios,
    fecha_inicio,
    fecha_fin,
    compensable,
    created_at,
    updated_at
)
OVERRIDING SYSTEM VALUE
SELECT
    su.horario_id,
    su.empleado_id,
    su.contrato_id,
    pm.modalidad,
    pm.id,
    pm.horas_objetivo_semanal,
    pm.horas_objetivo_mensual,
    pm.minutos_almuerzo,
    pm.minutos_servicios,
    DATE '2026-06-01',
    NULL,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM seed_ojt_users su
JOIN politica_modalidad pm ON pm.modalidad = 'FULL_TIME'
ON CONFLICT (id) DO UPDATE
SET id_empleado = EXCLUDED.id_empleado,
    id_contrato = EXCLUDED.id_contrato,
    modalidad_contrato = EXCLUDED.modalidad_contrato,
    politica_modalidad_id = EXCLUDED.politica_modalidad_id,
    horas_objetivo_semanal = EXCLUDED.horas_objetivo_semanal,
    horas_objetivo_mensual = EXCLUDED.horas_objetivo_mensual,
    minutos_almuerzo = EXCLUDED.minutos_almuerzo,
    minutos_servicios = EXCLUDED.minutos_servicios,
    fecha_inicio = EXCLUDED.fecha_inicio,
    fecha_fin = EXCLUDED.fecha_fin,
    compensable = EXCLUDED.compensable,
    created_at = COALESCE(horario.created_at, EXCLUDED.created_at),
    updated_at = CURRENT_TIMESTAMP;

DELETE FROM horario_detalle hd
USING horario h, seed_ojt_users su
WHERE hd.horario_id = h.id
  AND h.id = su.horario_id;

INSERT INTO horario_detalle (
    horario_id,
    dia,
    hora_entrada,
    hora_salida,
    inicio_almuerzo,
    fin_almuerzo,
    laborable
)
SELECT
    su.horario_id,
    dias.dia,
    su.hora_entrada,
    su.hora_salida,
    su.inicio_almuerzo,
    su.fin_almuerzo,
    TRUE
FROM seed_ojt_users su
CROSS JOIN (
    VALUES
        ('LUNES'),
        ('MARTES'),
        ('MIERCOLES'),
        ('JUEVES'),
        ('VIERNES'),
        ('SABADO'),
        ('DOMINGO')
) AS dias(dia);

SELECT setval(
    pg_get_serial_sequence('horario', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM horario), 1),
    TRUE
);

SELECT setval(
    pg_get_serial_sequence('horario_detalle', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM horario_detalle), 1),
    TRUE
);
