-- ============================================================================
-- V93: TipoDomicilio pasa de enum a entidad (por proveedor + esVertical)
--      + nuevo campo tipo_urbanizacion en direccion
-- ============================================================================

-- 1. Tabla catalogo tipo_domicilio
CREATE TABLE tipo_domicilio (
    id           BIGSERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    es_vertical  BOOLEAN      NOT NULL DEFAULT FALSE,
    id_proveedor BIGINT       NOT NULL REFERENCES proveedor(id),
    activo       BOOLEAN      NOT NULL DEFAULT TRUE,
    UNIQUE(nombre, id_proveedor)
);

-- 2. Seed: WIN
INSERT INTO tipo_domicilio (nombre, es_vertical, id_proveedor)
SELECT 'MULTIFAMILIAR', FALSE, id FROM proveedor WHERE nombre = 'WIN';

INSERT INTO tipo_domicilio (nombre, es_vertical, id_proveedor)
SELECT 'CONDOMINIO_EDIFICIO_HABILITADO', TRUE, id FROM proveedor WHERE nombre = 'WIN';

INSERT INTO tipo_domicilio (nombre, es_vertical, id_proveedor)
SELECT 'CONDOMINIO_EDIFICIO_NO_HABILITADO', FALSE, id FROM proveedor WHERE nombre = 'WIN';

-- 3. Seed: CLARO
INSERT INTO tipo_domicilio (nombre, es_vertical, id_proveedor)
SELECT 'CASA', FALSE, id FROM proveedor WHERE nombre = 'CLARO';

INSERT INTO tipo_domicilio (nombre, es_vertical, id_proveedor)
SELECT 'CENTRO COMERCIAL', FALSE, id FROM proveedor WHERE nombre = 'CLARO';

INSERT INTO tipo_domicilio (nombre, es_vertical, id_proveedor)
SELECT 'EDIFICIO RESIDENCIAL', TRUE, id FROM proveedor WHERE nombre = 'CLARO';

INSERT INTO tipo_domicilio (nombre, es_vertical, id_proveedor)
SELECT 'CORPORATIVO', FALSE, id FROM proveedor WHERE nombre = 'CLARO';

INSERT INTO tipo_domicilio (nombre, es_vertical, id_proveedor)
SELECT 'OFICINAS', FALSE, id FROM proveedor WHERE nombre = 'CLARO';

INSERT INTO tipo_domicilio (nombre, es_vertical, id_proveedor)
SELECT 'HOTEL', FALSE, id FROM proveedor WHERE nombre = 'CLARO';

INSERT INTO tipo_domicilio (nombre, es_vertical, id_proveedor)
SELECT 'INDUSTRIA', FALSE, id FROM proveedor WHERE nombre = 'CLARO';

INSERT INTO tipo_domicilio (nombre, es_vertical, id_proveedor)
SELECT 'LOCAL', FALSE, id FROM proveedor WHERE nombre = 'CLARO';

INSERT INTO tipo_domicilio (nombre, es_vertical, id_proveedor)
SELECT 'MERCADO', FALSE, id FROM proveedor WHERE nombre = 'CLARO';

-- 4. Nueva FK en direccion
ALTER TABLE direccion ADD COLUMN id_tipo_domicilio BIGINT REFERENCES tipo_domicilio(id);

-- 5. Nueva columna enum tipo_urbanizacion
ALTER TABLE direccion ADD COLUMN tipo_urbanizacion VARCHAR(50);

-- 6. Backfill: migrar enum viejo a FK nueva
--    HOGAR        -> MULTIFAMILIAR (WIN)
--    CONDOMINIO_EDIFICIO -> CONDOMINIO_EDIFICIO_HABILITADO (WIN)
UPDATE direccion
SET id_tipo_domicilio = td.id
FROM tipo_domicilio td
WHERE direccion.tipo_domicilio = 'HOGAR'
  AND td.nombre = 'MULTIFAMILIAR'
  AND td.id_proveedor = (SELECT id FROM proveedor WHERE nombre = 'WIN');

UPDATE direccion
SET id_tipo_domicilio = td.id
FROM tipo_domicilio td
WHERE direccion.tipo_domicilio = 'MULTIFAMILIAR'
  AND td.nombre = 'MULTIFAMILIAR'
  AND td.id_proveedor = (SELECT id FROM proveedor WHERE nombre = 'WIN');

UPDATE direccion
SET id_tipo_domicilio = td.id
FROM tipo_domicilio td
WHERE direccion.tipo_domicilio = 'CONDOMINIO_EDIFICIO'
  AND td.nombre = 'CONDOMINIO_EDIFICIO_HABILITADO'
  AND td.id_proveedor = (SELECT id FROM proveedor WHERE nombre = 'WIN');

UPDATE direccion
SET id_tipo_domicilio = td.id
FROM tipo_domicilio td
WHERE direccion.tipo_domicilio = 'CONDOMINIO_EDIFICIO_NO_HABILITADO'
  AND td.nombre = 'CONDOMINIO_EDIFICIO_NO_HABILITADO'
  AND td.id_proveedor = (SELECT id FROM proveedor WHERE nombre = 'WIN');
