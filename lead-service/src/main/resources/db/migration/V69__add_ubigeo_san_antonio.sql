-- Agrega el distrito de San Antonio, provincia de Mariscal Nieto,
-- departamento de Moquegua (ubigeo 180107).
--
-- La migracion es autocontenida porque Flyway se ejecuta antes del
-- UbigeoDataLoader en instalaciones nuevas.

INSERT INTO departamento (codigo, nombre)
VALUES ('18', 'Moquegua')
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre;

INSERT INTO provincia (codigo, nombre, departamento_id)
SELECT '1801', 'Mariscal Nieto', d.id
FROM departamento d
WHERE d.codigo = '18'
ON CONFLICT (departamento_id, codigo) DO UPDATE
SET nombre = EXCLUDED.nombre;

INSERT INTO distrito (codigo, nombre, provincia_id, departamento_id)
SELECT '180107', 'San Antonio', p.id, d.id
FROM departamento d
JOIN provincia p
  ON p.codigo = '1801'
 AND p.departamento_id = d.id
WHERE d.codigo = '18'
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre,
    provincia_id = EXCLUDED.provincia_id,
    departamento_id = EXCLUDED.departamento_id;
