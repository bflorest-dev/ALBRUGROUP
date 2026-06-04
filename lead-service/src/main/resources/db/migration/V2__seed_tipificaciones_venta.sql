-- Matriz de tipificaciones / subtipificaciones de la etapa VENTA (BackOffice).
-- Fuente: OLD/TIPIS_BACKOFFICE.xlsx
-- Notas:
--   * descripcion = codigo (placeholder; las descripciones reales quedan pendientes).
--   * estado_postventa_cambio = NULL (no aplica a VENTA).
--   * etapa_cambio: VENTA = se mantiene, PREVENTA = regresa, POSTVENTA = avanza.
--   * Idempotente: ON CONFLICT DO NOTHING contra las claves unicas existentes.

-- ===== Tipificaciones (orden 1..7) =====
INSERT INTO tipificacion (etapa, codigo, descripcion, orden, activo) VALUES
    ('VENTA', 'SIN SUBIR',   'SIN SUBIR',   1, TRUE),
    ('VENTA', 'SUBIDO',      'SUBIDO',      2, TRUE),
    ('VENTA', 'DESAPROBADO', 'DESAPROBADO', 3, TRUE),
    ('VENTA', 'PROGRAMADO',  'PROGRAMADO',  4, TRUE),
    ('VENTA', 'RECHAZADO',   'RECHAZADO',   5, TRUE),
    ('VENTA', 'ANULADO',     'ANULADO',     6, TRUE),
    ('VENTA', 'INSTALADO',   'INSTALADO',   7, TRUE)
ON CONFLICT (etapa, codigo) DO NOTHING;

-- ===== Subtipificaciones =====
-- Cada bloque referencia a su tipificacion VENTA por codigo.

-- Tip 0: SIN SUBIR -> todas regresan a PREVENTA
INSERT INTO subtipificacion (tipificacion_id, codigo, descripcion, orden, etapa_cambio, estado_postventa_cambio, activo)
SELECT t.id, s.codigo, s.codigo, s.orden, s.etapa_cambio, NULL, TRUE
FROM tipificacion t
JOIN (VALUES
    ('ANULADO',                       1, 'PREVENTA'),
    ('SIN INGRESAR / CHANCADA',       2, 'PREVENTA'),
    ('DUPLICADO',                     3, 'PREVENTA'),
    ('GRABADO',                       4, 'PREVENTA'),
    ('MAL REGISTRADO',                5, 'PREVENTA'),
    ('NO CONTESTA',                   6, 'PREVENTA'),
    ('NO DESEA-DAR DNI',              7, 'PREVENTA'),
    ('NO DESEA-GRABAR',               8, 'PREVENTA'),
    ('PDTE-HABILITAR CONDOMINIO',     9, 'PREVENTA'),
    ('PDTE-HABILITAR SCORE',         10, 'PREVENTA'),
    ('PDTE-PAGO ADELANTADO',         11, 'PREVENTA'),
    ('SIN ING-EDIFICIO EXCLUSIVIDAD',12, 'PREVENTA'),
    ('SIN ING-SIN COBERTURA',        13, 'PREVENTA'),
    ('SIN ING-SIN CTO',              14, 'PREVENTA')
) AS s(codigo, orden, etapa_cambio) ON TRUE
WHERE t.etapa = 'VENTA' AND t.codigo = 'SIN SUBIR'
ON CONFLICT (tipificacion_id, codigo) DO NOTHING;

-- Tip 1: SUBIDO -> se mantienen en VENTA
INSERT INTO subtipificacion (tipificacion_id, codigo, descripcion, orden, etapa_cambio, estado_postventa_cambio, activo)
SELECT t.id, s.codigo, s.codigo, s.orden, s.etapa_cambio, NULL, TRUE
FROM tipificacion t
JOIN (VALUES
    ('EN PROGRESO', 1, 'VENTA'),
    ('MANCHADA',    2, 'VENTA'),
    ('REVISADO',    3, 'VENTA'),
    ('ZONA FRAUDE', 4, 'VENTA')
) AS s(codigo, orden, etapa_cambio) ON TRUE
WHERE t.etapa = 'VENTA' AND t.codigo = 'SUBIDO'
ON CONFLICT (tipificacion_id, codigo) DO NOTHING;

-- Tip 2: DESAPROBADO -> VENTA
INSERT INTO subtipificacion (tipificacion_id, codigo, descripcion, orden, etapa_cambio, estado_postventa_cambio, activo)
SELECT t.id, s.codigo, s.codigo, s.orden, s.etapa_cambio, NULL, TRUE
FROM tipificacion t
JOIN (VALUES
    ('DESAPROBADO', 1, 'VENTA'),
    ('RESCATE',     2, 'VENTA')
) AS s(codigo, orden, etapa_cambio) ON TRUE
WHERE t.etapa = 'VENTA' AND t.codigo = 'DESAPROBADO'
ON CONFLICT (tipificacion_id, codigo) DO NOTHING;

-- Tip 3: PROGRAMADO -> VENTA (incluye 3.1)
INSERT INTO subtipificacion (tipificacion_id, codigo, descripcion, orden, etapa_cambio, estado_postventa_cambio, activo)
SELECT t.id, s.codigo, s.codigo, s.orden, s.etapa_cambio, NULL, TRUE
FROM tipificacion t
JOIN (VALUES
    ('PROG-AGENDADA',          1, 'VENTA'),
    ('PROG-EN CAMINO',         2, 'VENTA'),
    ('PROG-INICIADA',          3, 'VENTA'),
    ('PROG-SIN CD',            4, 'VENTA'),
    ('PROG-TEC EN CASA',       5, 'VENTA'),
    ('PROGRAMADA',             6, 'VENTA'),
    ('REPROGRAMADA',           7, 'VENTA'),
    ('PROGRAMACION_CANCELADA', 8, 'VENTA')
) AS s(codigo, orden, etapa_cambio) ON TRUE
WHERE t.etapa = 'VENTA' AND t.codigo = 'PROGRAMADO'
ON CONFLICT (tipificacion_id, codigo) DO NOTHING;

-- Tip 4: RECHAZADO -> mezcla VENTA / PREVENTA (incluye 4.1, 4.2, 4.3)
INSERT INTO subtipificacion (tipificacion_id, codigo, descripcion, orden, etapa_cambio, estado_postventa_cambio, activo)
SELECT t.id, s.codigo, s.codigo, s.orden, s.etapa_cambio, NULL, TRUE
FROM tipificacion t
JOIN (VALUES
    ('BAJA-MALA INFO VENTA',         1, 'VENTA'),
    ('BAJA-MULT DEUDAS',             2, 'PREVENTA'),
    ('BAJA-NO DESEA',                3, 'VENTA'),
    ('CTO - EXCEDE METRAJE',         4, 'PREVENTA'),
    ('CTO - ROBADO',                 5, 'VENTA'),
    ('CTO - SATURADO',               6, 'VENTA'),
    ('CTO - SIN POTENCIA',           7, 'VENTA'),
    ('FAC TEC-DUCTOS OBSTRUIDOS',    8, 'VENTA'),
    ('FAC TEC-SIN COBERTURA',        9, 'PREVENTA'),
    ('FAC TEC-SIN PERMISO VECINOS', 10, 'VENTA'),
    ('FAC TEC-SIN POSTE DE APOYO',  11, 'PREVENTA'),
    ('FAC TEC-TORRE NO HABILITADA', 12, 'PREVENTA'),
    ('FAC TEC-ZONA ELEVADA',        13, 'PREVENTA'),
    ('FLIPPING',                    14, 'VENTA'),
    ('INGRESADA / CHANCADA',        15, 'VENTA'),
    ('POSIBLE FRAUDE',              16, 'VENTA'),
    ('ZONA PELIGROSA',              17, 'PREVENTA'),
    ('SIN INSTALAR',                18, 'PREVENTA')
) AS s(codigo, orden, etapa_cambio) ON TRUE
WHERE t.etapa = 'VENTA' AND t.codigo = 'RECHAZADO'
ON CONFLICT (tipificacion_id, codigo) DO NOTHING;

-- Tip 5: ANULADO -> PREVENTA
INSERT INTO subtipificacion (tipificacion_id, codigo, descripcion, orden, etapa_cambio, estado_postventa_cambio, activo)
SELECT t.id, s.codigo, s.codigo, s.orden, s.etapa_cambio, NULL, TRUE
FROM tipificacion t
JOIN (VALUES
    ('BLACKLIST', 1, 'PREVENTA')
) AS s(codigo, orden, etapa_cambio) ON TRUE
WHERE t.etapa = 'VENTA' AND t.codigo = 'ANULADO'
ON CONFLICT (tipificacion_id, codigo) DO NOTHING;

-- Tip 6: INSTALADO -> POSTVENTA
INSERT INTO subtipificacion (tipificacion_id, codigo, descripcion, orden, etapa_cambio, estado_postventa_cambio, activo)
SELECT t.id, s.codigo, s.codigo, s.orden, s.etapa_cambio, NULL, TRUE
FROM tipificacion t
JOIN (VALUES
    ('INSTALADA', 1, 'POSTVENTA')
) AS s(codigo, orden, etapa_cambio) ON TRUE
WHERE t.etapa = 'VENTA' AND t.codigo = 'INSTALADO'
ON CONFLICT (tipificacion_id, codigo) DO NOTHING;
