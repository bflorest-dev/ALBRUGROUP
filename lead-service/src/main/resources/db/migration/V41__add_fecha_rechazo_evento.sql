ALTER TABLE evento
    ADD COLUMN fecha_rechazo DATE;

CREATE INDEX idx_evento_rechazo_venta
    ON evento (accion, etapa, tipificacion, fecha_rechazo, id_lead, created_at);
