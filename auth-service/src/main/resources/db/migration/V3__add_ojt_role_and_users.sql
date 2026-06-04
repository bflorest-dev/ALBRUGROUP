-- Rol OJT para postulantes que realizan practica operativa como asesores de venta.
INSERT INTO roles (nombre, descripcion)
VALUES ('OJT', 'On the job training - Gestion de leads asignados')
ON CONFLICT (nombre) DO UPDATE
SET descripcion = EXCLUDED.descripcion;

-- OJT hereda los permisos operativos actuales de ASESOR_VENTAS.
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT ojt.id, rp.permiso_id
FROM roles ojt
JOIN roles asesor ON asesor.nombre = 'ASESOR_VENTAS'
JOIN rol_permiso rp ON rp.rol_id = asesor.id
WHERE ojt.nombre = 'OJT'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;
