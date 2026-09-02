INSERT INTO permisos (nombre) VALUES ('CORREGIR_MERITO_ADMIN');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre = 'ADMINISTRADOR'
  AND p.nombre = 'CORREGIR_MERITO_ADMIN';
