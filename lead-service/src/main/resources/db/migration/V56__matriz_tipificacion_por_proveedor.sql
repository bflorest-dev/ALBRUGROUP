CREATE TABLE IF NOT EXISTS matriz_tipificacion (
    id BIGSERIAL PRIMARY KEY,
    etapa VARCHAR(32) NOT NULL,
    id_proveedor BIGINT NOT NULL REFERENCES proveedor(id),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_matriz_tipificacion_etapa_proveedor UNIQUE (etapa, id_proveedor)
);

ALTER TABLE tipificacion ADD COLUMN IF NOT EXISTS matriz_id BIGINT;

CREATE TEMP TABLE _matriz_tipificacion_origen AS
SELECT DISTINCT
    t.id_equipo,
    t.etapa,
    COALESCE(ep.id_proveedor, proveedor_legacy.id) AS id_proveedor
FROM tipificacion t
LEFT JOIN equipo_proveedor ep
  ON ep.id_equipo = t.id_equipo
 AND ep.fallback_lead_sin_campana = TRUE
LEFT JOIN proveedor proveedor_legacy
  ON proveedor_legacy.id = t.id_equipo
 AND NOT EXISTS (
     SELECT 1
     FROM lead l
     WHERE l.id_equipo = t.id_equipo
 )
WHERE t.matriz_id IS NULL
  AND t.id_equipo IS NOT NULL;

DO $$
DECLARE
    conflicto TEXT;
    sin_fallback TEXT;
BEGIN
    SELECT string_agg(format('equipo %s / etapa %s', origen.id_equipo, origen.etapa), E'\n')
    INTO sin_fallback
    FROM _matriz_tipificacion_origen origen
    WHERE origen.id_proveedor IS NULL;

    IF sin_fallback IS NOT NULL THEN
        RAISE EXCEPTION 'No se puede migrar matriz de tipificaciones: hay equipos sin proveedor fallback:%',
            E'\n' || sin_fallback;
    END IF;

    WITH tipis AS (
        SELECT
            t.id_equipo,
            origen.id_proveedor,
            t.etapa,
            jsonb_agg(
                jsonb_build_object(
                    'codigo', t.codigo,
                    'descripcion', t.descripcion,
                    'orden', t.orden,
                    'activo', t.activo,
                    'subs', COALESCE((
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'codigo', s.codigo,
                                'descripcion', s.descripcion,
                                'orden', s.orden,
                                'etapaCambio', s.etapa_cambio,
                                'activo', s.activo,
                                'comportamientos', COALESCE((
                                    SELECT jsonb_agg(sc.comportamiento ORDER BY sc.comportamiento)
                                    FROM subtipificacion_comportamiento sc
                                    WHERE sc.subtipificacion_id = s.id
                                ), '[]'::jsonb)
                            )
                            ORDER BY s.orden, s.codigo
                        )
                        FROM subtipificacion s
                        WHERE s.tipificacion_id = t.id
                    ), '[]'::jsonb)
                )
                ORDER BY t.orden, t.codigo
            ) AS firma
        FROM tipificacion t
        JOIN _matriz_tipificacion_origen origen
          ON origen.id_equipo = t.id_equipo
         AND origen.etapa = t.etapa
         AND origen.id_proveedor IS NOT NULL
        WHERE t.matriz_id IS NULL
        GROUP BY t.id_equipo, origen.id_proveedor, t.etapa
    ),
    conflictos AS (
        SELECT etapa, id_proveedor, COUNT(DISTINCT firma) AS firmas
        FROM tipis
        GROUP BY etapa, id_proveedor
        HAVING COUNT(DISTINCT firma) > 1
    )
    SELECT string_agg(format('proveedor %s / etapa %s', id_proveedor, etapa), E'\n')
    INTO conflicto
    FROM conflictos;

    IF conflicto IS NOT NULL THEN
        RAISE EXCEPTION 'No se puede migrar matriz de tipificaciones: existen matrices distintas para el mismo proveedor/etapa:%',
            E'\n' || conflicto;
    END IF;
END $$;

INSERT INTO matriz_tipificacion (etapa, id_proveedor, activo)
SELECT DISTINCT origen.etapa, origen.id_proveedor, TRUE
FROM _matriz_tipificacion_origen origen
WHERE origen.id_proveedor IS NOT NULL
ON CONFLICT (etapa, id_proveedor) DO NOTHING;

UPDATE tipificacion t
SET matriz_id = m.id
FROM _matriz_tipificacion_origen origen
JOIN matriz_tipificacion m
  ON m.id_proveedor = origen.id_proveedor
WHERE origen.id_equipo = t.id_equipo
  AND origen.etapa = t.etapa
  AND m.etapa = t.etapa
  AND t.matriz_id IS NULL;

DO $$
DECLARE
    pendientes TEXT;
BEGIN
    SELECT string_agg(id::text, ', ')
    INTO pendientes
    FROM tipificacion
    WHERE matriz_id IS NULL;

    IF pendientes IS NOT NULL THEN
        RAISE EXCEPTION 'No se pudo asignar matriz_id a las tipificaciones: %', pendientes;
    END IF;
END $$;

WITH ranked AS (
    SELECT
        t.id,
        first_value(t.id) OVER (
            PARTITION BY t.matriz_id, upper(trim(t.codigo))
            ORDER BY CASE WHEN t.activo THEN 0 ELSE 1 END, t.id
        ) AS id_canonico,
        row_number() OVER (
            PARTITION BY t.matriz_id, upper(trim(t.codigo))
            ORDER BY CASE WHEN t.activo THEN 0 ELSE 1 END, t.id
        ) AS rn
    FROM tipificacion t
),
sub_canonica AS (
    SELECT
        s.id,
        t.matriz_id,
        upper(trim(t.codigo)) AS codigo_tipificacion,
        upper(trim(s.codigo)) AS codigo_subtipificacion,
        first_value(s.id) OVER (
            PARTITION BY t.matriz_id, upper(trim(t.codigo)), upper(trim(s.codigo))
            ORDER BY CASE WHEN t.activo THEN 0 ELSE 1 END, CASE WHEN s.activo THEN 0 ELSE 1 END, s.id
        ) AS id_canonico
    FROM subtipificacion s
    JOIN tipificacion t ON t.id = s.tipificacion_id
)
UPDATE lead l
SET id_tipificacion = rt.id_canonico,
    id_subtipificacion = COALESCE((
        SELECT sc.id_canonico
        FROM sub_canonica sc
        WHERE sc.id = l.id_subtipificacion
    ), l.id_subtipificacion)
FROM ranked rt
WHERE l.id_tipificacion = rt.id
  AND rt.id <> rt.id_canonico;

WITH ranked AS (
    SELECT
        id,
        row_number() OVER (
            PARTITION BY matriz_id, upper(trim(codigo))
            ORDER BY CASE WHEN activo THEN 0 ELSE 1 END, id
        ) AS rn
    FROM tipificacion
)
UPDATE tipificacion t
SET codigo = '__ARCHIVED_TIP_' || t.id,
    activo = FALSE
FROM ranked r
WHERE r.id = t.id
  AND r.rn > 1;

ALTER TABLE tipificacion ALTER COLUMN matriz_id SET NOT NULL;
ALTER TABLE tipificacion ALTER COLUMN etapa DROP NOT NULL;
ALTER TABLE tipificacion ALTER COLUMN id_equipo DROP NOT NULL;

ALTER TABLE tipificacion
    ADD CONSTRAINT fk_tipificacion_matriz
    FOREIGN KEY (matriz_id) REFERENCES matriz_tipificacion(id);

ALTER TABLE tipificacion DROP CONSTRAINT IF EXISTS uk_tipificacion_etapa_equipo_codigo;
ALTER TABLE tipificacion DROP CONSTRAINT IF EXISTS tipificacion_etapa_id_equipo_codigo_key;
ALTER TABLE tipificacion DROP CONSTRAINT IF EXISTS tipificacion_matriz_id_codigo_key;

ALTER TABLE tipificacion
    ADD CONSTRAINT uk_tipificacion_matriz_codigo UNIQUE (matriz_id, codigo);

CREATE INDEX IF NOT EXISTS idx_tipificacion_matriz ON tipificacion (matriz_id);
