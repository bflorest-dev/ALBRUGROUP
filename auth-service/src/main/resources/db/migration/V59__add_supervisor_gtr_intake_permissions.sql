INSERT INTO permisos (nombre, descripcion, recurso, accion)
VALUES
    ('CREATE_LEADS_SUPERVISOR_GTR', 'Puede registrar leads sin equipo desde la operación GTR', 'LEAD_SUPERVISOR_GTR', 'CREATE'),
    ('ASSIGN_EQUIPO_LEAD', 'Puede asignar un equipo a un lead sin equipo', 'LEAD_SUPERVISOR_GTR', 'UPDATE')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.nombre IN ('CREATE_LEADS_SUPERVISOR_GTR', 'ASSIGN_EQUIPO_LEAD')
WHERE r.nombre = 'SUPERVISOR_GTR'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM roles r
        JOIN rol_permiso rp ON rp.rol_id = r.id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre = 'SUPERVISOR_GTR'
          AND p.nombre IN ('CREATE_LEADS_SUPERVISOR_GTR', 'ASSIGN_EQUIPO_LEAD')
    ) <> 2 THEN
        RAISE EXCEPTION 'No se pudieron otorgar los permisos de registro y asignación a SUPERVISOR_GTR';
    END IF;
END $$;
