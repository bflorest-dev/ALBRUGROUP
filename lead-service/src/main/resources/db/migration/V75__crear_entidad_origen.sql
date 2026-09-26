-- Tabla catálogo de orígenes (reemplaza el enum Base)
CREATE TABLE origen (
    id          BIGSERIAL    PRIMARY KEY,
    codigo      VARCHAR(30)  NOT NULL UNIQUE,
    nombre      VARCHAR(60)  NOT NULL,
    es_organico BOOLEAN      NOT NULL DEFAULT true,
    es_campana  BOOLEAN      NOT NULL DEFAULT false,
    activo      BOOLEAN      NOT NULL DEFAULT true,
    orden       INTEGER      NOT NULL DEFAULT 0
);

INSERT INTO origen (codigo, nombre, es_organico, es_campana, orden) VALUES
    ('WHATSAPP',        'WhatsApp',        true,  true,  1),
    ('MESSENGER',       'Messenger',       true,  true,  2),
    ('RECONTACTO',      'Recontacto',      true,  false, 3),
    ('REFERIDO',        'Referido',        true,  false, 4),
    ('PREDICTIVO',      'Predictivo',      false, false, 5),
    ('MASIVO',          'Masivo',           false, false, 6),
    ('SIN_IDENTIFICAR', 'Sin identificar', true,  false, 7);

-- FK en lead apuntando a origen
ALTER TABLE lead ADD COLUMN id_origen BIGINT;

UPDATE lead SET id_origen = o.id
FROM origen o
WHERE o.codigo = lead.base;

-- Leads con base NULL o valor no mapeado → SIN_IDENTIFICAR
UPDATE lead SET id_origen = (SELECT id FROM origen WHERE codigo = 'SIN_IDENTIFICAR')
WHERE id_origen IS NULL;

ALTER TABLE lead ALTER COLUMN id_origen SET NOT NULL;
ALTER TABLE lead ADD CONSTRAINT fk_lead_origen FOREIGN KEY (id_origen) REFERENCES origen(id);
CREATE INDEX idx_lead_origen ON lead (id_origen);

-- La columna base queda como histórica; ya no la gestiona JPA.
ALTER TABLE lead ALTER COLUMN base DROP NOT NULL;
ALTER TABLE lead ALTER COLUMN base SET DEFAULT NULL;
