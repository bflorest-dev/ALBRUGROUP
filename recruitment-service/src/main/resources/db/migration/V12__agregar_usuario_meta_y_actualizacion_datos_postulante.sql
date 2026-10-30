-- V12: habilita postulantes con usuario Meta y trazabilidad de enriquecimiento.

DO $$
BEGIN
    IF to_regclass('public.postulante') IS NULL THEN
        RAISE EXCEPTION 'No existe la tabla public.postulante; no se puede agregar usuario_meta';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'postulante'
          AND column_name = 'usuario_meta'
    ) THEN
        ALTER TABLE public.postulante
            ADD COLUMN usuario_meta VARCHAR(255);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT LOWER(BTRIM(usuario_meta))
        FROM public.postulante
        WHERE usuario_meta IS NOT NULL
        GROUP BY LOWER(BTRIM(usuario_meta))
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Existen usuarios Meta duplicados; no se puede crear el indice unico';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uk_postulante_usuario_meta_ci
    ON public.postulante (LOWER(BTRIM(usuario_meta)))
    WHERE usuario_meta IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'postulante'
          AND indexname = 'uk_postulante_usuario_meta_ci'
    ) THEN
        RAISE EXCEPTION 'No se pudo crear uk_postulante_usuario_meta_ci';
    END IF;
END $$;

ALTER TABLE public.evento
    DROP CONSTRAINT IF EXISTS evento_accion_check;

ALTER TABLE public.evento
    ADD CONSTRAINT evento_accion_check
    CHECK (
        accion IN (
            'REGISTRO_POSTULACION',
            'ACTUALIZACION_POSTULACION',
            'ACTUALIZACION_DATOS_POSTULANTE',
            'CONTACTO',
            'ASIGNACION_OFERTA_LABORAL',
            'TIPIFICACION',
            'ASIGNACION_GRUPO_CAPACITACION',
            'RETIRO_GRUPO_CAPACITACION',
            'TRASLADO_GRUPO_CAPACITACION',
            'APROBACION_CAPACITACION',
            'DESAPROBACION_CAPACITACION',
            'CONFIRMACION_CONTRATACION',
            'PROGRAMACION_RECLUTAMIENTO',
            'REPROGRAMACION_RECLUTAMIENTO',
            'ASISTENCIA_MEET',
            'INASISTENCIA_MEET',
            'EVALUACION_RECLUTAMIENTO',
            'APROBACION_RECLUTAMIENTO',
            'RECHAZO_RECLUTAMIENTO'
        )
    );

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.evento
        WHERE accion IS NULL
           OR accion NOT IN (
                'REGISTRO_POSTULACION',
                'ACTUALIZACION_POSTULACION',
                'ACTUALIZACION_DATOS_POSTULANTE',
                'CONTACTO',
                'ASIGNACION_OFERTA_LABORAL',
                'TIPIFICACION',
                'ASIGNACION_GRUPO_CAPACITACION',
                'RETIRO_GRUPO_CAPACITACION',
                'TRASLADO_GRUPO_CAPACITACION',
                'APROBACION_CAPACITACION',
                'DESAPROBACION_CAPACITACION',
                'CONFIRMACION_CONTRATACION',
                'PROGRAMACION_RECLUTAMIENTO',
                'REPROGRAMACION_RECLUTAMIENTO',
                'ASISTENCIA_MEET',
                'INASISTENCIA_MEET',
                'EVALUACION_RECLUTAMIENTO',
                'APROBACION_RECLUTAMIENTO',
                'RECHAZO_RECLUTAMIENTO'
           )
    ) THEN
        RAISE EXCEPTION 'evento contiene acciones NULL o no mapeadas para V12';
    END IF;
END $$;
