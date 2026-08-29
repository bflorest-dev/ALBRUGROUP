-- ============================================================
-- V48: Configuracion de campos de captura por proveedor ofrecido
--
-- La captura comercial depende del proveedor del plan ofrecido, no del equipo
-- original del lead. Se mantiene equipo_campo como fallback historico.
-- ============================================================

CREATE TABLE IF NOT EXISTS proveedor_campo (
    id           BIGSERIAL   PRIMARY KEY,
    id_proveedor BIGINT      NOT NULL REFERENCES proveedor(id),
    campo        VARCHAR(64) NOT NULL,
    visible      BOOLEAN     NOT NULL DEFAULT TRUE,
    requerido    BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_proveedor_campo UNIQUE (id_proveedor, campo)
);

CREATE INDEX IF NOT EXISTS idx_proveedor_campo_id_proveedor ON proveedor_campo (id_proveedor);

WITH proveedor_perfil AS (
    SELECT p.id AS id_proveedor,
           UPPER(p.nombre) LIKE '%CLARO%' AS es_claro
    FROM proveedor p
),
campos (campo, visible_claro, requerido_claro, visible_estandar, requerido_estandar) AS (
    VALUES
        ('NOMBRE_MADRE',           TRUE,  TRUE,  FALSE, FALSE),
        ('NOMBRE_PADRE',           TRUE,  TRUE,  FALSE, FALSE),
        ('PLANO',                  TRUE,  TRUE,  FALSE, FALSE),
        ('DOC_TITULAR_CELULAR',    FALSE, FALSE, TRUE,  TRUE),
        ('NOMBRE_TITULAR_CELULAR', FALSE, FALSE, TRUE,  TRUE)
)
INSERT INTO proveedor_campo (id_proveedor, campo, visible, requerido)
SELECT p.id_proveedor,
       c.campo,
       CASE WHEN p.es_claro THEN c.visible_claro   ELSE c.visible_estandar   END,
       CASE WHEN p.es_claro THEN c.requerido_claro ELSE c.requerido_estandar END
FROM proveedor_perfil p
CROSS JOIN campos c
ON CONFLICT (id_proveedor, campo) DO NOTHING;
