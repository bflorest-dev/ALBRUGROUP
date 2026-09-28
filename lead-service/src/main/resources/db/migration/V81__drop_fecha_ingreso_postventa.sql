-- V81: Elimina lead_seguimiento.fecha_ingreso_postventa.
-- Era redundante y write-only: el dato correcto vive en lead_etapa_resumen(POSTVENTA).fecha_ingreso_etapa.
-- No hay backfill: no se migra a ningun lado, cualquier consumidor debe leer el resumen POSTVENTA.

ALTER TABLE lead_seguimiento DROP COLUMN fecha_ingreso_postventa;
