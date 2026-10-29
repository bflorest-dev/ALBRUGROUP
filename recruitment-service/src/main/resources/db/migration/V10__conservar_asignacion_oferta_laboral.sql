-- V10: conserva la acción del Supervisor al ampliar evento_accion_check.
-- V9 ya fue aplicada en entornos locales; esta corrección debe vivir en una
-- migración nueva para no modificar el checksum de una migración ejecutada.

ALTER TABLE public.evento
    DROP CONSTRAINT IF EXISTS evento_accion_check;

ALTER TABLE public.evento
    ADD CONSTRAINT evento_accion_check
    CHECK (
        accion IN (
            'REGISTRO_POSTULACION',
            'ACTUALIZACION_POSTULACION',
            'CONTACTO',
            'ASIGNACION_OFERTA_LABORAL',
            'TIPIFICACION',
            'ASIGNACION_GRUPO_CAPACITACION',
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
                'CONTACTO',
                'ASIGNACION_OFERTA_LABORAL',
                'TIPIFICACION',
                'ASIGNACION_GRUPO_CAPACITACION',
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
        RAISE EXCEPTION 'evento contiene acciones NULL o no mapeadas para V10';
    END IF;
END $$;
