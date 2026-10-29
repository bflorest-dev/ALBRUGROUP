-- V56: permite que RECLUTADOR consulte postulaciones aprobadas sin grupo.
DO $$
DECLARE
    v_rol_id BIGINT;
    v_permiso_id BIGINT;
BEGIN
    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'RECLUTADOR') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol RECLUTADOR';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM permisos
        WHERE nombre = 'READ_POSTULACIONES_CAPACITACION'
          AND recurso = 'POSTULACION'
          AND accion = 'READ'
    ) <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un permiso READ_POSTULACIONES_CAPACITACION canónico';
    END IF;

    SELECT id INTO v_rol_id
    FROM roles
    WHERE nombre = 'RECLUTADOR';

    SELECT id INTO v_permiso_id
    FROM permisos
    WHERE nombre = 'READ_POSTULACIONES_CAPACITACION'
      AND recurso = 'POSTULACION'
      AND accion = 'READ';

    INSERT INTO rol_permiso (rol_id, permiso_id)
    VALUES (v_rol_id, v_permiso_id)
    ON CONFLICT (rol_id, permiso_id) DO NOTHING;

    IF NOT EXISTS (
        SELECT 1
        FROM rol_permiso
        WHERE rol_id = v_rol_id
          AND permiso_id = v_permiso_id
    ) THEN
        RAISE EXCEPTION 'No se pudo asociar READ_POSTULACIONES_CAPACITACION a RECLUTADOR';
    END IF;
END $$;
