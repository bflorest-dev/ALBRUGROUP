-- Fase 1: separar el mérito en comportamientos explícitos sin romper matrices existentes.
-- RECIBE_MERITO queda temporalmente como compatibilidad, pero toda subtipificación que lo tenía
-- recibe también los comportamientos nuevos equivalentes.

INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT c.subtipificacion_id, v.comportamiento
FROM subtipificacion_comportamiento c
CROSS JOIN (VALUES
    ('ASIGNA_ASESOR_MERITO'),
    ('ASIGNA_FECHA_MERITO')
) AS v(comportamiento)
WHERE c.comportamiento = 'RECIBE_MERITO'
ON CONFLICT DO NOTHING;

-- Compatibilidad con cualquier matriz histórica/custom donde POSTVENTA todavía avance a COBRANZA.
-- Antes esa transición asignaba mérito por lógica de servicio; ahora debe quedar expresada en matriz.
INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT s.id, v.comportamiento
FROM subtipificacion s
JOIN tipificacion t ON t.id = s.tipificacion_id
CROSS JOIN (VALUES
    ('ASIGNA_ASESOR_MERITO'),
    ('ASIGNA_FECHA_MERITO')
) AS v(comportamiento)
WHERE t.etapa = 'POSTVENTA'
  AND s.etapa_cambio = 'COBRANZA'
ON CONFLICT DO NOTHING;
