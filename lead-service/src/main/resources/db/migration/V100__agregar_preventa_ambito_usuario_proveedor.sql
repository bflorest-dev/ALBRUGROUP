ALTER TABLE usuario_proveedor
    DROP CONSTRAINT chk_usuario_proveedor_ambito;

ALTER TABLE usuario_proveedor
    ADD CONSTRAINT chk_usuario_proveedor_ambito
        CHECK (ambito IN ('BACKOFFICE', 'POSTVENTA', 'PREVENTA'));
