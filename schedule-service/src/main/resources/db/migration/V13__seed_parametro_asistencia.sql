-- ============================================================
-- V13: seed de parametro_asistencia
--
-- Fila global (rol NULL) con tolerancia/bloqueo/pausa y margen por defecto.
-- Filas por rol solo para los que difieren (margen de adelanto 30 min): GTR y supervisores.
-- Los demas roles (ASESOR_VENTAS, OJT, ...) caen al default global (margen 5).
-- El resolver aplica precedencia: fila por rol > global > default de codigo.
-- Editable en runtime; estos son los valores iniciales.
-- ============================================================

-- Global
INSERT INTO parametro_asistencia
    (rol, id_equipo, margen_adelanto_min, tolerancia_tardanza_min, bloqueo_tardanza_min,
     max_minutos_pausa_activa, max_usos_pausa_activa_dia, created_at, updated_at)
VALUES
    (NULL, NULL, 5, 5, 20, 5, 1, now(), now());

-- Roles con margen de adelanto de 30 min (solo se setea margen; el resto cae al global)
INSERT INTO parametro_asistencia (rol, margen_adelanto_min, created_at, updated_at) VALUES
    ('ASESOR_GTR',        30, now(), now()),
    ('SUPERVISOR_VENTAS', 30, now(), now()),
    ('SUPERVISOR_GTR',    30, now(), now());
