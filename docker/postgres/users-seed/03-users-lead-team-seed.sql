-- Backfill: asigna a cada lead sin equipo el equipo de su campaña, según el mapping
-- real equipo_proveedor (campaña -> proveedor -> equipo). Los mapeos de equipos de prueba
-- se eliminaron de este seeder; los mapeos reales deben venir del seed/gestion del catalogo.
UPDATE lead l
SET id_equipo = ep.id_equipo
FROM campana c
JOIN equipo_proveedor ep ON ep.id_proveedor = c.id_proveedor
WHERE l.id_campana = c.id
  AND l.id_equipo IS NULL;
