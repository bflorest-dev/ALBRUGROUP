ALTER TABLE direccion
    ALTER COLUMN latitud TYPE VARCHAR(64)
        USING NULLIF(regexp_replace(regexp_replace(latitud::text, '0+$', ''), '\.$', ''), ''),
    ALTER COLUMN longitud TYPE VARCHAR(64)
        USING NULLIF(regexp_replace(regexp_replace(longitud::text, '0+$', ''), '\.$', ''), '');
