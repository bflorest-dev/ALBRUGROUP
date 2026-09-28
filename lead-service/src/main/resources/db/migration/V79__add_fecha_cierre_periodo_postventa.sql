-- V79: Agrega fecha_cierre al periodo de facturacion postventa.
-- Fuente confiable de la fecha de cierre (suspension/baja/pago), a diferencia de updated_at que
-- se pisa con cualquier update posterior. La necesita el backfill de LeadSeguimiento.fecha_suspension
-- / fecha_baja (ver reworks/4 y reworks/5).

ALTER TABLE periodo_facturacion_postventa ADD COLUMN fecha_cierre TIMESTAMPTZ;

-- Backfill: para los periodos ya cerrados, el mejor dato historico disponible es updated_at.
-- Es aproximado (updated_at pudo moverse tras el cierre), pero es lo unico que existe historicamente.
UPDATE periodo_facturacion_postventa
SET fecha_cierre = updated_at
WHERE estado <> 'ABIERTO'
  AND fecha_cierre IS NULL;

-- Verificacion: ningun periodo cerrado debe quedar sin fecha_cierre. Si queda alguno, es un estado
-- inesperado y falla ruidosamente en vez de dejar el dato huerfano en silencio.
DO $$
DECLARE
    huerfanos INTEGER;
BEGIN
    SELECT COUNT(*) INTO huerfanos
    FROM periodo_facturacion_postventa
    WHERE estado <> 'ABIERTO'
      AND fecha_cierre IS NULL;

    IF huerfanos > 0 THEN
        RAISE EXCEPTION 'COBERTURA INCOMPLETA: % periodos cerrados sin fecha_cierre', huerfanos;
    END IF;
END $$;
