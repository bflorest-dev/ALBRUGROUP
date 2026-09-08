-- Reconstruye fechaIngresoEtapa para registros lead_etapa_resumen(etapa=VENTA) donde el campo
-- quedó nulo (leads migrados antes de que el campo se rellenara automáticamente al avanzar etapa).
-- Se toma el created_at del ÚLTIMO evento TIPIFICACION en etapa PREVENTA con tipificacion='PREVENTA'
-- para ese lead, que es el momento exacto en que pasó de PREVENTA a VENTA.

UPDATE lead_etapa_resumen ler
SET    fecha_ingreso_etapa = (
    SELECT e.created_at
    FROM   evento e
    WHERE  e.id_lead      = ler.id_lead
      AND  e.accion       = 'TIPIFICACION'
      AND  e.etapa        = 'PREVENTA'
      AND  e.tipificacion = 'PREVENTA'
    ORDER BY e.created_at DESC
    LIMIT 1
)
WHERE  ler.etapa               = 'VENTA'
  AND  ler.fecha_ingreso_etapa IS NULL;
