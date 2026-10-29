-- V11: habilita las acciones de retiro y traslado de grupo de capacitacion en la traza de Evento.
-- Aditiva y sin transformar datos: conserva todas las acciones vigentes y agrega
-- RETIRO_GRUPO_CAPACITACION y TRASLADO_GRUPO_CAPACITACION, necesarias para las operaciones de
-- retirar un postulante de un grupo y moverlo entre grupos abiertos.

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

-- Falla ruidosamente si en produccion existieran acciones fuera del catalogo esperado,
-- en vez de dejar filas huerfanas que rompan el constraint en silencio.
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
        RAISE EXCEPTION 'evento contiene acciones NULL o no mapeadas para V11';
    END IF;
END $$;
