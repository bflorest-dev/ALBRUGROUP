-- Datos específicos de la oferta WIN capturados desde la pestaña Dirección.
ALTER TABLE lead
    ADD COLUMN IF NOT EXISTS es_jala_cobertura BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS es_zona_pintada BOOLEAN NOT NULL DEFAULT false;
