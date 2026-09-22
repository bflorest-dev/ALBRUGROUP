ALTER TABLE proveedor ADD COLUMN tipo_regla_facturacion VARCHAR(30);

UPDATE proveedor SET tipo_regla_facturacion = 'WIN' WHERE UPPER(TRIM(nombre)) = 'WIN';
UPDATE proveedor SET tipo_regla_facturacion = 'CLARO' WHERE UPPER(TRIM(nombre)) = 'CLARO';
