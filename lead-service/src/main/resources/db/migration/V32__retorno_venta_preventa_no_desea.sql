-- El retorno desde VENTA ya no debe marcarse como PREVENTA real.
-- Se registra como descarte comercial en PREVENTA: NO DESEA / PREVENTA DESAPROBADA.

INSERT INTO subtipificacion (tipificacion_id, codigo, descripcion, orden, etapa_cambio, activo)
SELECT t.id,
       'PREVENTA DESAPROBADA',
       'Venta desaprobada',
       COALESCE(MAX(s.orden), 0) + 1,
       'PREVENTA',
       TRUE
FROM tipificacion t
LEFT JOIN subtipificacion s ON s.tipificacion_id = t.id
WHERE t.etapa = 'PREVENTA'
  AND t.codigo = 'NO DESEA'
GROUP BY t.id
ON CONFLICT DO NOTHING;

UPDATE subtipificacion s
SET descripcion = 'Venta desaprobada',
    etapa_cambio = 'PREVENTA',
    activo = TRUE
FROM tipificacion t
WHERE t.id = s.tipificacion_id
  AND t.etapa = 'PREVENTA'
  AND t.codigo = 'NO DESEA'
  AND s.codigo = 'PREVENTA DESAPROBADA';

UPDATE subtipificacion s
SET activo = FALSE
FROM tipificacion t
WHERE t.id = s.tipificacion_id
  AND t.etapa = 'PREVENTA'
  AND t.codigo = 'PREVENTA'
  AND s.codigo IN ('DESAPROBADA', 'DESAPROBADO');
