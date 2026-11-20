INSERT INTO permisos (nombre, descripcion, recurso, accion)
VALUES ('EXPORT_REPORTE_ASISTENCIA', 'Puede exportar reportes de asistencia de múltiples empleados', 'ASISTENCIA', 'EXPORT')
ON CONFLICT (nombre) DO NOTHING;

DO $$
DECLARE
    v_permiso_id BIGINT;
    v_admin_id   BIGINT;
    v_rrhh_id    BIGINT;
BEGIN
    SELECT id INTO v_permiso_id FROM permisos WHERE nombre = 'EXPORT_REPORTE_ASISTENCIA';
    IF v_permiso_id IS NULL THEN
        RAISE EXCEPTION 'No se creó el permiso EXPORT_REPORTE_ASISTENCIA';
    END IF;

    SELECT id INTO v_admin_id FROM roles WHERE nombre = 'ADMINISTRADOR';
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'No existe el rol ADMINISTRADOR';
    END IF;

    SELECT id INTO v_rrhh_id FROM roles WHERE nombre = 'RRHH';
    IF v_rrhh_id IS NULL THEN
        RAISE EXCEPTION 'No existe el rol RRHH';
    END IF;

    INSERT INTO rol_permiso (rol_id, permiso_id)
    VALUES (v_admin_id, v_permiso_id), (v_rrhh_id, v_permiso_id)
    ON CONFLICT (rol_id, permiso_id) DO NOTHING;

    IF (SELECT COUNT(*) FROM rol_permiso WHERE permiso_id = v_permiso_id AND rol_id IN (v_admin_id, v_rrhh_id)) <> 2 THEN
        RAISE EXCEPTION 'No se pudieron asociar EXPORT_REPORTE_ASISTENCIA a ADMINISTRADOR y RRHH';
    END IF;
END $$;
