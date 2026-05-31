-- ============================================================
-- lead_db  –  baseline V1
-- Generado a partir de las entidades JPA de lead-service.
-- Orden de creación respeta dependencias FK.
-- ============================================================

-- ---- Catálogos geográficos ----

CREATE TABLE departamento (
    id     BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(2),
    nombre VARCHAR(255),
    CONSTRAINT uk_departamento_codigo UNIQUE (codigo)
);

CREATE TABLE provincia (
    id              BIGSERIAL PRIMARY KEY,
    codigo          VARCHAR(4),
    nombre          VARCHAR(255),
    departamento_id BIGINT NOT NULL REFERENCES departamento(id),
    CONSTRAINT uk_provincia_departamento_codigo UNIQUE (departamento_id, codigo)
);

CREATE TABLE distrito (
    id              BIGSERIAL PRIMARY KEY,
    codigo          VARCHAR(6) NOT NULL,
    nombre          VARCHAR(255) NOT NULL,
    provincia_id    BIGINT REFERENCES provincia(id),
    departamento_id BIGINT REFERENCES departamento(id),
    CONSTRAINT uk_distrito_codigo UNIQUE (codigo)
);

-- ---- Catálogos de servicio ----

CREATE TABLE proveedor (
    id                BIGSERIAL PRIMARY KEY,
    nombre            VARCHAR(255),
    meses_permanencia INTEGER,
    activo            BOOLEAN,
    created_at        TIMESTAMP WITH TIME ZONE
);

CREATE TABLE proveedor_corte_facturacion (
    id_proveedor BIGINT NOT NULL REFERENCES proveedor(id),
    dia_corte    INTEGER
);

CREATE TABLE zona (
    id         BIGSERIAL PRIMARY KEY,
    nombre     VARCHAR(255),
    activo     BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE zona_regla (
    id               BIGSERIAL PRIMARY KEY,
    zona_id          BIGINT      NOT NULL REFERENCES zona(id),
    nivel_geografico VARCHAR(255) NOT NULL,
    geo_id           BIGINT      NOT NULL,
    criterio         VARCHAR(255) NOT NULL,
    created_at       TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_zona_regla UNIQUE (zona_id, nivel_geografico, geo_id, criterio)
);

CREATE TABLE cuenta_publicitaria (
    id             BIGSERIAL PRIMARY KEY,
    numero_cuenta  VARCHAR(255),
    nombre_cuenta  VARCHAR(255),
    activo         BOOLEAN,
    created_at     TIMESTAMP WITH TIME ZONE
);

CREATE TABLE internet (
    id           BIGSERIAL PRIMARY KEY,
    velocidad    INTEGER,
    unidad       VARCHAR(255),
    tecnologia   VARCHAR(255),
    id_proveedor BIGINT REFERENCES proveedor(id),
    activo       BOOLEAN
);

CREATE TABLE television (
    id               BIGSERIAL PRIMARY KEY,
    nombre           VARCHAR(255),
    cantidad_canales INTEGER,
    id_proveedor     BIGINT REFERENCES proveedor(id),
    activo           BOOLEAN
);

CREATE TABLE telefono (
    id           BIGSERIAL PRIMARY KEY,
    minutos      INTEGER,
    descripcion  VARCHAR(255),
    id_proveedor BIGINT REFERENCES proveedor(id),
    activo       BOOLEAN
);

CREATE TABLE adicional (
    id              BIGSERIAL PRIMARY KEY,
    nombre          VARCHAR(255),
    precio_unitario NUMERIC(38, 2),
    id_proveedor    BIGINT REFERENCES proveedor(id),
    activo          BOOLEAN
);

CREATE TABLE plan (
    id                      BIGSERIAL PRIMARY KEY,
    id_proveedor            BIGINT REFERENCES proveedor(id),
    nombre                  VARCHAR(255),
    precio                  NUMERIC(38, 2),
    precio_promocional      NUMERIC(38, 2),
    meses_promocion_precio  INTEGER,
    vigencia_desde          DATE,
    vigencia_hasta          DATE,
    id_internet             BIGINT REFERENCES internet(id),
    id_television           BIGINT REFERENCES television(id),
    id_telefono             BIGINT REFERENCES telefono(id),
    velocidad_promocional   INTEGER,
    meses_promocion_velocidad INTEGER,
    id_zona                 BIGINT REFERENCES zona(id),
    activo                  BOOLEAN
);

CREATE TABLE plan_adicional (
    id                       BIGSERIAL PRIMARY KEY,
    id_plan                  BIGINT NOT NULL REFERENCES plan(id),
    id_adicional             BIGINT NOT NULL REFERENCES adicional(id),
    cantidad_incluida        INTEGER,
    permite_compra_adicional BOOLEAN,
    cantidad_maxima_adicional INTEGER,
    activo                   BOOLEAN
);

CREATE TABLE campana (
    id                    BIGSERIAL PRIMARY KEY,
    nombre                VARCHAR(255),
    prefijo               VARCHAR(255),
    numero_whats_app      VARCHAR(255),
    id_cuenta_publicitaria BIGINT REFERENCES cuenta_publicitaria(id),
    id_proveedor          BIGINT REFERENCES proveedor(id),
    activo                BOOLEAN,
    created_at            TIMESTAMP WITH TIME ZONE,
    updated_at            TIMESTAMP WITH TIME ZONE
);

-- ---- Catálogos de tipificación ----

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
    id                      BIGSERIAL PRIMARY KEY,
    tipificacion_id         BIGINT REFERENCES tipificacion(id),
    codigo                  VARCHAR(255),
    descripcion             VARCHAR(255),
    orden                   INTEGER,
    etapa_cambio            VARCHAR(255),
    estado_postventa_cambio VARCHAR(255),
    activo                  BOOLEAN,
    CONSTRAINT uk_subtipificacion_tipificacion_codigo UNIQUE (tipificacion_id, codigo)
);

-- ---- Promociones ----

CREATE TABLE promocion_comercial (
    id              BIGSERIAL PRIMARY KEY,
    regla_comercial VARCHAR(255),
    id_proveedor    BIGINT REFERENCES proveedor(id),
    id_zona         BIGINT REFERENCES zona(id),
    activo          BOOLEAN,
    created_at      TIMESTAMP WITH TIME ZONE
);

CREATE TABLE promocion_comercial_plan (
    id_promocion_comercial BIGINT NOT NULL REFERENCES promocion_comercial(id),
    id_plan                BIGINT NOT NULL REFERENCES plan(id),
    PRIMARY KEY (id_promocion_comercial, id_plan)
);

-- ---- Datos preventa y dirección (sin FK a lead) ----

CREATE TABLE datos_preventa (
    id                                       BIGSERIAL PRIMARY KEY,
    tipo_documento                           VARCHAR(255),
    numero_documento_titular_servicio        VARCHAR(255),
    ubigeo_nacimiento                        VARCHAR(6),
    nombre_titular_servicio                  VARCHAR(255),
    celular_registro                         VARCHAR(255),
    celular_referencia                       VARCHAR(255),
    correo                                   VARCHAR(255),
    nombre_madre                             VARCHAR(255),
    nombre_padre                             VARCHAR(255),
    numero_documento_titular_celular_registro VARCHAR(255),
    nombre_titular_celular_registro          VARCHAR(255)
);

CREATE TABLE direccion (
    id                 BIGSERIAL PRIMARY KEY,
    ubigeo_domicilio   VARCHAR(6),
    tipo_domicilio     VARCHAR(255),
    tipo_via           VARCHAR(255),
    via                VARCHAR(255),
    direccion          VARCHAR(255),
    referencia         VARCHAR(255),
    latitud            NUMERIC(38, 2),
    longitud           NUMERIC(38, 2),
    urbanizacion       VARCHAR(255),
    numero             VARCHAR(255),
    manzana            VARCHAR(255),
    lote               VARCHAR(255),
    nombre_edificio    VARCHAR(255),
    nombre_condominio  VARCHAR(255),
    plano              VARCHAR(255),
    piso               VARCHAR(255),
    interior           VARCHAR(255)
);

-- ---- Lead (tabla central) ----

CREATE TABLE lead (
    id                                         BIGSERIAL PRIMARY KEY,
    prefijo                                    VARCHAR(255),
    lead                                       VARCHAR(255),
    etapa                                      VARCHAR(255),
    estado                                     VARCHAR(255),
    id_asesor_asignado                         BIGINT,
    nombre_asesor_asignado                     VARCHAR(255),
    id_campana                                 BIGINT REFERENCES campana(id),
    base                                       VARCHAR(255),
    id_tipificacion                            BIGINT,
    codigo_tipificacion                        VARCHAR(255),
    id_subtipificacion                         BIGINT,
    codigo_subtipificacion                     VARCHAR(255),
    primera_codigo_tipificacion                VARCHAR(255),
    primera_codigo_subtipificacion             VARCHAR(255),
    numero_documento_titular_servicio_snapshot VARCHAR(255),
    direccion_snapshot                         VARCHAR(255),
    id_datos_preventa                          BIGINT REFERENCES datos_preventa(id),
    id_direccion                               BIGINT REFERENCES direccion(id),
    id_plan                                    BIGINT REFERENCES plan(id),
    nombre_plan_snapshot                       VARCHAR(255),
    nombre_proveedor_snapshot                  VARCHAR(255),
    precio_plan_snapshot                       NUMERIC(38, 2),
    id_promocion_interna                       BIGINT REFERENCES promocion_comercial(id),
    nombre_promocion_interna_snapshot          VARCHAR(255),
    precio_adicionales_snapshot                NUMERIC(38, 2),
    precio_final                               NUMERIC(38, 2),
    dia_corte_facturacion                      INTEGER,
    meses_permanencia_snapshot                 INTEGER,
    estado_postventa                           VARCHAR(255),
    created_at                                 TIMESTAMP WITH TIME ZONE,
    last_entry_at                              TIMESTAMP WITH TIME ZONE,
    updated_at                                 TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_lead_etapa_last_entry_at ON lead (etapa, last_entry_at);
CREATE INDEX idx_lead_prefijo_lead        ON lead (prefijo, lead);
CREATE INDEX idx_lead_estado              ON lead (estado);

-- ---- Adicionales del lead ----

CREATE TABLE lead_adicional (
    id              BIGSERIAL PRIMARY KEY,
    id_lead         BIGINT NOT NULL REFERENCES lead(id),
    id_adicional    BIGINT NOT NULL REFERENCES adicional(id),
    cantidad        INTEGER,
    precio_unitario NUMERIC(38, 2),
    subtotal        NUMERIC(38, 2)
);

-- ---- Eventos del lead ----

CREATE TABLE evento (
    id                     BIGSERIAL PRIMARY KEY,
    id_lead                BIGINT,
    id_campana             BIGINT,
    id_actor               BIGINT,
    nombre_actor           VARCHAR(255),
    rol_actor              VARCHAR(255),
    id_asesor_asignado     BIGINT,
    nombre_asesor_asignado VARCHAR(255),
    id_plan_ofrecido       BIGINT,
    accion                 VARCHAR(255),
    etapa                  VARCHAR(255),
    tipificacion           VARCHAR(255),
    subtipificacion        VARCHAR(255),
    fecha_instalacion      DATE,
    comentario             VARCHAR(255),
    hora_programada        TIME,
    created_at             TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_evento_id_lead_created_at        ON evento (id_lead, created_at);
CREATE INDEX idx_evento_id_actor_created_at       ON evento (id_actor, created_at);
CREATE INDEX idx_evento_id_lead_accion_created_at ON evento (id_lead, accion, created_at);

-- ---- Gasto de campaña ----

CREATE TABLE campana_gasto_registro (
    id              BIGSERIAL PRIMARY KEY,
    id_campana      BIGINT       NOT NULL REFERENCES campana(id),
    leads           INTEGER      NOT NULL,
    leads_reales    INTEGER      NOT NULL,
    ventas_cerradas INTEGER      NOT NULL,
    costo_total     NUMERIC(12, 2) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE,
    updated_at      TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_campana_gasto_campana_created ON campana_gasto_registro (id_campana, created_at);
CREATE INDEX idx_campana_gasto_created         ON campana_gasto_registro (created_at);

-- ---- Encuesta postventa ----

CREATE TABLE encuesta_postventa (
    id                   BIGSERIAL PRIMARY KEY,
    id_lead              BIGINT NOT NULL REFERENCES lead(id),
    calificacion_asesor  INTEGER,
    calificacion_servicio INTEGER,
    created_at           TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_encuesta_postventa_lead_created_at ON encuesta_postventa (id_lead, created_at);

-- ---- Pago postventa ----

CREATE TABLE pago_postventa (
    id                    BIGSERIAL PRIMARY KEY,
    id_lead               BIGINT NOT NULL REFERENCES lead(id),
    aportante             VARCHAR(255),
    estado                VARCHAR(255),
    monto                 NUMERIC(38, 2),
    fecha_emision         DATE,
    fecha_vencimiento     DATE,
    fecha_pago            DATE,
    fecha_compromiso_pago DATE,
    created_at            TIMESTAMP WITH TIME ZONE,
    updated_at            TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_pago_postventa_lead_estado ON pago_postventa (id_lead, estado);
CREATE INDEX idx_pago_postventa_vencimiento ON pago_postventa (fecha_vencimiento);
