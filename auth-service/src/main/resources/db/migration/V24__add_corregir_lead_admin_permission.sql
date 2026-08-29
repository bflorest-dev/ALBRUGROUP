-- ============================================================
-- V24: Permiso CORREGIR_LEAD_ADMIN
-- Habilita la tab de correccion integral de leads (buscar, editar
-- datos preventa/direccion/oferta, eliminar eventos y dejar un
-- evento CORRECCION). Es una operacion sensible sobre la integridad
-- del lead, por eso se asigna solo a ADMINISTRADOR.
-- ============================================================

INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'CORREGIR_LEAD_ADMIN',
       'Puede corregir integralmente un lead: editar datos y eliminar eventos',
       'LEAD',
       'CORRECCION'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'CORREGIR_LEAD_ADMIN');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'CORREGIR_LEAD_ADMIN'
  AND r.nombre = 'ADMINISTRADOR'
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
