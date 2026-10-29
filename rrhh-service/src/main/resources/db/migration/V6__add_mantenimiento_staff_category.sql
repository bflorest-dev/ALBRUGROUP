ALTER TABLE contrato
    DROP CONSTRAINT IF EXISTS contrato_categoria_personal_check;

ALTER TABLE contrato
    ADD CONSTRAINT contrato_categoria_personal_check
    CHECK (categoria_personal IN ('ESTRUCTURAL', 'OPERATIVO', 'MANTENIMIENTO'));
