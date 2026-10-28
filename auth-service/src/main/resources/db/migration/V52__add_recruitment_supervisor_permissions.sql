-- V52: Reactivacion del flujo de reclutamiento
-- Crea los permisos de registro diferido, contacto, clasificacion e historial.
-- La migracion resuelve roles y permisos por nombres canonicos, no por IDs.

INSERT INTO permisos (nombre, descripcion, recurso, accion)
VALUES
    ('UPDATE_CLASIFICACION_POSTULACIONES', 'Puede completar la clasificacion de postulaciones', 'POSTULACION', 'UPDATE_CLASSIFICATION'),
    ('CREATE_CONTACTO_POSTULACION', 'Puede registrar intentos de contacto de postulaciones', 'POSTULACION', 'CONTACT'),
    ('ASSIGN_OFERTA_POSTULACION', 'Puede asociar una oferta laboral a una postulacion', 'POSTULACION', 'ASSIGN_OFFER'),
    ('READ_HISTORIAL_POSTULANTES', 'Puede consultar el historial de postulaciones de un postulante', 'POSTULANTE', 'READ_HISTORY')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (nombre, descripcion)
VALUES ('SUPERVISOR_RECLUTAMIENTO', 'Reclutamiento - Registro e historial de postulantes')
ON CONFLICT (nombre) DO NOTHING;

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'SUPERVISOR_RECLUTAMIENTO') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol SUPERVISOR_RECLUTAMIENTO';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM (VALUES
            ('UPDATE_CLASIFICACION_POSTULACIONES', 'POSTULACION', 'UPDATE_CLASSIFICATION'),
            ('CREATE_CONTACTO_POSTULACION', 'POSTULACION', 'CONTACT'),
            ('ASSIGN_OFERTA_POSTULACION', 'POSTULACION', 'ASSIGN_OFFER'),
            ('READ_HISTORIAL_POSTULANTES', 'POSTULANTE', 'READ_HISTORY')
        ) AS expected(nombre, recurso, accion)
        WHERE (SELECT COUNT(*) FROM permisos p
               WHERE p.nombre = expected.nombre
                 AND p.recurso = expected.recurso
                 AND p.accion = expected.accion) <> 1
    ) THEN
        RAISE EXCEPTION 'Uno o mas permisos de recruitment no tienen el recurso o accion canonicos';
    END IF;

    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'ADMINISTRADOR') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol ADMINISTRADOR';
    END IF;

    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'RECLUTADOR') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol RECLUTADOR';
    END IF;

    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'CAPACITADOR') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol CAPACITADOR';
    END IF;

    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'RRHH') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol RRHH';
    END IF;
END $$;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'SUPERVISOR_RECLUTAMIENTO'
  AND p.nombre IN ('CREATE_POSTULACIONES', 'READ_POSTULACION', 'READ_HISTORIAL_POSTULANTES')
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre IN ('ADMINISTRADOR', 'RECLUTADOR')
  AND p.nombre IN (
      'UPDATE_CLASIFICACION_POSTULACIONES',
      'CREATE_CONTACTO_POSTULACION',
      'ASSIGN_OFERTA_POSTULACION',
      'READ_HISTORIAL_POSTULANTES'
  )
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'RECLUTADOR'
  AND p.nombre = 'READ_OFERTAS_LABORALES_ACTIVAS'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'CAPACITADOR'
  AND p.nombre = 'READ_HISTORIAL_POSTULANTES'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

DELETE FROM rol_permiso
WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'RRHH')
  AND permiso_id IN (
      SELECT id
      FROM permisos
      WHERE nombre IN (
          'CREATE_OFERTAS_LABORALES',
          'UPDATE_OFERTAS_LABORALES',
          'UPDATE_ESTADO_OFERTAS_LABORALES'
      )
  );

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM roles r
        JOIN rol_permiso rp ON rp.rol_id = r.id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre = 'RRHH'
          AND p.nombre IN (
              'CREATE_OFERTAS_LABORALES',
              'UPDATE_OFERTAS_LABORALES',
              'UPDATE_ESTADO_OFERTAS_LABORALES'
          )
    ) THEN
        RAISE EXCEPTION 'RRHH conserva permisos de mutacion de ofertas laborales';
    END IF;

    IF (SELECT COUNT(*)
        FROM roles r
        JOIN rol_permiso rp ON rp.rol_id = r.id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre = 'SUPERVISOR_RECLUTAMIENTO'
          AND p.nombre IN ('CREATE_POSTULACIONES', 'READ_POSTULACION', 'READ_HISTORIAL_POSTULANTES')) <> 3 THEN
        RAISE EXCEPTION 'SUPERVISOR_RECLUTAMIENTO no tiene exactamente sus tres permisos base';
    END IF;
END $$;
