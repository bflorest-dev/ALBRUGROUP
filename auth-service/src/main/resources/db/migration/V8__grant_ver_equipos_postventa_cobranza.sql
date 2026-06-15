-- ============================================================
-- V8: Visibilidad global de equipos para POSTVENTA y COBRANZA (Fase 1)
--
-- El filtro por equipo en lead-service aplica a TODO acceso a leads. POSTVENTA y COBRANZA
-- aún NO entran al split por equipos, así que se les otorga VER_TODOS_LOS_EQUIPOS para que
-- sigan viendo todo como hoy (si no, el fail-closed los dejaría sin bandeja). Cuando se
-- extiendan los equipos al ciclo completo, se les asigna equipo y se revoca este permiso.
--
-- Idempotente: INSERT ... WHERE NOT EXISTS.
-- ============================================================

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'VER_TODOS_LOS_EQUIPOS'
  AND r.nombre IN ('ASESOR_POSTVENTA', 'SUPERVISOR_POSTVENTA', 'ASESOR_COBRANZA')
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
