-- ============================================================
-- auth_db  –  baseline V1
-- Generado a partir de las entidades JPA de auth-service.
-- Todas las tablas en UTF-8 (heredad del cluster, TEMPLATE template0).
-- ============================================================

CREATE TABLE permisos (
    id          BIGSERIAL PRIMARY KEY,
    nombre      VARCHAR(255) UNIQUE,
    descripcion VARCHAR(255),
    recurso     VARCHAR(255),
    accion      VARCHAR(255)
);

CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    nombre      VARCHAR(255) UNIQUE,
    descripcion VARCHAR(255)
);

CREATE TABLE rol_permiso (
    rol_id     BIGINT NOT NULL REFERENCES roles(id),
    permiso_id BIGINT NOT NULL REFERENCES permisos(id),
    PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE usuarios (
    id                     BIGSERIAL PRIMARY KEY,
    username               VARCHAR(255) UNIQUE,
    password               VARCHAR(255),
    email                  VARCHAR(255) UNIQUE,
    empleado_id            BIGINT UNIQUE,
    dni                    VARCHAR(255) NOT NULL,
    nombre_completo        VARCHAR(255),
    activo                 BOOLEAN      NOT NULL DEFAULT TRUE,
    password_inicializada  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at             TIMESTAMP WITH TIME ZONE,
    updated_at             TIMESTAMP WITH TIME ZONE
);

CREATE TABLE usuario_rol (
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    rol_id     BIGINT NOT NULL REFERENCES roles(id),
    PRIMARY KEY (usuario_id, rol_id)
);

CREATE TABLE refresh_tokens (
    id                      BIGSERIAL PRIMARY KEY,
    token_hash              VARCHAR(128) NOT NULL UNIQUE,
    usuario_id              BIGINT       NOT NULL REFERENCES usuarios(id),
    expires_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at              TIMESTAMP WITH TIME ZONE,
    replaced_by_token_hash  VARCHAR(128),
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL
);
