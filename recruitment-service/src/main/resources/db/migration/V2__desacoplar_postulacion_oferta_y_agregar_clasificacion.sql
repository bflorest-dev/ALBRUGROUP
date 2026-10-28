-- V2: Clasificacion propia, fecha manual y registro sin oferta laboral.

ALTER TABLE postulante
    ADD COLUMN numero_exclusivo_llamadas VARCHAR(255);

ALTER TABLE postulacion
    ADD COLUMN puesto_objetivo VARCHAR(255),
    ADD COLUMN negocio VARCHAR(255),
    ADD COLUMN modalidad VARCHAR(255),
    ADD COLUMN horario VARCHAR(255),
    ADD COLUMN fecha_postulacion DATE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM postulacion p
        LEFT JOIN oferta_laboral o ON o.id = p.oferta_laboral_id
        WHERE o.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Existe una postulacion con oferta laboral inexistente; backfill detenido';
    END IF;

    IF EXISTS (SELECT 1 FROM postulacion WHERE created_at IS NULL) THEN
        RAISE EXCEPTION 'Existe una postulacion sin created_at; no se puede calcular fecha_postulacion';
    END IF;
END $$;

UPDATE oferta_laboral
SET negocio = 'WIN'
WHERE negocio = 'FIBRA_MIXTO';

UPDATE postulacion p
SET puesto_objetivo = o.puesto_objetivo,
    negocio = CASE WHEN o.negocio = 'FIBRA_MIXTO' THEN 'WIN' ELSE o.negocio END,
    modalidad = o.modalidad,
    horario = o.horario,
    fecha_postulacion = (p.created_at AT TIME ZONE 'America/Lima')::date
FROM oferta_laboral o
WHERE o.id = p.oferta_laboral_id;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM postulacion WHERE puesto_objetivo IS NULL) THEN
        RAISE EXCEPTION 'El backfill no pudo completar puesto_objetivo en todas las postulaciones';
    END IF;

    IF EXISTS (SELECT 1 FROM postulacion WHERE fecha_postulacion IS NULL) THEN
        RAISE EXCEPTION 'El backfill no pudo completar fecha_postulacion en todas las postulaciones';
    END IF;

    IF EXISTS (SELECT 1 FROM oferta_laboral WHERE negocio = 'FIBRA_MIXTO') THEN
        RAISE EXCEPTION 'Quedaron ofertas laborales con el valor obsoleto FIBRA_MIXTO';
    END IF;
END $$;

ALTER TABLE postulacion
    ALTER COLUMN puesto_objetivo SET NOT NULL,
    ALTER COLUMN fecha_postulacion SET NOT NULL;

-- oferta_laboral_id ya es nullable en V1; se conserva la FK existente.
