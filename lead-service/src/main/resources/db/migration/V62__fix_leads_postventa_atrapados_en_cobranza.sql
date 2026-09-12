-- =====================================================================
-- Mover a COBRANZA los leads WIN que tienen 3 periodos cerrados pero
-- quedaron atrapados en POSTVENTA por la supresion de
-- normalizarEtapaDestinoPostventa (eliminada en este mismo release).
-- Solo afecta 11 leads, todos WIN.
-- =====================================================================
UPDATE lead
SET etapa = 'COBRANZA'
WHERE etapa = 'POSTVENTA'
  AND UPPER(TRIM(COALESCE(nombre_proveedor_snapshot, ''))) = 'WIN'
  AND id IN (
      SELECT l.id
      FROM lead l
      JOIN periodo_facturacion_postventa p ON p.id_lead = l.id
      WHERE l.etapa = 'POSTVENTA'
      GROUP BY l.id
      HAVING COUNT(p.id) >= 3
         AND COUNT(p.id) = SUM(CASE WHEN p.estado LIKE 'CERRADO%' THEN 1 ELSE 0 END)
  );
