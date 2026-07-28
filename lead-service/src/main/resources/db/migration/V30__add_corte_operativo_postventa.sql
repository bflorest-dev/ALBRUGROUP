ALTER TABLE calendario_facturacion_postventa
    ADD COLUMN IF NOT EXISTS mes_corte_base DATE,
    ADD COLUMN IF NOT EXISTS numero_corte_base INTEGER,
    ADD COLUMN IF NOT EXISTS corte_corregido BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS fecha_correccion_corte TIMESTAMP WITH TIME ZONE;

UPDATE calendario_facturacion_postventa
SET mes_corte_base = date_trunc('month', fecha_instalacion)::date,
    numero_corte_base = CASE
        WHEN EXTRACT(DAY FROM fecha_instalacion) <= 22 THEN 1
        ELSE 2
    END,
    corte_corregido = false
WHERE tipo_regla_proveedor = 'WIN'
  AND fecha_instalacion IS NOT NULL
  AND (mes_corte_base IS NULL OR numero_corte_base IS NULL);

UPDATE calendario_facturacion_postventa
SET corte_corregido = false
WHERE corte_corregido IS NULL;

ALTER TABLE calendario_facturacion_postventa
    ADD CONSTRAINT chk_calendario_postventa_numero_corte_base
        CHECK (numero_corte_base IS NULL OR numero_corte_base IN (1, 2));

ALTER TABLE calendario_facturacion_postventa
    ADD CONSTRAINT chk_calendario_postventa_mes_corte_base_inicio_mes
        CHECK (mes_corte_base IS NULL OR EXTRACT(DAY FROM mes_corte_base) = 1);

CREATE INDEX IF NOT EXISTS idx_calendario_postventa_corte_operativo
    ON calendario_facturacion_postventa (tipo_regla_proveedor, mes_corte_base, numero_corte_base);
