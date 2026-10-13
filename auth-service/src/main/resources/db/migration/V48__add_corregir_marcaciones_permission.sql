-- Permiso exclusivo para corregir marcaciones reales desde Administracion.

INSERT INTO permisos (nombre, descripcion, recurso, accion)
VALUES (
    'CORREGIR_MARCACIONES',
    'Puede corregir marcaciones reales desde Administracion',
    'ASISTENCIA',
    'CORRECT'
)
ON CONFLICT (nombre) DO UPDATE
SET descripcion = EXCLUDED.descripcion,
    recurso = EXCLUDED.recurso,
    accion = EXCLUDED.accion;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'ADMINISTRADOR') THEN
        RAISE EXCEPTION 'No existe el rol ADMINISTRADOR para asignar CORREGIR_MARCACIONES';
    END IF;
END $$;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'ADMINISTRADOR'
  AND p.nombre = 'CORREGIR_MARCACIONES'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM rol_permiso rp
        JOIN roles r ON r.id = rp.rol_id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre = 'ADMINISTRADOR'
          AND p.nombre = 'CORREGIR_MARCACIONES'
    ) <> 1 THEN
        RAISE EXCEPTION 'La asociacion de CORREGIR_MARCACIONES a ADMINISTRADOR no es exactamente una';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM rol_permiso rp
        JOIN roles r ON r.id = rp.rol_id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE p.nombre = 'CORREGIR_MARCACIONES'
          AND r.nombre <> 'ADMINISTRADOR'
    ) THEN
        RAISE EXCEPTION 'CORREGIR_MARCACIONES fue asignado a un rol no autorizado';
    END IF;
END $$;
