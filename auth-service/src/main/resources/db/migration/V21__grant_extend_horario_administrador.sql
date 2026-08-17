-- ADMINISTRADOR debe poder registrar ajustes de jornada (corrimientos,
-- compensaciones, ampliaciones). El permiso EXTEND_HORARIO ya existe (V2)
-- pero nunca se asocio al rol ADMINISTRADOR.
-- Idempotente: INSERT ... WHERE NOT EXISTS.

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'EXTEND_HORARIO'
  AND r.nombre = 'ADMINISTRADOR'
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
