-- Los asesores postventa duales usan el mismo proveedor cuando alternan a modo backoffice.
-- La tabla conserva ámbitos separados; esta migración crea la fila paralela BACKOFFICE.
INSERT INTO usuario_proveedor (id_empleado, id_proveedor, ambito, activo, created_at, updated_at)
SELECT id_empleado,
       id_proveedor,
       'BACKOFFICE',
       true,
       COALESCE(created_at, now()),
       now()
FROM usuario_proveedor
WHERE ambito = 'POSTVENTA'
  AND COALESCE(activo, true) = true
ON CONFLICT ON CONSTRAINT uq_usuario_proveedor
DO UPDATE SET activo = true,
              updated_at = now();
