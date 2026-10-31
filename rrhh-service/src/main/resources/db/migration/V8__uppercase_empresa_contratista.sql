-- Normaliza todos los nombres de empresa_contratista a mayúsculas
-- y corrige 'Lybitel' -> 'LYBTEL'
UPDATE empresa_contratista
SET nombre      = UPPER(nombre),
    updated_at  = CURRENT_TIMESTAMP;

UPDATE empresa_contratista
SET nombre     = 'LYBTEL',
    updated_at = CURRENT_TIMESTAMP
WHERE UPPER(TRIM(nombre)) = 'LYBITEL';
