-- V54: consulta, correccion y asociaciones permitidas para SUPERVISOR_RECLUTAMIENTO.
-- La migracion mantiene separadas las acciones operativas de contacto y tipificacion.

INSERT INTO permisos (nombre, descripcion, recurso, accion)
VALUES (
    'READ_POSTULACIONES_SUPERVISOR',
    'Puede consultar el estado general de postulaciones como supervisor de reclutamiento',
    'POSTULACION',
    'READ_SUPERVISOR'
)
ON CONFLICT (nombre) DO NOTHING;

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'SUPERVISOR_RECLUTAMIENTO') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol SUPERVISOR_RECLUTAMIENTO';
    END IF;

    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'RECLUTADOR') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol RECLUTADOR';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM (VALUES
            ('CREATE_POSTULACIONES', 'POSTULACION', 'CREATE'),
            ('READ_POSTULACIONES_SUPERVISOR', 'POSTULACION', 'READ_SUPERVISOR'),
            ('READ_POSTULACION', 'POSTULACION', 'READ'),
            ('UPDATE_POSTULACIONES', 'POSTULACION', 'UPDATE'),
            ('READ_HISTORIAL_POSTULANTES', 'POSTULANTE', 'READ_HISTORY'),
            ('READ_OFERTAS_LABORALES_ACTIVAS', 'OFERTA_LABORAL', 'READ'),
            ('ASSIGN_OFERTA_POSTULACION', 'POSTULACION', 'ASSIGN_OFFER'),
            ('READ_GRUPOS_CAPACITACION', 'GRUPO_CAPACITACION', 'READ'),
            ('ASSIGN_GRUPOS_CAPACITACION', 'GRUPO_CAPACITACION', 'ASSIGN')
        ) AS expected(nombre, recurso, accion)
        WHERE (SELECT COUNT(*)
               FROM permisos p
               WHERE p.nombre = expected.nombre
                 AND p.recurso = expected.recurso
                 AND p.accion = expected.accion) <> 1
    ) THEN
        RAISE EXCEPTION 'Uno o mas permisos de correccion o asociacion no tienen el recurso o accion canonicos';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM roles r
        JOIN rol_permiso rp ON rp.rol_id = r.id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre = 'SUPERVISOR_RECLUTAMIENTO'
          AND p.nombre IN (
              'TYPIFY_POSTULACIONES',
              'CREATE_CONTACTO_POSTULACION',
              'UPDATE_CLASIFICACION_POSTULACIONES',
              'CREATE_GRUPOS_CAPACITACION'
          )
    ) THEN
        RAISE EXCEPTION 'SUPERVISOR_RECLUTAMIENTO conserva permisos operativos no autorizados';
    END IF;
END $$;

WITH expected(nombre, recurso, accion) AS (
    VALUES
        ('CREATE_POSTULACIONES', 'POSTULACION', 'CREATE'),
        ('READ_POSTULACIONES_SUPERVISOR', 'POSTULACION', 'READ_SUPERVISOR'),
        ('READ_POSTULACION', 'POSTULACION', 'READ'),
        ('UPDATE_POSTULACIONES', 'POSTULACION', 'UPDATE'),
        ('READ_HISTORIAL_POSTULANTES', 'POSTULANTE', 'READ_HISTORY'),
        ('READ_OFERTAS_LABORALES_ACTIVAS', 'OFERTA_LABORAL', 'READ'),
        ('ASSIGN_OFERTA_POSTULACION', 'POSTULACION', 'ASSIGN_OFFER'),
        ('READ_GRUPOS_CAPACITACION', 'GRUPO_CAPACITACION', 'READ'),
        ('ASSIGN_GRUPOS_CAPACITACION', 'GRUPO_CAPACITACION', 'ASSIGN')
)
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p
  ON EXISTS (
      SELECT 1
      FROM expected e
      WHERE e.nombre = p.nombre
        AND e.recurso = p.recurso
        AND e.accion = p.accion
  )
WHERE r.nombre = 'SUPERVISOR_RECLUTAMIENTO'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p
  ON p.nombre = 'UPDATE_POSTULACIONES'
 AND p.recurso = 'POSTULACION'
 AND p.accion = 'UPDATE'
WHERE r.nombre = 'RECLUTADOR'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM roles r
        JOIN rol_permiso rp ON rp.rol_id = r.id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre = 'SUPERVISOR_RECLUTAMIENTO'
          AND (p.nombre, p.recurso, p.accion) IN (
              ('CREATE_POSTULACIONES', 'POSTULACION', 'CREATE'),
              ('READ_POSTULACIONES_SUPERVISOR', 'POSTULACION', 'READ_SUPERVISOR'),
              ('READ_POSTULACION', 'POSTULACION', 'READ'),
              ('UPDATE_POSTULACIONES', 'POSTULACION', 'UPDATE'),
              ('READ_HISTORIAL_POSTULANTES', 'POSTULANTE', 'READ_HISTORY'),
              ('READ_OFERTAS_LABORALES_ACTIVAS', 'OFERTA_LABORAL', 'READ'),
              ('ASSIGN_OFERTA_POSTULACION', 'POSTULACION', 'ASSIGN_OFFER'),
              ('READ_GRUPOS_CAPACITACION', 'GRUPO_CAPACITACION', 'READ'),
              ('ASSIGN_GRUPOS_CAPACITACION', 'GRUPO_CAPACITACION', 'ASSIGN')
          )
    ) <> 9 THEN
        RAISE EXCEPTION 'SUPERVISOR_RECLUTAMIENTO no tiene las nueve relaciones funcionales esperadas';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM roles r
        JOIN rol_permiso rp ON rp.rol_id = r.id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre = 'RECLUTADOR'
          AND p.nombre = 'UPDATE_POSTULACIONES'
          AND p.recurso = 'POSTULACION'
          AND p.accion = 'UPDATE'
    ) THEN
        RAISE EXCEPTION 'RECLUTADOR no tiene UPDATE_POSTULACIONES';
    END IF;
END $$;
