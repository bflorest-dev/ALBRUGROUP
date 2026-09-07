INSERT INTO roles (nombre, descripcion)
VALUES ('MONITOR', 'Backoffice - Monitor siempre operativo por proveedor')
ON CONFLICT (nombre) DO UPDATE
SET descripcion = EXCLUDED.descripcion;

DELETE FROM rol_permiso
WHERE rol_id = (
    SELECT id
    FROM roles
    WHERE nombre = 'MONITOR'
);

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT monitor.id, rp.permiso_id
FROM roles monitor
JOIN roles backoffice ON backoffice.nombre = 'ASESOR_BACKOFFICE'
JOIN rol_permiso rp ON rp.rol_id = backoffice.id
WHERE monitor.nombre = 'MONITOR'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;
