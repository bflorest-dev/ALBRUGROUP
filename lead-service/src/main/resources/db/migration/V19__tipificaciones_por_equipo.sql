-- Matrices de tipificaciones por equipo.
--
-- Hasta ahora existía UNA sola matriz global por etapa (unique (etapa, codigo)). A partir de aquí cada
-- equipo tiene su propia matriz: Tipificacion.id_equipo NOT NULL y unique (etapa, id_equipo, codigo).
-- La resolución al tipificar es por (etapa, id_equipo del lead) y es fail-closed (un equipo sin matriz
-- en una etapa no puede tipificar en ella).
--
-- Para que a nivel de usuario no cambie nada al desplegar, la matriz global actual se replica a cada
-- equipo: el equipo base (1) conserva las filas existentes (con su histórico) y los demás equipos reciben
-- una copia limpia de las tipificaciones/subtipificaciones ACTIVAS.
--
-- Flyway ejecuta el script dentro de una transacción (no usar BEGIN/COMMIT).

-- 1) Columna nullable para poder backfillear.
ALTER TABLE tipificacion ADD COLUMN IF NOT EXISTS id_equipo BIGINT;

-- 2) El equipo base (1) se queda con las filas actuales (sus subtipificaciones ya apuntan bien).
UPDATE tipificacion SET id_equipo = 1 WHERE id_equipo IS NULL;

-- 3) id_equipo obligatorio y unicidad por (etapa, id_equipo, codigo). Debe hacerse ANTES de clonar:
--    el constraint viejo (etapa, codigo) impediría que dos equipos compartan el mismo código.
ALTER TABLE tipificacion ALTER COLUMN id_equipo SET NOT NULL;
ALTER TABLE tipificacion DROP CONSTRAINT IF EXISTS uk_tipificacion_etapa_codigo;
ALTER TABLE tipificacion
    ADD CONSTRAINT uk_tipificacion_etapa_equipo_codigo UNIQUE (etapa, id_equipo, codigo);

-- 4) Replicar la matriz activa del equipo base a los demás equipos destino: todos los equipos que hoy
--    tienen leads (para que ninguno quede fail-closed) más los equipos activos conocidos (1..4).
DO $$
DECLARE
    destino BIGINT;
BEGIN
    FOR destino IN
        SELECT DISTINCT e FROM (
            SELECT id_equipo AS e FROM lead WHERE id_equipo IS NOT NULL
            UNION
            SELECT unnest(ARRAY[1, 2, 3, 4]::BIGINT[])
        ) t
        WHERE e <> 1
        ORDER BY e
    LOOP
        -- Copias de tipificaciones activas del base, mapeando old_id -> new_id para reconstruir hijos.
        CREATE TEMP TABLE _map_tip (old_id BIGINT, new_id BIGINT);

        WITH ins AS (
            INSERT INTO tipificacion (etapa, id_equipo, codigo, descripcion, orden, activo)
            SELECT etapa, destino, codigo, descripcion, orden, activo
            FROM tipificacion
            WHERE id_equipo = 1 AND activo = TRUE
            RETURNING id, etapa, codigo
        )
        INSERT INTO _map_tip (old_id, new_id)
        SELECT base.id, ins.id
        FROM ins
        JOIN tipificacion base
          ON base.id_equipo = 1 AND base.activo = TRUE
         AND base.etapa = ins.etapa AND base.codigo = ins.codigo;

        -- Copias de subtipificaciones activas apuntando a las nuevas tipificaciones.
        INSERT INTO subtipificacion
            (tipificacion_id, codigo, descripcion, orden, etapa_cambio, estado_postventa_cambio, activo)
        SELECT m.new_id, s.codigo, s.descripcion, s.orden, s.etapa_cambio, s.estado_postventa_cambio, s.activo
        FROM subtipificacion s
        JOIN _map_tip m ON m.old_id = s.tipificacion_id
        WHERE s.activo = TRUE;

        DROP TABLE _map_tip;
    END LOOP;
END $$;
