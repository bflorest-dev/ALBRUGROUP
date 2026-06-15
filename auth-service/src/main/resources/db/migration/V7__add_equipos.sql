-- ============================================================
-- V7: Equipos (partición de datos por proveedor) + permiso global
--
-- Un Equipo agrupa usuarios operativos (GTR/VENTAS/OJT/BACKOFFICE) para
-- limitar qué datos (campañas, planes, leads) ven. La membresía es
-- ortogonal al rol. Roles operativos: exactamente 1 equipo; ADMIN/COMMUNITY:
-- sin equipo (acceso global por permiso, nunca por ausencia de equipo).
--
-- El mapping equipo↔proveedor vive en lead-service; aquí solo la identidad
-- del equipo y la membresía del usuario. El id de equipo viaja en el JWT.
--
-- Idempotente en los INSERT de permiso/grant (WHERE NOT EXISTS).
-- ============================================================

CREATE TABLE equipos (
    id          BIGSERIAL PRIMARY KEY,
    nombre      VARCHAR(255) UNIQUE,
    descripcion VARCHAR(255),
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE,
    updated_at  TIMESTAMP WITH TIME ZONE
);

CREATE TABLE usuario_equipo (
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    equipo_id  BIGINT NOT NULL REFERENCES equipos(id),
    PRIMARY KEY (usuario_id, equipo_id)
);

-- Permiso de visibilidad global: salta el filtro por equipo en los servicios
-- consumidores. Se otorga a quienes deben ver todos los equipos.
INSERT INTO permisos (nombre, descripcion, recurso, accion)
SELECT 'VER_TODOS_LOS_EQUIPOS',
       'Puede ver datos de todos los equipos (salta el filtro por equipo)',
       'EQUIPO',
       'READ_ALL'
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'VER_TODOS_LOS_EQUIPOS');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE p.nombre = 'VER_TODOS_LOS_EQUIPOS'
  AND r.nombre IN ('ADMINISTRADOR', 'MONITOR')
  AND NOT EXISTS (
        SELECT 1
        FROM rol_permiso rp
        WHERE rp.rol_id = r.id
          AND rp.permiso_id = p.id
  );
