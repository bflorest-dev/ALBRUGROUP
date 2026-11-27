-- V66: habilita la baja transversal de postulaciones para los tres roles operativos.

DO $$
DECLARE
    v_permiso_id BIGINT;
    v_reclutador_id BIGINT;
    v_supervisor_id BIGINT;
    v_capacitador_id BIGINT;
BEGIN
    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'RECLUTADOR') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol RECLUTADOR';
    END IF;
    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'SUPERVISOR_RECLUTAMIENTO') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol SUPERVISOR_RECLUTAMIENTO';
    END IF;
    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'CAPACITADOR') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol CAPACITADOR';
    END IF;
    IF (SELECT COUNT(*) FROM permisos WHERE nombre = 'CLOSE_POSTULACIONES') > 1 THEN
        RAISE EXCEPTION 'Existe mas de un permiso CLOSE_POSTULACIONES';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'CLOSE_POSTULACIONES') THEN
        INSERT INTO permisos (nombre, descripcion, recurso, accion)
        VALUES (
            'CLOSE_POSTULACIONES',
            'Puede dar de baja una postulacion sin importar su etapa, si no fue contratada',
            'POSTULACION',
            'CLOSE'
        );
    END IF;

    SELECT id INTO v_permiso_id FROM permisos WHERE nombre = 'CLOSE_POSTULACIONES';
    IF (SELECT COUNT(*) FROM permisos
        WHERE id = v_permiso_id AND recurso = 'POSTULACION' AND accion = 'CLOSE') <> 1 THEN
        RAISE EXCEPTION 'CLOSE_POSTULACIONES no tiene recurso o accion canonicos';
    END IF;

    SELECT id INTO v_reclutador_id FROM roles WHERE nombre = 'RECLUTADOR';
    SELECT id INTO v_supervisor_id FROM roles WHERE nombre = 'SUPERVISOR_RECLUTAMIENTO';
    SELECT id INTO v_capacitador_id FROM roles WHERE nombre = 'CAPACITADOR';

    IF EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.permiso_id = v_permiso_id
          AND rp.rol_id NOT IN (v_reclutador_id, v_supervisor_id, v_capacitador_id)
    ) THEN
        RAISE EXCEPTION 'CLOSE_POSTULACIONES ya esta asociado a un rol no autorizado';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM (VALUES (v_reclutador_id), (v_supervisor_id), (v_capacitador_id)) AS roles_autorizados(id)
        WHERE (SELECT COUNT(*) FROM rol_permiso rp
               WHERE rp.rol_id = roles_autorizados.id AND rp.permiso_id = v_permiso_id) > 1
    ) THEN
        RAISE EXCEPTION 'Existe una relacion duplicada para CLOSE_POSTULACIONES';
    END IF;

    INSERT INTO rol_permiso (rol_id, permiso_id)
    VALUES
        (v_reclutador_id, v_permiso_id),
        (v_supervisor_id, v_permiso_id),
        (v_capacitador_id, v_permiso_id)
    ON CONFLICT (rol_id, permiso_id) DO NOTHING;

    IF (SELECT COUNT(*) FROM rol_permiso WHERE permiso_id = v_permiso_id) <> 3 THEN
        RAISE EXCEPTION 'CLOSE_POSTULACIONES no quedo asociado exactamente a los tres roles autorizados';
    END IF;
END $$;
