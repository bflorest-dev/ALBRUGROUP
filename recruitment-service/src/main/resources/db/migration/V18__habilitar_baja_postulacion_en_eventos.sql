-- V18: incorpora la baja transversal al catalogo de acciones auditables.

DO $$
BEGIN
    IF to_regclass('public.evento') IS NULL THEN
        RAISE EXCEPTION 'No existe la tabla public.evento para aplicar V18';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE c.conname = 'evento_accion_check'
          AND t.relname = 'evento'
          AND n.nspname = 'public'
    ) THEN
        RAISE EXCEPTION 'No existe el constraint public.evento_accion_check para aplicar V18';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.evento
        WHERE accion IS NULL
           OR accion NOT IN (
                'REGISTRO_POSTULACION', 'ACTUALIZACION_POSTULACION',
                'ACTUALIZACION_DATOS_POSTULANTE', 'CONTACTO',
                'ASIGNACION_OFERTA_LABORAL', 'TIPIFICACION',
                'ASIGNACION_GRUPO_CAPACITACION', 'RETIRO_GRUPO_CAPACITACION',
                'TRASLADO_GRUPO_CAPACITACION', 'REPROGRAMACION_GRUPO_CAPACITACION',
                'APROBACION_CAPACITACION', 'DESAPROBACION_CAPACITACION',
                'CONFIRMACION_CONTRATACION', 'PROGRAMACION_RECLUTAMIENTO',
                'REPROGRAMACION_RECLUTAMIENTO', 'ASISTENCIA_MEET',
                'INASISTENCIA_MEET', 'EVALUACION_RECLUTAMIENTO',
                'APROBACION_RECLUTAMIENTO', 'RECHAZO_RECLUTAMIENTO',
                'BAJA_POSTULACION'
           )
    ) THEN
        RAISE EXCEPTION 'public.evento contiene acciones NULL o no reconocidas para V18';
    END IF;
END $$;

ALTER TABLE public.evento
    DROP CONSTRAINT evento_accion_check;

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
            'REPROGRAMACION_GRUPO_CAPACITACION',
            'APROBACION_CAPACITACION',
            'DESAPROBACION_CAPACITACION',
            'CONFIRMACION_CONTRATACION',
            'PROGRAMACION_RECLUTAMIENTO',
            'REPROGRAMACION_RECLUTAMIENTO',
            'ASISTENCIA_MEET',
            'INASISTENCIA_MEET',
            'EVALUACION_RECLUTAMIENTO',
            'APROBACION_RECLUTAMIENTO',
            'RECHAZO_RECLUTAMIENTO',
            'BAJA_POSTULACION'
        )
    );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE c.conname = 'evento_accion_check'
          AND t.relname = 'evento'
          AND n.nspname = 'public'
          AND pg_get_constraintdef(c.oid) LIKE '%BAJA_POSTULACION%'
    ) THEN
        RAISE EXCEPTION 'V18 no pudo registrar BAJA_POSTULACION en evento_accion_check';
    END IF;
END $$;
