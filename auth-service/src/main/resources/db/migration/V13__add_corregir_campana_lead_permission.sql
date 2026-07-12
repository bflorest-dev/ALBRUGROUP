-- ============================================================
-- V10: Permiso CORREGIR_CAMPANA_LEAD
-- Permite corregir la campana asociada a un lead y sus eventos.
-- Se asigna a COMMUNITY y ADMINISTRADOR.
-- ============================================================

INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'CORREGIR_CAMPANA_LEAD',
       'Puede corregir la campana asociada a un lead y sus eventos',
       'LEAD',
       'UPDATE_CAMPAIGN'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'CORREGIR_CAMPANA_LEAD');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'CORREGIR_CAMPANA_LEAD'
  AND r.nombre IN ('ADMINISTRADOR', 'COMMUNITY')
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
