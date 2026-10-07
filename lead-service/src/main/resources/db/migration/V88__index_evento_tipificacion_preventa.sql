CREATE INDEX idx_evento_tipi_preventa_created
    ON evento (created_at)
    WHERE accion = 'TIPIFICACION' AND etapa = 'PREVENTA';
