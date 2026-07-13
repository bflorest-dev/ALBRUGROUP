-- Índices para el reporte "gestión por campaña" del DASHBOARD del ADMIN.
-- La matriz filtra leads por la FECHA de la tipificación elegida (primera/última/mayor) dentro de una
-- etapa, agrupando por equipo y campaña. Sin estos índices el filtro por período hace scan completo
-- de lead_etapa_resumen. Cada índice cubre (etapa, <fecha>) porque la etapa siempre está en el WHERE.

CREATE INDEX IF NOT EXISTS idx_lead_etapa_resumen_etapa_mayor_at
    ON lead_etapa_resumen (etapa, mayor_rango_at);

CREATE INDEX IF NOT EXISTS idx_lead_etapa_resumen_etapa_ultima_at
    ON lead_etapa_resumen (etapa, ultima_tipificacion_at);

CREATE INDEX IF NOT EXISTS idx_lead_etapa_resumen_etapa_primera_at
    ON lead_etapa_resumen (etapa, primera_tipificacion_at);
