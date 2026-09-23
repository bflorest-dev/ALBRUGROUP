-- ==========================================================================
-- V73: Marcar subtipificaciones de grabación con ES_GRABACION
--
-- WIN:       todas las subtipis bajo tipi GRABADO (935-939)
-- CLARO:     "CON SEC - GRABADO" (403)
-- MIFIBRA:   "GRABADO" bajo SIN INGRESAR (504)
-- PERUFIBRA: "GRABADO" bajo SIN INGRESAR (503)
-- ==========================================================================

INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
VALUES
    (935, 'ES_GRABACION'),
    (936, 'ES_GRABACION'),
    (937, 'ES_GRABACION'),
    (938, 'ES_GRABACION'),
    (939, 'ES_GRABACION'),
    (403, 'ES_GRABACION'),
    (504, 'ES_GRABACION'),
    (503, 'ES_GRABACION')
ON CONFLICT DO NOTHING;
