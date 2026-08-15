-- Backfill de permisos para dashboards operativos reutilizados desde ADMIN.
-- No crea permisos nuevos: solo asocia permisos existentes a los roles definidos.

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT rol.id, permiso.id
FROM roles rol
CROSS JOIN permisos permiso
WHERE rol.nombre = 'COMMUNITY'
  AND permiso.nombre IN (
      'READ_LEADS_GTR',
      'READ_TIPIFICACIONES_PREVENTA'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM rol_permiso asignacion
      WHERE asignacion.rol_id = rol.id
        AND asignacion.permiso_id = permiso.id
  );

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT rol.id, permiso.id
FROM roles rol
CROSS JOIN permisos permiso
WHERE rol.nombre = 'ASESOR_POSTVENTA'
  AND permiso.nombre = 'READ_POSTVENTA_GESTION_MENSUAL'
  AND NOT EXISTS (
      SELECT 1
      FROM rol_permiso asignacion
      WHERE asignacion.rol_id = rol.id
        AND asignacion.permiso_id = permiso.id
  );
