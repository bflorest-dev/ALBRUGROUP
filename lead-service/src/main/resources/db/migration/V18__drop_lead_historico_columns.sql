-- Retira del lead los datos historicos por etapa que ahora viven en lead_etapa_resumen:
-- la atribucion por etapa (mérito/fecha de PREVENTA/VENTA/POSTVENTA/COBRANZA) y la primera
-- tipificacion. El lead conserva solo su estado operativo vivo. La atribucion historica se
-- lee/reconstruye desde lead_etapa_resumen (ranking, mis-preventas, metricas y backfill).
-- Irreversible: aplicar en un segundo deploy, tras validar en prod las lecturas del resumen.

-- Indices de la atribucion por etapa (ya no hay columnas que indexar).
DROP INDEX IF EXISTS idx_lead_id_asesor_preventa_fecha;
DROP INDEX IF EXISTS idx_lead_id_asesor_venta_fecha;
DROP INDEX IF EXISTS idx_lead_id_asesor_postventa_fecha;
DROP INDEX IF EXISTS idx_lead_id_asesor_cobranza_fecha;

-- Primera tipificacion de la etapa (vive en lead_etapa_resumen.primera_codigo_*).
ALTER TABLE lead DROP COLUMN IF EXISTS primera_codigo_tipificacion;
ALTER TABLE lead DROP COLUMN IF EXISTS primera_codigo_subtipificacion;

-- Atribucion por etapa (vive en lead_etapa_resumen.id_asesor_merito / fecha_merito por etapa).
ALTER TABLE lead DROP COLUMN IF EXISTS id_asesor_preventa;
ALTER TABLE lead DROP COLUMN IF EXISTS fecha_preventa;
ALTER TABLE lead DROP COLUMN IF EXISTS id_asesor_venta;
ALTER TABLE lead DROP COLUMN IF EXISTS fecha_venta;
ALTER TABLE lead DROP COLUMN IF EXISTS id_asesor_postventa;
ALTER TABLE lead DROP COLUMN IF EXISTS fecha_postventa;
ALTER TABLE lead DROP COLUMN IF EXISTS id_asesor_cobranza;
ALTER TABLE lead DROP COLUMN IF EXISTS fecha_cobranza;
