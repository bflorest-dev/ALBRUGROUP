-- V9: alinea la restricción histórica de Evento con las acciones del flujo operativo nuevo.
-- No transforma datos: conserva las acciones legacy y habilita las nuevas acciones ya emitidas
-- por GestionReclutamientoService.

ALTER TABLE public.evento
    DROP CONSTRAINT IF EXISTS evento_accion_check;

ALTER TABLE public.evento
    ADD CONSTRAINT evento_accion_check
    CHECK (
        accion IN (
            'REGISTRO_POSTULACION',
            'ACTUALIZACION_POSTULACION',
            'CONTACTO',
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
        RAISE EXCEPTION 'evento contiene acciones NULL o no mapeadas para V9';
    END IF;
END $$;
