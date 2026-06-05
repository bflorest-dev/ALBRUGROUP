-- ============================================================
-- V5: EXTEND_HORARIO para SUPERVISOR_GTR
-- SUPERVISOR_GTR entra a la misma vista GTR que ASESOR_GTR, por lo que
-- tambien debe poder registrar ampliaciones de horario. El permiso ya
-- existe (V2); aqui solo se asocia al rol SUPERVISOR_GTR.
--
-- Idempotente: INSERT ... WHERE NOT EXISTS.
-- ============================================================

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'EXTEND_HORARIO'
  AND r.nombre = 'SUPERVISOR_GTR'
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
