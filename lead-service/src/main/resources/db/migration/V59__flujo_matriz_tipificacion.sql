CREATE TABLE IF NOT EXISTS flujo_matriz_tipificacion (
    id BIGSERIAL PRIMARY KEY,
    matriz_id BIGINT NOT NULL REFERENCES matriz_tipificacion(id),
    tipificacion_origen_id BIGINT REFERENCES tipificacion(id),
    tipificacion_destino_id BIGINT NOT NULL REFERENCES tipificacion(id),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_flujo_matriz_inicial_destino_activo
    ON flujo_matriz_tipificacion (matriz_id, tipificacion_destino_id)
    WHERE tipificacion_origen_id IS NULL AND activo = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_flujo_matriz_origen_destino_activo
    ON flujo_matriz_tipificacion (matriz_id, tipificacion_origen_id, tipificacion_destino_id)
    WHERE tipificacion_origen_id IS NOT NULL AND activo = TRUE;

INSERT INTO flujo_matriz_tipificacion (matriz_id, tipificacion_origen_id, tipificacion_destino_id, activo)
SELECT m.id, NULL, destino.id, TRUE
FROM matriz_tipificacion m
JOIN tipificacion destino ON destino.matriz_id = m.id
WHERE m.activo
  AND destino.activo
  AND destino.seleccionable_manual = TRUE
ON CONFLICT DO NOTHING;

INSERT INTO flujo_matriz_tipificacion (matriz_id, tipificacion_origen_id, tipificacion_destino_id, activo)
SELECT m.id, origen.id, destino.id, TRUE
FROM matriz_tipificacion m
JOIN tipificacion origen ON origen.matriz_id = m.id
JOIN tipificacion destino ON destino.matriz_id = m.id
WHERE m.activo
  AND origen.activo
  AND destino.activo
  AND destino.seleccionable_manual = TRUE
ON CONFLICT DO NOTHING;
