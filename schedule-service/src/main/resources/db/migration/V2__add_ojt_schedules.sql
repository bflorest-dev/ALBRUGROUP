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

CREATE TEMP TABLE seed_ojt_horarios (
    empleado_id BIGINT,
    contrato_id BIGINT,
    horario_id BIGINT
);

INSERT INTO seed_ojt_horarios (empleado_id, contrato_id, horario_id)
SELECT
    900000 + n,
    920000 + n,
    930000 + n
FROM generate_series(1, 40) AS gs(n);

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
    so.horario_id,
    so.empleado_id,
    so.contrato_id,
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
FROM seed_ojt_horarios so
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
USING seed_ojt_horarios so
WHERE hd.horario_id = so.horario_id;

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
    so.horario_id,
    dias.dia,
    TIME '06:00',
    TIME '22:00',
    NULL,
    NULL,
    TRUE
FROM seed_ojt_horarios so
CROSS JOIN (
    VALUES
        ('LUNES'),
        ('MARTES'),
        ('MIERCOLES'),
        ('JUEVES'),
        ('VIERNES'),
        ('SABADO')
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
