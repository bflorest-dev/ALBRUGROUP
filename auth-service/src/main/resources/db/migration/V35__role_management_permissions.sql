INSERT INTO permisos (nombre, descripcion, recurso, accion)
VALUES
    ('READ_ROLES', 'Puede consultar roles y asignaciones de acceso', 'ROL', 'READ'),
    ('ASSIGN_ROLES', 'Puede asignar roles a usuarios', 'ROL', 'ASSIGN'),
    ('READ_ROLE_AUDIT', 'Puede consultar la auditoria de roles', 'ROL', 'READ_AUDIT'),
    ('RESET_PASSWORD_USUARIOS', 'Puede resetear contrasenas de usuarios', 'USUARIO', 'RESET_PASSWORD'),
    ('READ_USUARIO_PROVEEDORES', 'Puede consultar proveedores asignados a usuarios', 'USUARIO_PROVEEDOR', 'READ'),
    ('ASSIGN_USUARIO_PROVEEDORES', 'Puede asignar proveedores a usuarios', 'USUARIO_PROVEEDOR', 'ASSIGN'),
    ('READ_EQUIPO_PROVEEDORES', 'Puede consultar proveedores asignados a equipos', 'EQUIPO_PROVEEDOR', 'READ'),
    ('ASSIGN_EQUIPO_PROVEEDORES', 'Puede asignar proveedores a equipos', 'EQUIPO_PROVEEDOR', 'ASSIGN'),
    ('DELETE_EQUIPO_PROVEEDORES', 'Puede eliminar datos de proveedores de equipos', 'EQUIPO_PROVEEDOR', 'DELETE'),
    ('RUN_LEAD_ETAPA_BACKFILL', 'Puede ejecutar el backfill de etapas de leads', 'LEAD_ETAPA_BACKFILL', 'RUN'),
    ('AJUSTAR_JORNADA_COMPENSABLE', 'Puede registrar corrimientos compensables', 'JORNADA', 'ADJUST_COMPENSABLE'),
    ('AJUSTAR_JORNADA_SIN_LIMITE', 'Puede registrar corrimientos sin limite de minutos', 'JORNADA', 'ADJUST_UNLIMITED'),
    ('AJUSTAR_JORNADA_JUSTIFICADA', 'Puede registrar tardanzas justificadas', 'JORNADA', 'ADJUST_JUSTIFIED'),
    ('PROGRAMAR_COMPENSACION', 'Puede programar horas de compensacion', 'JORNADA', 'SCHEDULE_COMPENSATION')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'ADMINISTRADOR'
  AND p.nombre IN (
      'READ_ROLES', 'ASSIGN_ROLES', 'READ_ROLE_AUDIT', 'RESET_PASSWORD_USUARIOS',
      'READ_USUARIO_PROVEEDORES', 'ASSIGN_USUARIO_PROVEEDORES',
      'READ_EQUIPO_PROVEEDORES', 'ASSIGN_EQUIPO_PROVEEDORES', 'DELETE_EQUIPO_PROVEEDORES',
      'RUN_LEAD_ETAPA_BACKFILL', 'AJUSTAR_JORNADA_COMPENSABLE',
      'AJUSTAR_JORNADA_SIN_LIMITE', 'AJUSTAR_JORNADA_JUSTIFICADA', 'PROGRAMAR_COMPENSACION'
  )
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.nombre IN ('AJUSTAR_JORNADA_JUSTIFICADA', 'PROGRAMAR_COMPENSACION')
WHERE r.nombre = 'RRHH'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.nombre = 'AJUSTAR_JORNADA_COMPENSABLE'
WHERE r.nombre IN ('SUPERVISOR_VENTAS', 'SUPERVISOR_GTR')
ON CONFLICT (rol_id, permiso_id) DO NOTHING;
