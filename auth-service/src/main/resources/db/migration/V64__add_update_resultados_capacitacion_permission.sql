-- V64: el CAPACITADOR solo puede registrar resultados de participantes en grupos EN_CURSO.

DO $$
DECLARE
    v_permiso_id BIGINT;
    v_capacitador_id BIGINT;
BEGIN
    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'CAPACITADOR') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol CAPACITADOR';
    END IF;

    IF (SELECT COUNT(*) FROM permisos WHERE nombre = 'UPDATE_RESULTADOS_CAPACITACION') > 1 THEN
        RAISE EXCEPTION 'Existe mas de un permiso UPDATE_RESULTADOS_CAPACITACION';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'UPDATE_RESULTADOS_CAPACITACION') THEN
        INSERT INTO permisos (nombre, descripcion, recurso, accion)
        VALUES (
            'UPDATE_RESULTADOS_CAPACITACION',
            'Puede registrar resultados de participantes durante la capacitacion',
            'GRUPO_CAPACITACION',
            'UPDATE_RESULT'
        );
    END IF;

    SELECT id INTO v_permiso_id
    FROM permisos
    WHERE nombre = 'UPDATE_RESULTADOS_CAPACITACION';

    IF (SELECT COUNT(*) FROM permisos
        WHERE id = v_permiso_id
          AND recurso = 'GRUPO_CAPACITACION'
          AND accion = 'UPDATE_RESULT') <> 1 THEN
        RAISE EXCEPTION 'UPDATE_RESULTADOS_CAPACITACION no tiene recurso o accion canonicos';
    END IF;

    SELECT id INTO v_capacitador_id FROM roles WHERE nombre = 'CAPACITADOR';

    IF EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.permiso_id = v_permiso_id
          AND rp.rol_id <> v_capacitador_id
    ) THEN
        RAISE EXCEPTION 'UPDATE_RESULTADOS_CAPACITACION ya esta asociado a otro rol';
    END IF;

    IF (SELECT COUNT(*) FROM rol_permiso
        WHERE rol_id = v_capacitador_id AND permiso_id = v_permiso_id) > 1 THEN
        RAISE EXCEPTION 'Existe mas de una relacion entre CAPACITADOR y UPDATE_RESULTADOS_CAPACITACION';
    END IF;

    INSERT INTO rol_permiso (rol_id, permiso_id)
    SELECT v_capacitador_id, v_permiso_id
    WHERE NOT EXISTS (
        SELECT 1 FROM rol_permiso
        WHERE rol_id = v_capacitador_id AND permiso_id = v_permiso_id
    );

    IF (SELECT COUNT(*) FROM rol_permiso
        WHERE rol_id = v_capacitador_id AND permiso_id = v_permiso_id) <> 1 THEN
        RAISE EXCEPTION 'No se pudo asociar UPDATE_RESULTADOS_CAPACITACION a CAPACITADOR';
    END IF;
END $$;
