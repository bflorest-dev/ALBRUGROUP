CREATE TABLE IF NOT EXISTS postventa_asesor_proveedor (
    id          BIGSERIAL PRIMARY KEY,
    id_empleado BIGINT NOT NULL,
    id_proveedor BIGINT NOT NULL REFERENCES proveedor(id),
    activo      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE,
    updated_at  TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_postventa_asesor_proveedor UNIQUE (id_empleado, id_proveedor)
);

CREATE INDEX IF NOT EXISTS idx_postventa_asesor_proveedor_empleado
    ON postventa_asesor_proveedor (id_empleado);

CREATE INDEX IF NOT EXISTS idx_postventa_asesor_proveedor_proveedor
    ON postventa_asesor_proveedor (id_proveedor);
