-- V53: Permisos operativos comunes para SUPERVISOR_RECLUTAMIENTO.
-- El shell privado consulta asistencia y permite registrar marcaciones para los roles operativos.
-- La migracion resuelve roles y permisos por nombres canonicos, no por IDs.

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'SUPERVISOR_RECLUTAMIENTO') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol SUPERVISOR_RECLUTAMIENTO';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM (VALUES
            ('READ_ASISTENCIAS_SELF', 'ASISTENCIA', 'READ_SELF'),
            ('UPDATE_ASISTENCIAS', 'ASISTENCIA', 'UPDATE')
        ) AS expected(nombre, recurso, accion)
        WHERE (SELECT COUNT(*)
               FROM permisos p
               WHERE p.nombre = expected.nombre
                 AND p.recurso = expected.recurso
                 AND p.accion = expected.accion) <> 1
    ) THEN
        RAISE EXCEPTION 'Uno o mas permisos operativos de asistencia no tienen el recurso o accion canonicos';
    END IF;
END $$;

WITH expected(nombre, recurso, accion) AS (
    VALUES
        ('READ_ASISTENCIAS_SELF', 'ASISTENCIA', 'READ_SELF'),
        ('UPDATE_ASISTENCIAS', 'ASISTENCIA', 'UPDATE')
)
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p
  ON p.nombre IN (SELECT nombre FROM expected)
 AND EXISTS (
     SELECT 1
     FROM expected e
     WHERE e.nombre = p.nombre
       AND e.recurso = p.recurso
       AND e.accion = p.accion
 )
WHERE r.nombre = 'SUPERVISOR_RECLUTAMIENTO'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

DO $$
BEGIN
    IF (SELECT COUNT(*)
        FROM roles r
        JOIN rol_permiso rp ON rp.rol_id = r.id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre = 'SUPERVISOR_RECLUTAMIENTO'
          AND (p.nombre, p.recurso, p.accion) IN (
              ('READ_ASISTENCIAS_SELF', 'ASISTENCIA', 'READ_SELF'),
              ('UPDATE_ASISTENCIAS', 'ASISTENCIA', 'UPDATE')
          )) <> 2 THEN
        RAISE EXCEPTION 'SUPERVISOR_RECLUTAMIENTO no tiene los dos permisos operativos de asistencia';
    END IF;
END $$;
