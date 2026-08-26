-- Fase 2: eliminar RECIBE_MERITO sin cambiar el comportamiento real.
-- Primero copiamos su significado a los comportamientos explícitos y luego quitamos el valor legacy.

INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT c.subtipificacion_id, v.comportamiento
FROM subtipificacion_comportamiento c
CROSS JOIN (VALUES
    ('ASIGNA_ASESOR_MERITO'),
    ('ASIGNA_FECHA_MERITO')
) AS v(comportamiento)
WHERE c.comportamiento = 'RECIBE_MERITO'
ON CONFLICT DO NOTHING;

DELETE FROM subtipificacion_comportamiento
WHERE comportamiento = 'RECIBE_MERITO';
