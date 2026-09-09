INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT s.id, 'REQUIERE_FECHA_RECHAZO'
FROM subtipificacion s
JOIN tipificacion t ON t.id = s.tipificacion_id
JOIN matriz_tipificacion m ON m.id = t.matriz_id
WHERE s.activo
  AND t.activo
  AND m.etapa = 'VENTA'
  AND upper(trim(t.codigo)) IN ('SUBSANABLE', 'NO RECUPERABLE')
ON CONFLICT DO NOTHING;
