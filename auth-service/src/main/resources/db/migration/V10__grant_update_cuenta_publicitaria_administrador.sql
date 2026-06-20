-- ADMINISTRADOR debe conservar acceso completo a los catalogos comerciales.
-- La migracion V9 otorgo este permiso a COMMUNITY, pero no a ADMINISTRADOR.
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'ADMINISTRADOR'
  AND p.nombre = 'UPDATE_CUENTA_PUBLICITARIA'
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
