INSERT INTO empresa_contratista (nombre, activo, created_at, updated_at)
SELECT 'LYBTEL', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1
    FROM empresa_contratista
    WHERE LOWER(nombre) = LOWER('LYBTEL')
);

INSERT INTO empresa_contratista (nombre, activo, created_at, updated_at)
SELECT 'TALENTEA', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1
    FROM empresa_contratista
    WHERE LOWER(nombre) = LOWER('TALENTEA')
);

UPDATE empresa_contratista
SET activo = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(nombre) IN (LOWER('LYBTEL'), LOWER('TALENTEA'))
  AND activo IS DISTINCT FROM TRUE;
