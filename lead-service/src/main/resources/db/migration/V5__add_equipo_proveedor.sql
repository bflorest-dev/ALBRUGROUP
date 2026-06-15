-- ============================================================
-- V5: Mapping equipo ↔ proveedor
--
-- Define qué proveedores ve cada equipo (y por herencia, sus campañas/planes/promos).
-- id_equipo es una referencia lógica al Equipo administrado en auth-service: no hay FK
-- entre servicios. id_proveedor sí referencia el proveedor local.
-- ============================================================

CREATE TABLE equipo_proveedor (
    id           BIGSERIAL PRIMARY KEY,
    id_equipo    BIGINT NOT NULL,
    id_proveedor BIGINT NOT NULL REFERENCES proveedor(id),
    CONSTRAINT uq_equipo_proveedor UNIQUE (id_equipo, id_proveedor)
);

CREATE INDEX idx_equipo_proveedor_id_equipo ON equipo_proveedor (id_equipo);
