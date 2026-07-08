-- Guarda el orden de la PRIMERA tipificacion de la etapa (simetria con ultima/mayor rango).
-- Habilita metricas por bloque de orden sobre la primera tipificacion y medir el avance
-- primera -> ultima por orden.

ALTER TABLE lead_etapa_resumen
    ADD COLUMN IF NOT EXISTS primera_tipificacion_orden INTEGER;
