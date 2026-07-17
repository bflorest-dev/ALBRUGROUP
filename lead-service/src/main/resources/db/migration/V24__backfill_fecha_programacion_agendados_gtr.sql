-- Los AGENDADOS de preventa (bandeja del GTR) solo guardaban la hora de la cita; la fecha se
-- inferia en el frontend. Ahora la fecha de la cita se persiste en fecha_programacion con la regla
-- de negocio: hora anterior a la hora en que se tipifico => la cita es para el dia siguiente; hora
-- igual o posterior => es para el mismo dia. Todo en America/Lima.
--
-- Este backfill rellena los eventos historicos que ya tienen hora pero aun no tienen fecha. Es
-- determinista y cubre cualquier fila con esa forma (hora sin fecha), incluidas las que la copia
-- local no tuviera al momento de sacarla: se recalcula sobre todo el conjunto que cumpla la
-- condicion, no sobre un rango puntual.
--
-- No toca eventos de VENTA (que ya guardan fecha_programacion + hora), porque esos no tienen la
-- fecha en NULL.

UPDATE evento
SET fecha_programacion =
        (created_at AT TIME ZONE 'America/Lima')::date
        + (CASE
               WHEN hora_programada < (created_at AT TIME ZONE 'America/Lima')::time THEN 1
               ELSE 0
           END)
WHERE hora_programada IS NOT NULL
  AND fecha_programacion IS NULL;
