-- ============================================================
-- V6: Contacto (identidad del teléfono) + enlace y equipo en lead
--
-- Aditivo / NO destructivo: se conserva la tabla `lead` intacta y solo se le agregan
-- columnas nullable (`id_contacto`, `id_equipo`) y se crea `contacto`. Los ids de `lead`
-- no cambian → Evento.id_lead, pago/encuesta postventa, realtime quedan válidos.
--
-- "Oportunidad" (dominio) = entidad `lead` (código). Contacto es la identidad de-duplicada.
-- `id_equipo` se backfillea por separado (ver migración/job posterior) una vez asignados
-- los proveedores a equipos (equipo_proveedor), porque su derivación depende de ese mapping.
-- ============================================================

CREATE TABLE contacto (
    id              BIGSERIAL PRIMARY KEY,
    prefijo         VARCHAR(255),
    lead            VARCHAR(255),
    nombre_conocido VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE,
    updated_at      TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_contacto_prefijo_lead UNIQUE (prefijo, lead)
);

CREATE INDEX idx_contacto_prefijo_lead ON contacto (prefijo, lead);

ALTER TABLE lead ADD COLUMN id_contacto BIGINT REFERENCES contacto(id);
ALTER TABLE lead ADD COLUMN id_equipo   BIGINT;

CREATE INDEX idx_lead_id_equipo ON lead (id_equipo);

-- Backfill: un contacto por cada (prefijo, lead) existente.
INSERT INTO contacto (prefijo, lead, created_at, updated_at)
SELECT DISTINCT l.prefijo, l.lead, now(), now()
FROM lead l;

-- Enlazar cada lead con su contacto (IS NOT DISTINCT FROM para tratar NULL = NULL).
UPDATE lead l
SET id_contacto = c.id
FROM contacto c
WHERE c.prefijo IS NOT DISTINCT FROM l.prefijo
  AND c.lead    IS NOT DISTINCT FROM l.lead;
