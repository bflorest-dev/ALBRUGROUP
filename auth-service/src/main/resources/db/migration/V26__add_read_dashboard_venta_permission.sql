-- ============================================================
-- V26: Permiso READ_DASHBOARD_VENTA
-- Habilita el DASHBOARD de la etapa VENTA (GET /venta/dashboard),
-- filtrado por proveedor. Se otorga a ADMINISTRADOR, SUPERVISOR_VENTAS,
-- COMMUNITY y BACKOFFICE (asesor + supervisor).
-- ============================================================

INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'READ_DASHBOARD_VENTA',
       'Puede ver el dashboard de metricas de la etapa de venta',
       'DASHBOARD_VENTA',
       'READ'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'READ_DASHBOARD_VENTA');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'READ_DASHBOARD_VENTA'
  AND r.nombre IN (
        'ADMINISTRADOR',
        'SUPERVISOR_VENTAS',
        'COMMUNITY',
        'ASESOR_BACKOFFICE',
        'SUPERVISOR_BACKOFFICE'
  )
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
