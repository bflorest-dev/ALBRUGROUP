UPDATE evento
SET fecha_rechazo = created_at::date
WHERE accion = 'TIPIFICACION'
  AND etapa = 'VENTA'
  AND tipificacion IN ('SUBSANABLE', 'NO RECUPERABLE')
  AND fecha_rechazo IS NULL;
