DO $$
DECLARE
    canonical_id BIGINT;
    legacy_id BIGINT;
BEGIN
    SELECT id
    INTO canonical_id
    FROM empresa_contratista
    WHERE LOWER(TRIM(nombre)) = LOWER('Lybitel')
    ORDER BY id
    LIMIT 1;

    SELECT id
    INTO legacy_id
    FROM empresa_contratista
    WHERE LOWER(TRIM(nombre)) = LOWER('LYBTEL')
    ORDER BY id
    LIMIT 1;

    IF canonical_id IS NULL AND legacy_id IS NOT NULL THEN
        UPDATE empresa_contratista
        SET nombre = 'Lybitel',
            activo = TRUE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = legacy_id;
    ELSIF canonical_id IS NULL THEN
        INSERT INTO empresa_contratista (nombre, activo, created_at, updated_at)
        VALUES ('Lybitel', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    ELSE
        UPDATE empresa_contratista
        SET nombre = 'Lybitel',
            activo = TRUE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = canonical_id;
    END IF;
END $$;
