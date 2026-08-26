-- Scope por proveedor unificado para BACKOFFICE y POSTVENTA.
-- Reemplaza (a futuro) a postventa_asesor_proveedor: durante el dual-run ambas conviven
-- y esta tabla se siembra con las filas de postventa (ambito = 'POSTVENTA').
CREATE TABLE IF NOT EXISTS usuario_proveedor (
    id           BIGSERIAL PRIMARY KEY,
    id_empleado  BIGINT NOT NULL,
    id_proveedor BIGINT NOT NULL REFERENCES proveedor(id),
    ambito       VARCHAR(20) NOT NULL,
    activo       BOOLEAN DEFAULT true,
    created_at   TIMESTAMP WITH TIME ZONE,
    updated_at   TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_usuario_proveedor_ambito CHECK (ambito IN ('BACKOFFICE', 'POSTVENTA')),
    CONSTRAINT uq_usuario_proveedor UNIQUE (id_empleado, id_proveedor, ambito)
);

CREATE INDEX IF NOT EXISTS idx_usuario_proveedor_empleado_ambito
    ON usuario_proveedor (id_empleado, ambito);

CREATE INDEX IF NOT EXISTS idx_usuario_proveedor_proveedor
    ON usuario_proveedor (id_proveedor);

-- Semilla: copiar las asignaciones vivas de postventa al modelo unificado.
-- Idempotente por el UNIQUE (id_empleado, id_proveedor, ambito).
INSERT INTO usuario_proveedor (id_empleado, id_proveedor, ambito, activo, created_at, updated_at)
SELECT pap.id_empleado, pap.id_proveedor, 'POSTVENTA', COALESCE(pap.activo, true),
       COALESCE(pap.created_at, now()), COALESCE(pap.updated_at, now())
FROM postventa_asesor_proveedor pap
WHERE COALESCE(pap.activo, true) = true
ON CONFLICT ON CONSTRAINT uq_usuario_proveedor DO NOTHING;
