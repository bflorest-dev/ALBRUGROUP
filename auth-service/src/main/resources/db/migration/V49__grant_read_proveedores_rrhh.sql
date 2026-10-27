-- RRHH necesita leer el catálogo de proveedores para construir el ámbito
-- por proveedor del directorio PERSONAL y su drawer de expediente.

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'RRHH') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol RRHH para asignar READ_PROVEEDORES';
    END IF;

    IF (SELECT COUNT(*)
        FROM permisos
        WHERE nombre = 'READ_PROVEEDORES'
          AND recurso = 'PROVEEDOR'
          AND accion = 'READ') <> 1 THEN
        RAISE EXCEPTION 'No existe exactamente un permiso READ_PROVEEDORES con recurso PROVEEDOR y accion READ';
    END IF;
END $$;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'RRHH'
  AND p.nombre = 'READ_PROVEEDORES'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM rol_permiso rp
        JOIN roles r ON r.id = rp.rol_id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre = 'RRHH'
          AND p.nombre = 'READ_PROVEEDORES'
    ) <> 1 THEN
        RAISE EXCEPTION 'READ_PROVEEDORES no quedo asignado exactamente una vez al rol RRHH';
    END IF;
END $$;
