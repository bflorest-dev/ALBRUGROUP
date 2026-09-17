-- Datos específicos de la oferta CLARO capturados al tipificar una preventa.
ALTER TABLE lead
    ADD COLUMN IF NOT EXISTS es_full_claro BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS tecnologia VARCHAR(255);
