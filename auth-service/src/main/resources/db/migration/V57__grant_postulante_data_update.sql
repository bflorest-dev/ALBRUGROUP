-- V57: permite completar datos personales sin ampliar el flujo operativo.

INSERT INTO permisos (nombre, descripcion, recurso, accion)
VALUES (
    'UPDATE_DATOS_POSTULANTE',
    'Puede completar y corregir los datos personales de un postulante',
    'POSTULANTE',
    'UPDATE'
)
ON CONFLICT (nombre) DO NOTHING;

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM permisos
        WHERE nombre = 'UPDATE_DATOS_POSTULANTE'
          AND recurso = 'POSTULANTE'
          AND accion = 'UPDATE') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un permiso UPDATE_DATOS_POSTULANTE canonico';
    END IF;

    IF (SELECT COUNT(*) FROM roles WHERE nombre IN ('RECLUTADOR', 'SUPERVISOR_RECLUTAMIENTO')) <> 2 THEN
        RAISE EXCEPTION 'Se esperaban los roles RECLUTADOR y SUPERVISOR_RECLUTAMIENTO';
    END IF;
END $$;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p
  ON p.nombre = 'UPDATE_DATOS_POSTULANTE'
 AND p.recurso = 'POSTULANTE'
 AND p.accion = 'UPDATE'
WHERE r.nombre IN ('RECLUTADOR', 'SUPERVISOR_RECLUTAMIENTO')
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM roles r
        JOIN rol_permiso rp ON rp.rol_id = r.id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre IN ('RECLUTADOR', 'SUPERVISOR_RECLUTAMIENTO')
          AND p.nombre = 'UPDATE_DATOS_POSTULANTE'
          AND p.recurso = 'POSTULANTE'
          AND p.accion = 'UPDATE'
    ) <> 2 THEN
        RAISE EXCEPTION 'No se pudo asociar UPDATE_DATOS_POSTULANTE a ambos roles';
    END IF;
END $$;
