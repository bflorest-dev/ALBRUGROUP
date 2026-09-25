-- ===========================================================================
-- V74: El nombre operativo INGRESADO representa el hito REGISTRADO.
-- No modifica los datos históricos de lead_seguimiento ni sus fallbacks.
-- ===========================================================================

INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT s.id, 'REGISTRA_INGRESO_VENTA'
FROM subtipificacion s
JOIN tipificacion t ON t.id = s.tipificacion_id
WHERE s.activo
  AND t.activo
  AND t.etapa = 'VENTA'
  AND t.codigo = 'INGRESADO'
ON CONFLICT DO NOTHING;
