UPDATE encuesta_postventa
SET id_asesor_encuesta = NULL,
    nombre_asesor_encuesta = NULL
WHERE estado = 'PENDIENTE'
  AND calificacion IS NULL;
