-- Uso:
-- docker exec -it albrugroup-postgres-core-1 psql -U postgres -d auth_db -c "SELECT 1"
-- docker exec -it albrugroup-postgres-core-1 psql -U postgres -d rrhh_db -f rrhh-service/scripts/buscar_id_empleado_fabrizzio.sql
--
-- Objetivo:
-- 1) ubicar el id del empleado en RRHH
-- 2) validar que el nombre corresponde a Fabrizzio Farith Veliz Kruchinsky

SELECT
    e.id,
    e.nombres,
    e.apellidos,
    e.numero_documento,
    e.estado_operativo,
    e.correo_corporativo
FROM empleados e
WHERE LOWER(TRIM(COALESCE(e.nombres, '') || ' ' || COALESCE(e.apellidos, ''))) LIKE
      LOWER('%fabrizzio%farith%veliz%kruchinsky%')
ORDER BY e.id;
