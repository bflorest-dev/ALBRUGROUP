INSERT INTO permisos (nombre, descripcion, recurso, accion)
VALUES ('MANAGE_CONTRATISTA_ASSIGNMENTS', 'Puede asignar y desasignar empresas contratistas a empleados para el scope de RRHH', 'EMPRESA_CONTRATISTA', 'UPDATE')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.nombre = 'MANAGE_CONTRATISTA_ASSIGNMENTS'
WHERE r.nombre = 'ADMINISTRADOR'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;
