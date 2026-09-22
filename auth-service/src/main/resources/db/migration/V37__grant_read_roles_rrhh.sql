INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.nombre = 'READ_ROLES'
WHERE r.nombre = 'RRHH'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;
