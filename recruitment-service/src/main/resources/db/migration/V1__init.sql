-- ============================================================
-- recruitment_db  –  baseline V1
-- Generado a partir de las entidades JPA de recruitment-service.
-- ============================================================

CREATE TABLE tipificacion (
    id          BIGSERIAL PRIMARY KEY,
    etapa       VARCHAR(255),
    codigo      VARCHAR(255),
    descripcion VARCHAR(255),
    orden       INTEGER,
    activo      BOOLEAN,
    CONSTRAINT uk_tipificacion_etapa_codigo UNIQUE (etapa, codigo)
);

CREATE TABLE subtipificacion (
    id                    BIGSERIAL PRIMARY KEY,
    tipificacion_id       BIGINT REFERENCES tipificacion(id),
    codigo                VARCHAR(255),
    descripcion           VARCHAR(255),
    orden                 INTEGER,
    alcance               VARCHAR(255),
    etapa_destino         VARCHAR(255),
    estado_destino        VARCHAR(255),
    estado_bandeja_destino VARCHAR(255),
    activo                BOOLEAN,
    CONSTRAINT uk_subtipificacion_tipificacion_codigo UNIQUE (tipificacion_id, codigo)
);

CREATE TABLE postulante (
    id               BIGSERIAL PRIMARY KEY,
    nombres          VARCHAR(255),
    apellidos        VARCHAR(255),
    tipo_documento   VARCHAR(255),
    documento        VARCHAR(255),
    celular          VARCHAR(255),
    fecha_nacimiento DATE,
    lista_negra      BOOLEAN,
    created_at       TIMESTAMP WITH TIME ZONE,
    updated_at       TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_postulante_tipo_documento_documento UNIQUE (tipo_documento, documento)
);

CREATE TABLE oferta_laboral (
    id               BIGSERIAL PRIMARY KEY,
    codigo           VARCHAR(255),
    id_solicitante   BIGINT,
    negocio          VARCHAR(255),
    puesto_objetivo  VARCHAR(255),
    modalidad        VARCHAR(255),
    horario          VARCHAR(255),
    cantidad_inicial INTEGER,
    plazo_inicial    DATE,
    estado           VARCHAR(255),
    created_at       TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_oferta_laboral_codigo UNIQUE (codigo)
);

CREATE TABLE oferta_ampliacion (
    id               BIGSERIAL PRIMARY KEY,
    id_solicitante   BIGINT,
    oferta_laboral_id BIGINT NOT NULL REFERENCES oferta_laboral(id),
    cantidad         INTEGER,
    plazo            DATE,
    created_at       TIMESTAMP WITH TIME ZONE
);

CREATE TABLE postulacion (
    id                      BIGSERIAL PRIMARY KEY,
    postulante_id           BIGINT REFERENCES postulante(id),
    oferta_laboral_id       BIGINT REFERENCES oferta_laboral(id),
    id_empleado_registrador BIGINT,
    origen                  VARCHAR(255),
    etapa                   VARCHAR(255),
    estado                  VARCHAR(255),
    estado_bandeja          VARCHAR(255),
    created_at              TIMESTAMP WITH TIME ZONE,
    updated_at              TIMESTAMP WITH TIME ZONE
);

CREATE TABLE evento (
    id                      BIGSERIAL PRIMARY KEY,
    postulacion_id          BIGINT REFERENCES postulacion(id),
    id_empleado_responsable BIGINT,
    etapa                   VARCHAR(255),
    accion                  VARCHAR(255),
    modalidad_contacto      VARCHAR(255),
    id_tipificacion         BIGINT,
    id_subtipificacion      BIGINT,
    tipificacion            VARCHAR(255),
    subtipificacion         VARCHAR(255),
    observacion             VARCHAR(255),
    created_at              TIMESTAMP WITH TIME ZONE
);

CREATE TABLE grupo_capacitacion (
    id             BIGSERIAL PRIMARY KEY,
    codigo         VARCHAR(255),
    id_capacitador BIGINT,
    turno          VARCHAR(255),
    sala           VARCHAR(255),
    fecha_inicio   DATE,
    fecha_fin      DATE,
    estado         VARCHAR(255),
    created_at     TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_grupo_capacitacion_codigo UNIQUE (codigo)
);

CREATE TABLE grupo_capacitacion_detalle (
    id                      BIGSERIAL PRIMARY KEY,
    grupo_capacitacion_id   BIGINT REFERENCES grupo_capacitacion(id),
    postulacion_id          BIGINT REFERENCES postulacion(id),
    estado_capacitacion     VARCHAR(255),
    fecha_asignacion        DATE,
    fecha_resultado         DATE,
    id_empleado_contratado  BIGINT,
    fecha_contratacion      DATE,
    cumplio_tres_meses      BOOLEAN,
    fecha_cumplio_tres_meses DATE,
    created_at              TIMESTAMP WITH TIME ZONE,
    updated_at              TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_grupo_capacitacion_detalle_postulacion UNIQUE (postulacion_id)
);
