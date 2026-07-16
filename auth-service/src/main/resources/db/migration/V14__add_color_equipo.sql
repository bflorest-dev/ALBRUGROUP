-- ============================================================
-- V14: Color de marca del equipo
--
-- El admin asigna intencionalmente un color a cada equipo al crearlo/editarlo.
-- El frontend deriva de ese hex las tonalidades del degradado de sus medidores.
-- Nullable: los equipos existentes quedan sin color (el frontend usa gris por
-- defecto) hasta que el admin les asigne uno. Se guarda como '#RRGGBB'.
-- ============================================================

ALTER TABLE equipos ADD COLUMN color VARCHAR(9);
