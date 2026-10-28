-- V4: Sincroniza los catalogos persistibles de oferta laboral con los enums vigentes.

DO $$
BEGIN
    IF to_regclass('public.oferta_laboral') IS NULL THEN
        RAISE EXCEPTION 'No existe la tabla public.oferta_laboral; no se pueden actualizar sus restricciones';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.oferta_laboral'::regclass
          AND conname = 'oferta_laboral_negocio_check'
    ) THEN
        RAISE EXCEPTION 'No existe la restriccion oferta_laboral_negocio_check; migracion detenida';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.oferta_laboral'::regclass
          AND conname = 'oferta_laboral_horario_check'
    ) THEN
        RAISE EXCEPTION 'No existe la restriccion oferta_laboral_horario_check; migracion detenida';
    END IF;
END $$;

UPDATE public.oferta_laboral
SET negocio = 'WIN'
WHERE negocio = 'FIBRA_MIXTO';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.oferta_laboral
        WHERE negocio IS NOT NULL
          AND negocio NOT IN ('WIN', 'CLARO')
    ) THEN
        RAISE EXCEPTION 'Quedaron negocios de oferta laboral fuera del catalogo vigente';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.oferta_laboral
        WHERE horario IS NOT NULL
          AND horario NOT IN ('MORNING', 'AFTERNOON', 'NIGHT')
    ) THEN
        RAISE EXCEPTION 'Quedaron horarios de oferta laboral fuera del catalogo vigente';
    END IF;
END $$;

ALTER TABLE public.oferta_laboral
    DROP CONSTRAINT oferta_laboral_negocio_check,
    DROP CONSTRAINT oferta_laboral_horario_check;

ALTER TABLE public.oferta_laboral
    ADD CONSTRAINT oferta_laboral_negocio_check
        CHECK (negocio IS NULL OR negocio IN ('WIN', 'CLARO')),
    ADD CONSTRAINT oferta_laboral_horario_check
        CHECK (horario IS NULL OR horario IN ('MORNING', 'AFTERNOON', 'NIGHT'));

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.oferta_laboral
        WHERE negocio IS NOT NULL
          AND negocio NOT IN ('WIN', 'CLARO')
    ) THEN
        RAISE EXCEPTION 'La verificacion final encontro un negocio de oferta laboral no mapeado';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.oferta_laboral
        WHERE horario IS NOT NULL
          AND horario NOT IN ('MORNING', 'AFTERNOON', 'NIGHT')
    ) THEN
        RAISE EXCEPTION 'La verificacion final encontro un horario de oferta laboral no mapeado';
    END IF;
END $$;
