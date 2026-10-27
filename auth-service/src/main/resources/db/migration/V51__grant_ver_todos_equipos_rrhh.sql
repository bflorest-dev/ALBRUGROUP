-- ============================================================
-- V51: Visibilidad global del catalogo de proveedores para RRHH
--
-- El catalogo de proveedores se filtra por los equipos del JWT salvo
-- que el rol tenga VER_TODOS_LOS_EQUIPOS. RRHH necesita consultar los
-- nombres de todos los proveedores asociados a los empleados de Personal.
-- ============================================================

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'RRHH') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol RRHH para asignar VER_TODOS_LOS_EQUIPOS';
    END IF;

    IF (SELECT COUNT(*)
        FROM permisos
        WHERE nombre = 'VER_TODOS_LOS_EQUIPOS'
          AND recurso = 'EQUIPO'
          AND accion = 'READ_ALL') <> 1 THEN
        RAISE EXCEPTION 'No existe exactamente un permiso VER_TODOS_LOS_EQUIPOS con recurso EQUIPO y accion READ_ALL';
    END IF;
END $$;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'RRHH'
  AND p.nombre = 'VER_TODOS_LOS_EQUIPOS'
  AND p.recurso = 'EQUIPO'
  AND p.accion = 'READ_ALL'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

DO $$
BEGIN
    IF (SELECT COUNT(*)
        FROM rol_permiso rp
        JOIN roles r ON r.id = rp.rol_id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre = 'RRHH'
          AND p.nombre = 'VER_TODOS_LOS_EQUIPOS'
          AND p.recurso = 'EQUIPO'
          AND p.accion = 'READ_ALL') <> 1 THEN
        RAISE EXCEPTION 'VER_TODOS_LOS_EQUIPOS no quedo asignado exactamente una vez al rol RRHH';
    END IF;
END $$;
