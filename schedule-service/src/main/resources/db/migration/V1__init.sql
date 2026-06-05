-- ============================================================
-- schedule_db  –  baseline V1
-- Generado a partir de las entidades JPA de schedule-service.
-- ============================================================

CREATE TABLE politica_modalidad (
    id                    BIGSERIAL PRIMARY KEY,
    modalidad             VARCHAR(30) NOT NULL UNIQUE,
    horas_objetivo_semanal  INTEGER   NOT NULL,
    horas_objetivo_mensual  INTEGER   NOT NULL,
    minutos_almuerzo       INTEGER    NOT NULL,
    minutos_servicios      INTEGER    NOT NULL
);

CREATE TABLE horario (
    id                     BIGSERIAL PRIMARY KEY,
    id_empleado            BIGINT    NOT NULL,
    id_contrato            BIGINT    NOT NULL,
    modalidad_contrato     VARCHAR(30) NOT NULL,
    politica_modalidad_id  BIGINT    NOT NULL REFERENCES politica_modalidad(id),
    horas_objetivo_semanal INTEGER   NOT NULL,
    horas_objetivo_mensual INTEGER   NOT NULL,
    minutos_almuerzo       INTEGER   NOT NULL,
    minutos_servicios      INTEGER   NOT NULL,
    fecha_inicio           DATE      NOT NULL,
    fecha_fin              DATE,
    compensable            BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMP WITH TIME ZONE,
    updated_at             TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_horario_empleado
    ON horario (id_empleado);

CREATE INDEX idx_horario_empleado_vigencia
    ON horario (id_empleado, fecha_inicio, fecha_fin);

CREATE TABLE horario_detalle (
    id           BIGSERIAL PRIMARY KEY,
    horario_id   BIGINT  NOT NULL REFERENCES horario(id),
    dia          VARCHAR(20) NOT NULL,
    hora_entrada TIME    NOT NULL,
    hora_salida  TIME    NOT NULL,
    inicio_almuerzo TIME,
    fin_almuerzo    TIME,
    laborable    BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_horario_detalle_dia UNIQUE (horario_id, dia)
);

CREATE INDEX idx_horario_detalle_horario
    ON horario_detalle (horario_id);

CREATE TABLE excepcion_horario (
    id           BIGSERIAL PRIMARY KEY,
    horario_id   BIGINT      NOT NULL REFERENCES horario(id),
    fecha        DATE        NOT NULL,
    tipo         VARCHAR(30) NOT NULL,
    hora_entrada TIME,
    hora_salida  TIME,
    inicio_almuerzo TIME,
    fin_almuerzo    TIME,
    laborable    BOOLEAN,
    motivo       VARCHAR(300) NOT NULL,
    CONSTRAINT uk_excepcion_horario_fecha UNIQUE (horario_id, fecha),
    CONSTRAINT excepcion_horario_tipo_check CHECK (tipo IN ('CAMBIO_COMPLETO','DIA_LIBRE','COMPENSACION','AMPLIACION'))
);

CREATE INDEX idx_excepcion_horario_horario
    ON excepcion_horario (horario_id);

CREATE TABLE asistencia (
    id                               BIGSERIAL PRIMARY KEY,
    id_empleado                      BIGINT      NOT NULL,
    id_horario                       BIGINT      NOT NULL,
    fecha                            DATE        NOT NULL,
    estado_actual                    VARCHAR(30) NOT NULL,
    entrada_programada               TIME,
    salida_programada                TIME,
    inicio_almuerzo_programado       TIME,
    fin_almuerzo_programado          TIME,
    fecha_hora_ingreso               TIMESTAMP,
    fecha_hora_salida                TIMESTAMP,
    fecha_hora_inicio_almuerzo       TIMESTAMP,
    fecha_hora_fin_almuerzo          TIMESTAMP,
    fecha_hora_inicio_servicios_actual TIMESTAMP,
    minutos_objetivo_dia             INTEGER     NOT NULL,
    minutos_trabajados               INTEGER     NOT NULL,
    minutos_balance                  INTEGER     NOT NULL,
    minutos_almuerzo_tomados         INTEGER     NOT NULL,
    minutos_servicios_permitidos     INTEGER     NOT NULL,
    minutos_servicios_acumulados     INTEGER     NOT NULL,
    excedio_servicios                BOOLEAN     NOT NULL,
    created_at                       TIMESTAMP WITH TIME ZONE,
    updated_at                       TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_asistencia_empleado_fecha UNIQUE (id_empleado, fecha)
);
