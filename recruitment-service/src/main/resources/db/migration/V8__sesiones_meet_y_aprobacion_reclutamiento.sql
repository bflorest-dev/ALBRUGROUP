-- V8: sesiones de Meet por negocio/fecha/horario y aprobación separada del grupo.

ALTER TABLE public.gestion_reclutamiento
    ADD COLUMN resultado_evaluacion VARCHAR(30);

ALTER TABLE public.gestion_reclutamiento
    ADD CONSTRAINT gestion_reclutamiento_resultado_evaluacion_check
    CHECK (resultado_evaluacion IS NULL OR resultado_evaluacion IN ('APROBADO', 'RECHAZADO'));

CREATE TABLE public.horario_meet_reclutamiento (
    id BIGSERIAL PRIMARY KEY,
    negocio VARCHAR(30) NOT NULL CHECK (negocio IN ('WIN', 'CLARO')),
    codigo VARCHAR(40) NOT NULL,
    etiqueta VARCHAR(80) NOT NULL,
    hora_inicio TIME NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_horario_meet_negocio_codigo UNIQUE (negocio, codigo),
    CONSTRAINT uk_horario_meet_negocio_hora UNIQUE (negocio, hora_inicio)
);

CREATE TABLE public.sesion_meet_reclutamiento (
    id BIGSERIAL PRIMARY KEY,
    horario_id BIGINT REFERENCES public.horario_meet_reclutamiento(id),
    negocio VARCHAR(30) CHECK (negocio IS NULL OR negocio IN ('WIN', 'CLARO')),
    fecha DATE NOT NULL,
    fecha_hora_inicio TIMESTAMP NOT NULL,
    enlace VARCHAR(500),
    estado VARCHAR(30) NOT NULL CHECK (estado IN ('PROGRAMADA', 'REALIZADA', 'CANCELADA', 'LEGACY')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_sesion_meet_horario_fecha
    ON public.sesion_meet_reclutamiento (horario_id, fecha)
    WHERE horario_id IS NOT NULL;
CREATE INDEX ix_sesion_meet_fecha_negocio
    ON public.sesion_meet_reclutamiento (fecha, negocio, fecha_hora_inicio);

ALTER TABLE public.actividad_reclutamiento
    ADD COLUMN meet_sesion_id BIGINT REFERENCES public.sesion_meet_reclutamiento(id);
CREATE INDEX ix_actividad_reclutamiento_meet_sesion
    ON public.actividad_reclutamiento (meet_sesion_id);

INSERT INTO public.horario_meet_reclutamiento (negocio, codigo, etiqueta, hora_inicio)
VALUES
    ('WIN', 'WIN_12', '12:00 p. m.', '12:00'),
    ('WIN', 'WIN_17', '5:00 p. m.', '17:00'),
    ('CLARO', 'CLARO_11', '11:00 a. m.', '11:00'),
    ('CLARO', 'CLARO_16', '4:00 p. m.', '16:00');

-- Tipificación explícita para aprobar sin mover todavía la postulación a CAPACITACION.
INSERT INTO public.subtipificacion (
    tipificacion_id, codigo, descripcion, orden, alcance,
    etapa_destino, estado_destino, estado_bandeja_destino, activo
)
SELECT t.id,
       'APROBADO_PENDIENTE_GRUPO',
       'Aprobado en reclutamiento y pendiente de asignación a un grupo',
       2,
       'GENERAL',
       NULL,
       'EN_PROCESO',
       'EN_GESTION',
       TRUE
FROM public.tipificacion t
WHERE t.etapa = 'RECLUTAMIENTO'
  AND t.codigo = 'RECLUTADO'
ON CONFLICT (tipificacion_id, codigo) DO NOTHING;

-- Backfill: cada Meet histórico conserva su fecha/hora y queda enlazado a una sesión.
DO $$
DECLARE
    actividad RECORD;
    horario RECORD;
    sesion_id BIGINT;
BEGIN
    FOR actividad IN
        SELECT a.id, a.postulacion_id, a.fecha_hora, a.referencia, a.estado, p.negocio
        FROM public.actividad_reclutamiento a
        JOIN public.postulacion p ON p.id = a.postulacion_id
        WHERE a.modalidad = 'MEET'
          AND a.meet_sesion_id IS NULL
        ORDER BY a.id
    LOOP
        horario := NULL;
        IF actividad.negocio IS NOT NULL THEN
            SELECT h.*
            INTO horario
            FROM public.horario_meet_reclutamiento h
            WHERE h.negocio = actividad.negocio
              AND h.activo = TRUE
              AND h.hora_inicio = actividad.fecha_hora::time
            LIMIT 1;
        END IF;

        sesion_id := NULL;
        IF horario.id IS NOT NULL THEN
            SELECT s.id
            INTO sesion_id
            FROM public.sesion_meet_reclutamiento s
            WHERE s.horario_id = horario.id
              AND s.fecha = actividad.fecha_hora::date
            LIMIT 1;

            IF sesion_id IS NULL THEN
                INSERT INTO public.sesion_meet_reclutamiento (
                    horario_id, negocio, fecha, fecha_hora_inicio, enlace, estado
                )
                VALUES (
                    horario.id, actividad.negocio, actividad.fecha_hora::date,
                    actividad.fecha_hora, actividad.referencia, 'PROGRAMADA'
                )
                RETURNING id INTO sesion_id;
            END IF;
        ELSE
            INSERT INTO public.sesion_meet_reclutamiento (
                horario_id, negocio, fecha, fecha_hora_inicio, enlace, estado
            )
            VALUES (
                NULL, actividad.negocio, actividad.fecha_hora::date,
                actividad.fecha_hora, actividad.referencia, 'LEGACY'
            )
            RETURNING id INTO sesion_id;
        END IF;

        UPDATE public.actividad_reclutamiento
        SET meet_sesion_id = sesion_id
        WHERE id = actividad.id;
    END LOOP;

    IF EXISTS (
        SELECT 1
        FROM public.actividad_reclutamiento
        WHERE modalidad = 'MEET'
          AND meet_sesion_id IS NULL
    ) THEN
        RAISE EXCEPTION 'Backfill incompleto: existen actividades MEET sin sesion asociada';
    END IF;
END $$;

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM public.horario_meet_reclutamiento) <> 4 THEN
        RAISE EXCEPTION 'El catalogo inicial de horarios Meet no contiene exactamente cuatro horarios';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.actividad_reclutamiento a
        WHERE a.modalidad = 'MEET'
          AND NOT EXISTS (
              SELECT 1
              FROM public.sesion_meet_reclutamiento s
              WHERE s.id = a.meet_sesion_id
          )
    ) THEN
        RAISE EXCEPTION 'Existen actividades MEET con una FK de sesion huerfana';
    END IF;
END $$;
