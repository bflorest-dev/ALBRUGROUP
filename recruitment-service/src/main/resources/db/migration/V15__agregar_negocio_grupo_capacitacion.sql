DO $$
BEGIN
    IF to_regclass('public.grupo_capacitacion') IS NULL
       OR to_regclass('public.grupo_capacitacion_detalle') IS NULL
       OR to_regclass('public.postulacion') IS NULL THEN
        RAISE EXCEPTION 'No se puede separar grupos por negocio: faltan tablas requeridas';
    END IF;
END $$;

ALTER TABLE grupo_capacitacion
    ADD COLUMN negocio VARCHAR(20);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM grupo_capacitacion g
        LEFT JOIN grupo_capacitacion_detalle d
            ON d.grupo_capacitacion_id = g.id
        LEFT JOIN postulacion p
            ON p.id = d.postulacion_id
        GROUP BY g.id
        HAVING COUNT(d.id) = 0
            OR COUNT(DISTINCT p.negocio) <> 1
    ) THEN
        RAISE EXCEPTION
            'No se puede completar negocio de grupos: existe un grupo vacio, sin negocio en sus postulaciones o con negocios mezclados';
    END IF;

    UPDATE grupo_capacitacion g
       SET negocio = origen.negocio
      FROM (
          SELECT d.grupo_capacitacion_id, MIN(p.negocio) AS negocio
          FROM grupo_capacitacion_detalle d
          JOIN postulacion p ON p.id = d.postulacion_id
          GROUP BY d.grupo_capacitacion_id
      ) origen
     WHERE origen.grupo_capacitacion_id = g.id;

    IF EXISTS (SELECT 1 FROM grupo_capacitacion WHERE negocio IS NULL) THEN
        RAISE EXCEPTION 'No se pudo backfillear negocio para todos los grupos';
    END IF;
END $$;

ALTER TABLE grupo_capacitacion
    ALTER COLUMN negocio SET NOT NULL;

CREATE INDEX idx_grupo_capacitacion_negocio
    ON grupo_capacitacion (negocio);
