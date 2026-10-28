-- V3: Asegura que una postulacion pueda iniciar sin oferta laboral.
-- La base local conserva una restriccion NOT NULL residual pese al contrato opcional.

DO $$
BEGIN
    IF to_regclass('public.postulacion') IS NULL THEN
        RAISE EXCEPTION 'No existe la tabla public.postulacion; no se puede desacoplar la oferta';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'postulacion'
          AND column_name = 'oferta_laboral_id'
    ) THEN
        RAISE EXCEPTION 'No existe la columna public.postulacion.oferta_laboral_id';
    END IF;
END $$;

ALTER TABLE public.postulacion
    ALTER COLUMN oferta_laboral_id DROP NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'postulacion'
          AND column_name = 'oferta_laboral_id'
          AND is_nullable = 'NO'
    ) THEN
        RAISE EXCEPTION 'La columna public.postulacion.oferta_laboral_id continua siendo NOT NULL';
    END IF;
END $$;
