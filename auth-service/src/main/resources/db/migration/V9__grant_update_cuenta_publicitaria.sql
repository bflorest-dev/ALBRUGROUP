-- ============================================================
-- V9: Permiso para alternar cuentas publicitarias
--
-- El endpoint de cuentas publicitarias paso de desactivacion a
-- alternancia de estado. COMMUNITY necesita UPDATE_CUENTA_PUBLICITARIA
-- para activar y desactivar desde la vista de mantenimiento.
--
-- Idempotente: INSERT/DELETE seguros para entornos ya inicializados.
-- ============================================================

INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'UPDATE_CUENTA_PUBLICITARIA',
       'Puede actualizar cuentas publicitarias',
       'CUENTA_PUBLICITARIA',
       'UPDATE'
WHERE NOT EXISTS (
    SELECT 1
    FROM permisos
    WHERE nombre = 'UPDATE_CUENTA_PUBLICITARIA'
);

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'COMMUNITY'
  AND p.nombre = 'UPDATE_CUENTA_PUBLICITARIA'
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );

DELETE FROM rol_permiso rp
USING roles r, permisos p
WHERE rp.rol_id = r.id
  AND rp.permiso_id = p.id
  AND r.nombre = 'COMMUNITY'
  AND p.nombre = 'DELETE_CUENTA_PUBLICITARIA';
