CREATE TEMP TABLE seed_equipo_proveedor (
    equipo_id BIGINT,
    proveedor_nombre TEXT
);

INSERT INTO seed_equipo_proveedor (equipo_id, proveedor_nombre) VALUES
(101, 'WIN'),
(102, 'CLARO'),
(103, 'MIFIBRA'),
(103, 'PERUFIBRA');

DELETE FROM equipo_proveedor ep
USING seed_equipo_proveedor sep
WHERE ep.id_equipo = sep.equipo_id;

INSERT INTO equipo_proveedor (
    id_equipo,
    id_proveedor
)
SELECT
    sep.equipo_id,
    p.id
FROM seed_equipo_proveedor sep
JOIN proveedor p ON UPPER(TRIM(p.nombre)) = UPPER(TRIM(sep.proveedor_nombre))
ON CONFLICT (id_equipo, id_proveedor) DO NOTHING;

UPDATE lead l
SET id_equipo = ep.id_equipo
FROM campana c
JOIN equipo_proveedor ep ON ep.id_proveedor = c.id_proveedor
WHERE l.id_campana = c.id
  AND l.id_equipo IS NULL;
