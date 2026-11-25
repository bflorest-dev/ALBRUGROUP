DO $$
DECLARE
    v_permiso_id BIGINT;
    v_role_names TEXT[] := ARRAY['ADMINISTRADOR','MONITOR','ASESOR_BACKOFFICE','SUPERVISOR_BACKOFFICE','ASESOR_POSTVENTA','SUPERVISOR_POSTVENTA','DESARROLLADOR'];
    v_role_name TEXT;
    v_role_id BIGINT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'UPDATE_ESTADO_EXPEDIENTE') THEN
        INSERT INTO permisos (nombre, descripcion, recurso, accion)
        VALUES (
            'UPDATE_ESTADO_EXPEDIENTE',
            'Puede actualizar el estado de expediente de un lead CLARO en postventa',
            'LEAD',
            'UPDATE_ESTADO_EXPEDIENTE'
        );
    END IF;

    SELECT id INTO v_permiso_id FROM permisos WHERE nombre = 'UPDATE_ESTADO_EXPEDIENTE';

    FOREACH v_role_name IN ARRAY v_role_names LOOP
        SELECT id INTO v_role_id FROM roles WHERE nombre = v_role_name;
        IF v_role_id IS NULL THEN
            RAISE EXCEPTION 'Rol % no encontrado', v_role_name;
        END IF;

        INSERT INTO rol_permiso (rol_id, permiso_id)
        SELECT v_role_id, v_permiso_id
        WHERE NOT EXISTS (
            SELECT 1 FROM rol_permiso WHERE rol_id = v_role_id AND permiso_id = v_permiso_id
        );
    END LOOP;
END $$;
