ALTER TABLE proveedor
    ADD COLUMN requiere_sec_sot_venta BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE proveedor
SET requiere_sec_sot_venta = TRUE
WHERE UPPER(TRIM(nombre)) = 'CLARO';
