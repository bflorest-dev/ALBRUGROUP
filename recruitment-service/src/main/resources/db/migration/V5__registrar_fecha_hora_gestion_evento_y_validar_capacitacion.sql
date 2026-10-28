-- V5: conserva la fecha/hora manual de gestión y evita postulaciones huérfanas en capacitación.

ALTER TABLE public.evento
    ADD COLUMN fecha_hora_gestion TIMESTAMP WITHOUT TIME ZONE;

DO $$
DECLARE
    postulaciones_sin_grupo TEXT;
BEGIN
    IF to_regclass('public.postulacion') IS NULL
       OR to_regclass('public.grupo_capacitacion_detalle') IS NULL THEN
        RAISE EXCEPTION 'No existen las tablas necesarias para validar postulaciones en capacitacion';
    END IF;

    SELECT string_agg(p.id::text, ', ' ORDER BY p.id)
    INTO postulaciones_sin_grupo
    FROM public.postulacion p
    WHERE p.etapa = 'CAPACITACION'
      AND NOT EXISTS (
          SELECT 1
          FROM public.grupo_capacitacion_detalle gcd
          WHERE gcd.postulacion_id = p.id
      );

    IF postulaciones_sin_grupo IS NOT NULL THEN
        RAISE EXCEPTION
            'Existen postulaciones en CAPACITACION sin grupo de capacitacion: %',
            postulaciones_sin_grupo;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'evento'
          AND column_name = 'fecha_hora_gestion'
          AND data_type <> 'timestamp without time zone'
    ) THEN
        RAISE EXCEPTION 'evento.fecha_hora_gestion no tiene el tipo timestamp without time zone';
    END IF;
END $$;
