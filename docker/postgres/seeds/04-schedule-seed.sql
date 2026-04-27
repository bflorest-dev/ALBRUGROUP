CREATE TEMP TABLE seed_politica_modalidad (
    modalidad TEXT,
    horas_objetivo_semanal INTEGER,
    horas_objetivo_mensual INTEGER,
    minutos_almuerzo INTEGER,
    minutos_servicios INTEGER
);

INSERT INTO seed_politica_modalidad (
    modalidad,
    horas_objetivo_semanal,
    horas_objetivo_mensual,
    minutos_almuerzo,
    minutos_servicios
) VALUES
('PART_TIME', 24, 96, 30, 20),
('SEMI_FULL', 36, 144, 45, 25),
('FULL_TIME', 48, 192, 60, 30),
('SUPER_FULL', 54, 216, 60, 35);

INSERT INTO politica_modalidad (
    modalidad,
    horas_objetivo_semanal,
    horas_objetivo_mensual,
    minutos_almuerzo,
    minutos_servicios
)
SELECT
    modalidad,
    horas_objetivo_semanal,
    horas_objetivo_mensual,
    minutos_almuerzo,
    minutos_servicios
FROM seed_politica_modalidad
ON CONFLICT (modalidad) DO UPDATE
SET horas_objetivo_semanal = EXCLUDED.horas_objetivo_semanal,
    horas_objetivo_mensual = EXCLUDED.horas_objetivo_mensual,
    minutos_almuerzo = EXCLUDED.minutos_almuerzo,
    minutos_servicios = EXCLUDED.minutos_servicios;
