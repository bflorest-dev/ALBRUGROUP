-- Asignación operativa exclusiva campaña → equipo.
-- El equipo es administrado por auth-service, por eso id_equipo es una referencia lógica.

CREATE TABLE equipo_campana (
    id          BIGSERIAL PRIMARY KEY,
    id_equipo   BIGINT NOT NULL,
    id_campana  BIGINT NOT NULL REFERENCES campana(id),
    CONSTRAINT uq_equipo_campana_campana UNIQUE (id_campana)
);

CREATE INDEX idx_equipo_campana_equipo ON equipo_campana (id_equipo);
CREATE INDEX idx_equipo_campana_campana ON equipo_campana (id_campana);

-- Backfill determinista: todas las campañas CLARO presentes al desplegar quedan en ClaroTeam.
-- Se resuelve por nombres, no por ids locales, para cubrir filas nuevas en producción.
DO $$
DECLARE
    v_equipo_claro BIGINT := 2;
    v_campanas_claro BIGINT;
    v_asignaciones_claro BIGINT;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM equipo_proveedor ep
        JOIN proveedor p ON p.id = ep.id_proveedor
        WHERE ep.id_equipo = v_equipo_claro
          AND UPPER(p.nombre) = 'CLARO'
    ) THEN
        RAISE EXCEPTION 'No existe la relación CLARO para ClaroTeam (id de equipo esperado: %)', v_equipo_claro;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM equipo_campana ec
        JOIN campana c ON c.id = ec.id_campana
        JOIN proveedor p ON p.id = c.id_proveedor
        WHERE UPPER(p.nombre) = 'CLARO'
          AND ec.id_equipo <> v_equipo_claro
    ) THEN
        RAISE EXCEPTION 'Existe una campaña CLARO asignada a un equipo distinto de ClaroTeam';
    END IF;

    INSERT INTO equipo_campana (id_equipo, id_campana)
    SELECT v_equipo_claro, c.id
    FROM campana c
    JOIN proveedor p ON p.id = c.id_proveedor
    WHERE UPPER(p.nombre) = 'CLARO'
    ON CONFLICT (id_campana) DO UPDATE
        SET id_equipo = EXCLUDED.id_equipo;

    SELECT COUNT(*) INTO v_campanas_claro
    FROM campana c
    JOIN proveedor p ON p.id = c.id_proveedor
    WHERE UPPER(p.nombre) = 'CLARO';

    SELECT COUNT(*) INTO v_asignaciones_claro
    FROM equipo_campana ec
    JOIN campana c ON c.id = ec.id_campana
    JOIN proveedor p ON p.id = c.id_proveedor
    WHERE UPPER(p.nombre) = 'CLARO'
      AND ec.id_equipo = v_equipo_claro;

    IF v_campanas_claro <> v_asignaciones_claro THEN
        RAISE EXCEPTION 'Backfill CLARO incompleto: campañas %, asignaciones %',
            v_campanas_claro, v_asignaciones_claro;
    END IF;
END $$;
