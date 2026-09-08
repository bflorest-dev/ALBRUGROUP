UPDATE lead l
SET    comentario = (
    SELECT e.comentario
    FROM   evento e
    WHERE  e.id_lead      = l.id
      AND  e.accion       = 'TIPIFICACION'
      AND  e.comentario   IS NOT NULL
      AND  TRIM(e.comentario) <> ''
    ORDER BY e.created_at DESC
    LIMIT 1
)
WHERE  l.etapa      IN ('VENTA', 'POSTVENTA')
  AND  l.comentario IS NULL;
