UPDATE subtipificacion s
SET etapa_cambio = NULL,
    estado_postventa_cambio = 'EN_COBRANZA'
FROM tipificacion t
WHERE s.tipificacion_id = t.id
  AND t.etapa = 'POSTVENTA'
  AND t.codigo = 'INCIDENCIA'
  AND s.codigo = 'PAGO_PENDIENTE';

UPDATE subtipificacion s
SET activo = FALSE
FROM tipificacion t
WHERE s.tipificacion_id = t.id
  AND t.etapa = 'COBRANZA';

UPDATE tipificacion
SET activo = FALSE
WHERE etapa = 'COBRANZA';

UPDATE lead
SET etapa = 'POSTVENTA',
    estado_postventa = COALESCE(estado_postventa, 'EN_COBRANZA')
WHERE etapa = 'COBRANZA';
