-- ============================================================
-- V2: Permiso EXTEND_HORARIO
-- Permite a roles que NO administran horarios (GTR/Supervisores de
-- ventas) gestionar excepciones y ampliaciones puntuales del horario
-- (POST/PUT/DELETE /horarios/{id}/excepciones) sin tocar el horario
-- base. RRHH ya tiene UPDATE_HORARIOS y aqui se le suma EXTEND_HORARIO
-- para coherencia con el seed.
--
-- Idempotente: usa INSERT ... WHERE NOT EXISTS, asi puede re-ejecutarse
-- manualmente si fuera necesario.
-- ============================================================

INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'EXTEND_HORARIO',
       'Puede gestionar excepciones y ampliaciones puntuales del horario',
       'HORARIO',
       'EXTEND'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'EXTEND_HORARIO');

-- Asociar el permiso a los roles definidos.
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'EXTEND_HORARIO'
  AND r.nombre IN ('RRHH', 'ASESOR_GTR', 'SUPERVISOR_VENTAS')
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
