CREATE TABLE ajuste_jornada (
    id                    BIGSERIAL PRIMARY KEY,
    id_empleado           BIGINT       NOT NULL,
    horario_id            BIGINT       NOT NULL REFERENCES horario(id),
    fecha_operativa       DATE         NOT NULL,
    inicio                TIMESTAMP    NOT NULL,
    fin                   TIMESTAMP    NOT NULL,
    estado                VARCHAR(20)  NOT NULL,
    origen                VARCHAR(30)  NOT NULL,
    motivo                VARCHAR(300) NOT NULL,
    creado_por            BIGINT       NOT NULL,
    reemplazado_por_id    BIGINT REFERENCES ajuste_jornada(id),
    created_at            TIMESTAMP WITH TIME ZONE,
    updated_at            TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ajuste_jornada_rango_check CHECK (fin > inicio),
    CONSTRAINT ajuste_jornada_estado_check CHECK (estado IN ('ACTIVO', 'REEMPLAZADO', 'CANCELADO')),
    CONSTRAINT ajuste_jornada_origen_check CHECK (origen IN ('REEMPLAZO_BASE', 'JORNADA_EXTRAORDINARIA', 'TRAMO_ADICIONAL'))
);

CREATE INDEX idx_ajuste_jornada_empleado_fecha_estado
    ON ajuste_jornada (id_empleado, fecha_operativa, estado);

CREATE INDEX idx_ajuste_jornada_horario
    ON ajuste_jornada (horario_id);

ALTER TABLE asistencia_tramo
    ADD COLUMN ajuste_jornada_id BIGINT REFERENCES ajuste_jornada(id),
    ADD COLUMN inicio_programado_at TIMESTAMP,
    ADD COLUMN fin_programado_at TIMESTAMP,
    ADD COLUMN fecha_hora_inicio_almuerzo TIMESTAMP,
    ADD COLUMN fecha_hora_fin_almuerzo TIMESTAMP,
    ADD COLUMN fecha_hora_inicio_servicios TIMESTAMP,
    ADD COLUMN fecha_hora_fin_servicios TIMESTAMP;

CREATE INDEX idx_asistencia_tramo_ajuste
    ON asistencia_tramo (ajuste_jornada_id);

ALTER TABLE asistencia
    ADD COLUMN ajuste_jornada_actual_id BIGINT REFERENCES ajuste_jornada(id),
    ADD COLUMN origen_tramo_actual VARCHAR(30);
