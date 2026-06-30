-- ============================================================
-- V11: Configuración de campos de captura por equipo
--
-- Generaliza el antiguo "perfil CLARO" (que se infería del nombre del proveedor) a una config
-- explícita por equipo: para cada campo del catálogo, si el equipo lo MUESTRA y si es OBLIGATORIO.
-- id_equipo es una referencia lógica al Equipo de auth-service (sin FK entre servicios), igual que
-- equipo_proveedor.
-- ============================================================

CREATE TABLE IF NOT EXISTS equipo_campo (
    id        BIGSERIAL   PRIMARY KEY,
    id_equipo BIGINT      NOT NULL,
    campo     VARCHAR(64) NOT NULL,
    visible   BOOLEAN     NOT NULL DEFAULT TRUE,
    requerido BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_equipo_campo UNIQUE (id_equipo, campo)
);

CREATE INDEX IF NOT EXISTS idx_equipo_campo_id_equipo ON equipo_campo (id_equipo);

-- Seed de paridad: replica el comportamiento actual. Un equipo se considera "perfil CLARO" si
-- alguno de sus proveedores es CLARO (mismo criterio que usaba el código). El perfil CLARO pide
-- Madre/Padre/Plano y oculta los del Titular del Celular; el estándar, al revés.
WITH equipos AS (
    SELECT ep.id_equipo,
           BOOL_OR(UPPER(p.nombre) LIKE '%CLARO%') AS es_claro
    FROM equipo_proveedor ep
    JOIN proveedor p ON p.id = ep.id_proveedor
    GROUP BY ep.id_equipo
),
campos (campo, visible_claro, requerido_claro, visible_estandar, requerido_estandar) AS (
    VALUES
        ('NOMBRE_MADRE',           TRUE,  TRUE,  FALSE, FALSE),
        ('NOMBRE_PADRE',           TRUE,  TRUE,  FALSE, FALSE),
        ('PLANO',                  TRUE,  TRUE,  FALSE, FALSE),
        ('DOC_TITULAR_CELULAR',    FALSE, FALSE, TRUE,  TRUE),
        ('NOMBRE_TITULAR_CELULAR', FALSE, FALSE, TRUE,  TRUE)
)
INSERT INTO equipo_campo (id_equipo, campo, visible, requerido)
SELECT e.id_equipo,
       c.campo,
       CASE WHEN e.es_claro THEN c.visible_claro   ELSE c.visible_estandar   END,
       CASE WHEN e.es_claro THEN c.requerido_claro ELSE c.requerido_estandar END
FROM equipos e
CROSS JOIN campos c
ON CONFLICT (id_equipo, campo) DO NOTHING;
