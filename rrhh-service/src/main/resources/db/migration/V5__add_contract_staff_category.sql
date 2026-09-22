ALTER TABLE contrato
    ADD COLUMN categoria_personal VARCHAR(255);

UPDATE contrato
SET categoria_personal = CASE
    WHEN puesto_trabajo IN (
        'ADMINISTRADOR', 'RRHH', 'RECLUTADOR', 'CAPACITADOR', 'DESARROLLADOR', 'CONTADOR'
    ) THEN 'ESTRUCTURAL'
    WHEN puesto_trabajo IS NOT NULL THEN 'OPERATIVO'
END
WHERE categoria_personal IS NULL
  AND puesto_trabajo IS NOT NULL;

ALTER TABLE contrato
    ALTER COLUMN categoria_personal SET NOT NULL;

ALTER TABLE contrato
    ADD CONSTRAINT contrato_categoria_personal_check
    CHECK (categoria_personal IN ('ESTRUCTURAL', 'OPERATIVO'));
