-- =====================================================================
-- Arquitectura de datos POSTVENTA.
--
-- Fase 2: materializa las entidades nuevas y agrega columnas compatibles
-- a encuesta_postventa y pago_postventa. No elimina columnas antiguas aun
-- porque services/mappers actuales todavia compilan contra ellas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Catalogos e inventario de plataformas digitales
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS plataforma (
    id         BIGSERIAL PRIMARY KEY,
    nombre     VARCHAR(255) NOT NULL,
    activo     BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_plataforma_nombre ON plataforma (nombre);

ALTER TABLE lead
    ADD COLUMN IF NOT EXISTS id_plataforma_digital_ofrecida BIGINT REFERENCES plataforma(id);

CREATE INDEX IF NOT EXISTS idx_lead_plataforma_digital_ofrecida
    ON lead (id_plataforma_digital_ofrecida);

CREATE TABLE IF NOT EXISTS paquete_plataforma (
    id                           BIGSERIAL PRIMARY KEY,
    id_plataforma                BIGINT NOT NULL REFERENCES plataforma(id),
    nombre                       VARCHAR(255) NOT NULL,
    cantidad_meses               INTEGER,
    cantidad_usuarios            INTEGER,
    consume_creditos             BOOLEAN DEFAULT false,
    cantidad_creditos_consumidos INTEGER,
    precio_venta                 NUMERIC(38, 2),
    activo                       BOOLEAN DEFAULT true,
    created_at                   TIMESTAMP WITH TIME ZONE,
    updated_at                   TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_paquete_plataforma_plataforma ON paquete_plataforma (id_plataforma);
CREATE INDEX IF NOT EXISTS idx_paquete_plataforma_activo     ON paquete_plataforma (activo);

CREATE TABLE IF NOT EXISTS credencial_plataforma (
    id               BIGSERIAL PRIMARY KEY,
    id_paquete       BIGINT NOT NULL REFERENCES paquete_plataforma(id),
    usuario          VARCHAR(255) NOT NULL,
    password         VARCHAR(255) NOT NULL,
    fecha_creacion   DATE,
    fecha_expiracion DATE,
    estado           VARCHAR(255),
    observacion      VARCHAR(255),
    created_at       TIMESTAMP WITH TIME ZONE,
    updated_at       TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_credencial_plataforma_paquete    ON credencial_plataforma (id_paquete);
CREATE INDEX IF NOT EXISTS idx_credencial_plataforma_estado     ON credencial_plataforma (estado);
CREATE INDEX IF NOT EXISTS idx_credencial_plataforma_expiracion ON credencial_plataforma (fecha_expiracion);

CREATE TABLE IF NOT EXISTS marca_dispositivo (
    id         BIGSERIAL PRIMARY KEY,
    nombre     VARCHAR(255) NOT NULL,
    activo     BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_marca_dispositivo_nombre ON marca_dispositivo (nombre);

-- ---------------------------------------------------------------------
-- Entrega de credenciales al lead
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS entrega_credencial_plataforma (
    id                          BIGSERIAL PRIMARY KEY,
    id_credencial               BIGINT NOT NULL REFERENCES credencial_plataforma(id),
    id_lead                     BIGINT NOT NULL REFERENCES lead(id),
    cantidad_usuarios_asignados INTEGER,
    es_obsequio                 BOOLEAN DEFAULT true,
    monto_venta                 NUMERIC(38, 2),
    fecha_entrega               DATE,
    fecha_inicio_acceso         DATE,
    fecha_fin_acceso            DATE,
    estado                      VARCHAR(255),
    id_asesor_entrega           BIGINT,
    nombre_asesor_entrega       VARCHAR(255),
    observacion                 VARCHAR(255),
    created_at                  TIMESTAMP WITH TIME ZONE,
    updated_at                  TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_entrega_credencial_lead_estado
    ON entrega_credencial_plataforma (id_lead, estado);

CREATE INDEX IF NOT EXISTS idx_entrega_credencial_credencial_estado
    ON entrega_credencial_plataforma (id_credencial, estado);

CREATE TABLE IF NOT EXISTS entrega_credencial_dispositivo (
    id                      BIGSERIAL PRIMARY KEY,
    id_entrega_credencial   BIGINT NOT NULL REFERENCES entrega_credencial_plataforma(id),
    tipo_dispositivo        VARCHAR(255),
    id_marca_dispositivo    BIGINT REFERENCES marca_dispositivo(id),
    descripcion             VARCHAR(255),
    created_at              TIMESTAMP WITH TIME ZONE,
    updated_at              TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_entrega_dispositivo_entrega
    ON entrega_credencial_dispositivo (id_entrega_credencial);

CREATE INDEX IF NOT EXISTS idx_entrega_dispositivo_marca
    ON entrega_credencial_dispositivo (id_marca_dispositivo);

-- ---------------------------------------------------------------------
-- Calendario y periodos de facturacion postventa
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS calendario_facturacion_postventa (
    id                         BIGSERIAL PRIMARY KEY,
    id_lead                    BIGINT NOT NULL REFERENCES lead(id),
    fecha_instalacion          DATE,
    proveedor_snapshot         VARCHAR(255),
    plan_snapshot              VARCHAR(255),
    meses_permanencia_snapshot INTEGER,
    monto_plan_snapshot        NUMERIC(38, 2),
    tipo_regla_proveedor       VARCHAR(255),
    dia_corte                  INTEGER,
    dia_emision_estimado       INTEGER,
    dia_vencimiento            INTEGER,
    bloque_facturacion         VARCHAR(255),
    requiere_prorrateo_inicial BOOLEAN DEFAULT false,
    activo                     BOOLEAN DEFAULT true,
    observacion                VARCHAR(255),
    created_at                 TIMESTAMP WITH TIME ZONE,
    updated_at                 TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_calendario_facturacion_postventa_lead UNIQUE (id_lead)
);

CREATE INDEX IF NOT EXISTS idx_calendario_postventa_lead
    ON calendario_facturacion_postventa (id_lead);

CREATE INDEX IF NOT EXISTS idx_calendario_postventa_instalacion
    ON calendario_facturacion_postventa (fecha_instalacion);

CREATE TABLE IF NOT EXISTS periodo_facturacion_postventa (
    id                          BIGSERIAL PRIMARY KEY,
    id_calendario_facturacion   BIGINT NOT NULL REFERENCES calendario_facturacion_postventa(id),
    id_lead                     BIGINT NOT NULL REFERENCES lead(id),
    numero_periodo              INTEGER,
    fecha_inicio_periodo        DATE,
    fecha_fin_periodo           DATE,
    fecha_corte_estimada        DATE,
    fecha_emision_estimada      DATE,
    fecha_emision_confirmada    DATE,
    fecha_vencimiento_estimado  DATE,
    fecha_vencimiento_confirmado DATE,
    monto_esperado              NUMERIC(38, 2),
    monto_prorrateo             NUMERIC(38, 2),
    monto_facturado             NUMERIC(38, 2),
    estado                      VARCHAR(255),
    observacion                 VARCHAR(255),
    created_at                  TIMESTAMP WITH TIME ZONE,
    updated_at                  TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_periodo_postventa_calendario
    ON periodo_facturacion_postventa (id_calendario_facturacion);

CREATE INDEX IF NOT EXISTS idx_periodo_postventa_lead_estado
    ON periodo_facturacion_postventa (id_lead, estado);

CREATE INDEX IF NOT EXISTS idx_periodo_postventa_vencimiento
    ON periodo_facturacion_postventa (fecha_vencimiento_estimado);

CREATE UNIQUE INDEX IF NOT EXISTS uk_periodo_postventa_lead_numero
    ON periodo_facturacion_postventa (id_lead, numero_periodo)
    WHERE numero_periodo IS NOT NULL;

-- ---------------------------------------------------------------------
-- Reestructuracion compatible de encuestas postventa
-- ---------------------------------------------------------------------

ALTER TABLE encuesta_postventa
    ADD COLUMN IF NOT EXISTS id_periodo_facturacion BIGINT REFERENCES periodo_facturacion_postventa(id),
    ADD COLUMN IF NOT EXISTS tipo_encuesta          VARCHAR(255),
    ADD COLUMN IF NOT EXISTS tipo_contacto          VARCHAR(255),
    ADD COLUMN IF NOT EXISTS calificacion           INTEGER,
    ADD COLUMN IF NOT EXISTS status                 VARCHAR(255),
    ADD COLUMN IF NOT EXISTS estado                 VARCHAR(255),
    ADD COLUMN IF NOT EXISTS prioridad              VARCHAR(255),
    ADD COLUMN IF NOT EXISTS fecha_programada       TIMESTAMP,
    ADD COLUMN IF NOT EXISTS fecha_limite           TIMESTAMP,
    ADD COLUMN IF NOT EXISTS fecha_realizada        TIMESTAMP,
    ADD COLUMN IF NOT EXISTS numero_encuesta        INTEGER,
    ADD COLUMN IF NOT EXISTS comentario             VARCHAR(255),
    ADD COLUMN IF NOT EXISTS id_asesor_encuesta     BIGINT,
    ADD COLUMN IF NOT EXISTS nombre_asesor_encuesta VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_encuesta_postventa_periodo_estado
    ON encuesta_postventa (id_periodo_facturacion, estado);

CREATE INDEX IF NOT EXISTS idx_encuesta_postventa_programada
    ON encuesta_postventa (fecha_programada);

-- ---------------------------------------------------------------------
-- Reestructuracion compatible de pagos postventa
-- ---------------------------------------------------------------------

ALTER TABLE pago_postventa
    ADD COLUMN IF NOT EXISTS id_periodo_facturacion BIGINT REFERENCES periodo_facturacion_postventa(id),
    ADD COLUMN IF NOT EXISTS numero_operacion       VARCHAR(255),
    ADD COLUMN IF NOT EXISTS canal_pago             VARCHAR(255),
    ADD COLUMN IF NOT EXISTS observacion            VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_pago_postventa_periodo_estado
    ON pago_postventa (id_periodo_facturacion, estado);
