INSERT INTO permisos (nombre, descripcion, recurso, accion)
VALUES
    ('READ_EQUIPO_CAMPANAS', 'Puede consultar campañas operativas por equipo', 'EQUIPO_CAMPANA', 'READ'),
    ('ASSIGN_EQUIPO_CAMPANAS', 'Puede asignar campañas operativas a equipos', 'EQUIPO_CAMPANA', 'ASSIGN'),
    ('READ_METRICAS_GTR_PROVEEDOR', 'Puede consultar métricas GTR PREVENTA por proveedor', 'LEAD_GTR_METRICAS', 'READ_BY_PROVIDER')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.nombre IN (
    'READ_EQUIPO_CAMPANAS',
    'ASSIGN_EQUIPO_CAMPANAS',
    'READ_METRICAS_GTR_PROVEEDOR'
)
WHERE r.nombre IN ('ADMINISTRADOR', 'SUPERVISOR_GTR')
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM roles r
        JOIN rol_permiso rp ON rp.rol_id = r.id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre IN ('ADMINISTRADOR', 'SUPERVISOR_GTR')
          AND p.nombre IN (
              'READ_EQUIPO_CAMPANAS',
              'ASSIGN_EQUIPO_CAMPANAS',
              'READ_METRICAS_GTR_PROVEEDOR'
          )
    ) <> 6 THEN
        RAISE EXCEPTION 'No se pudieron otorgar los permisos de campañas y métricas a ADMINISTRADOR y SUPERVISOR_GTR';
    END IF;
END $$;
