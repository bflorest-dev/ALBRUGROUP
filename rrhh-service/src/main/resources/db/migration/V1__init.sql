-- ============================================================
-- rrhh_db  –  baseline V1
-- Generado a partir de las entidades JPA de rrhh-service.
-- ============================================================

CREATE TABLE empresa_contratista (
    id         BIGSERIAL PRIMARY KEY,
    nombre     VARCHAR(255),
    activo     BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE empleados (
    id                    BIGSERIAL PRIMARY KEY,
    nombres               VARCHAR(255),
    apellidos             VARCHAR(255),
    tipo_documento        VARCHAR(255),
    numero_documento      VARCHAR(255),
    nacionalidad          VARCHAR(255),
    fecha_nacimiento      DATE,
    estado_civil          VARCHAR(255),
    tiene_hijos           BOOLEAN,
    celular_personal      VARCHAR(255),
    correo_personal       VARCHAR(255),
    celular_corporativo   VARCHAR(255),
    correo_corporativo    VARCHAR(255),
    origen                VARCHAR(255),
    distrito              VARCHAR(255),
    direccion             VARCHAR(255),
    banco                 VARCHAR(255),
    cuenta_bancaria       VARCHAR(255),
    cuenta_interbancaria  VARCHAR(255),
    cuenta_propia         BOOLEAN,
    parentesco            VARCHAR(255),
    celular_transferencia VARCHAR(255),
    empresa_contratista_id BIGINT REFERENCES empresa_contratista(id),
    estado_operativo      VARCHAR(255),
    compania              VARCHAR(255),
    lista_negra           BOOLEAN,
    created_at            TIMESTAMP WITH TIME ZONE,
    updated_at            TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_empleado_numero_documento UNIQUE (numero_documento),
    CONSTRAINT uk_empleado_celular_personal UNIQUE (celular_personal),
    CONSTRAINT uk_empleado_correo_personal  UNIQUE (correo_personal)
);

CREATE TABLE contrato (
    id               BIGSERIAL PRIMARY KEY,
    empleado_id      BIGINT NOT NULL REFERENCES empleados(id),
    puesto_trabajo   VARCHAR(255),
    regimen          VARCHAR(255),
    modalidad        VARCHAR(255),
    seguro_salud     VARCHAR(255),
    sistema_pensiones VARCHAR(255),
    sueldo_base      NUMERIC(6, 2),
    fecha_contratacion DATE,
    fecha_fin_contrato DATE,
    created_at       TIMESTAMP WITH TIME ZONE,
    updated_at       TIMESTAMP WITH TIME ZONE
);

CREATE TABLE pago (
    id                  BIGSERIAL PRIMARY KEY,
    contrato_id         BIGINT NOT NULL REFERENCES contrato(id),
    fecha_inicio        DATE,
    fecha_fin           DATE,
    sueldo_base         NUMERIC(10, 2),
    asignacion_familiar NUMERIC(5, 2),
    bono_puntualidad    NUMERIC(5, 2),
    comision_semanal    NUMERIC(5, 2),
    comision_mensual    NUMERIC(5, 2),
    bono_extra          NUMERIC(5, 2),
    sueldo_total        NUMERIC(10, 2),
    created_at          TIMESTAMP WITH TIME ZONE,
    updated_at          TIMESTAMP WITH TIME ZONE
);

CREATE TABLE evento (
    id             BIGSERIAL PRIMARY KEY,
    empleado_id    BIGINT NOT NULL REFERENCES empleados(id),
    responsable_id BIGINT NOT NULL REFERENCES empleados(id),
    evento         VARCHAR(255),
    fecha_evento   TIMESTAMP WITH TIME ZONE,
    created_at     TIMESTAMP WITH TIME ZONE,
    updated_at     TIMESTAMP WITH TIME ZONE
);
