-- V6: habilita WHATSAPP como modalidad de contacto de los eventos de reclutamiento.
-- No transforma datos existentes; solo reemplaza la restriccion de dominio anterior.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.evento'::regclass
          AND conname = 'evento_modalidad_contacto_check'
    ) THEN
        RAISE EXCEPTION 'No existe la restriccion evento_modalidad_contacto_check esperada';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.evento
        WHERE modalidad_contacto IS NOT NULL
          AND modalidad_contacto NOT IN ('LLAMADA', 'MEET', 'PRESENCIAL', 'WHATSAPP')
    ) THEN
        RAISE EXCEPTION 'Existen modalidades de contacto no mapeadas antes de ampliar la restriccion';
    END IF;
END $$;

ALTER TABLE public.evento
    DROP CONSTRAINT evento_modalidad_contacto_check;

ALTER TABLE public.evento
    ADD CONSTRAINT evento_modalidad_contacto_check
    CHECK (
        modalidad_contacto IS NULL
        OR modalidad_contacto IN ('LLAMADA', 'MEET', 'PRESENCIAL', 'WHATSAPP')
    );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.evento'::regclass
          AND conname = 'evento_modalidad_contacto_check'
          AND position('WHATSAPP' IN pg_get_constraintdef(oid)) > 0
    ) THEN
        RAISE EXCEPTION 'La restriccion evento_modalidad_contacto_check no incluye WHATSAPP';
    END IF;
END $$;
