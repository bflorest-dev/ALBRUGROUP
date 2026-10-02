-- 1. FK de cuenta_publicitaria a proveedor (nullable para backfill)
ALTER TABLE cuenta_publicitaria
    ADD COLUMN id_proveedor BIGINT;

ALTER TABLE cuenta_publicitaria
    ADD CONSTRAINT fk_cuenta_publicitaria_proveedor
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id);

-- 2. Backfill: derivar proveedor de la campana mas antigua que usa cada cuenta
UPDATE cuenta_publicitaria cp
SET id_proveedor = sub.id_proveedor
FROM (
    SELECT DISTINCT ON (id_cuenta_publicitaria)
           id_cuenta_publicitaria,
           id_proveedor
    FROM campana
    WHERE id_cuenta_publicitaria IS NOT NULL
      AND id_proveedor IS NOT NULL
    ORDER BY id_cuenta_publicitaria, id ASC
) sub
WHERE cp.id = sub.id_cuenta_publicitaria
  AND cp.id_proveedor IS NULL;

-- 3. NOT NULL: falla si alguna cuenta quedo sin proveedor
ALTER TABLE cuenta_publicitaria
    ALTER COLUMN id_proveedor SET NOT NULL;

-- 4. Tabla de recargas
CREATE TABLE recarga_cuenta_publicitaria (
    id                     BIGSERIAL PRIMARY KEY,
    id_cuenta_publicitaria BIGINT NOT NULL REFERENCES cuenta_publicitaria(id),
    monto                  NUMERIC(12,2) NOT NULL,
    fecha                  TIMESTAMP NOT NULL,
    observacion            VARCHAR(500),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recarga_cuenta_fecha
    ON recarga_cuenta_publicitaria (id_cuenta_publicitaria, fecha);
