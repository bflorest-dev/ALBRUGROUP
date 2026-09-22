ALTER TABLE usuarios
    ADD COLUMN rol_principal_id BIGINT REFERENCES roles(id);

ALTER TABLE refresh_tokens
    ADD COLUMN rol_activo_id BIGINT REFERENCES roles(id);

CREATE TABLE usuario_rol_auditoria (
    id                      BIGSERIAL PRIMARY KEY,
    usuario_id              BIGINT       NOT NULL REFERENCES usuarios(id),
    empleado_id             BIGINT       NOT NULL,
    actor_empleado_id       BIGINT,
    actor_username          VARCHAR(255),
    rol_principal_anterior  VARCHAR(255),
    rol_principal_nuevo     VARCHAR(255) NOT NULL,
    roles_anteriores        TEXT         NOT NULL,
    roles_nuevos            TEXT         NOT NULL,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuario_rol_auditoria_empleado_fecha
    ON usuario_rol_auditoria (empleado_id, created_at DESC);

CREATE TABLE usuario_username_migracion (
    usuario_id        BIGINT PRIMARY KEY REFERENCES usuarios(id),
    username_anterior VARCHAR(255) NOT NULL,
    username_nuevo    VARCHAR(255) NOT NULL,
    migrated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Un único rol asignado se convierte directamente en principal.
UPDATE usuarios u
SET rol_principal_id = unico.rol_id
FROM (
    SELECT usuario_id, MIN(rol_id) AS rol_id
    FROM usuario_rol
    GROUP BY usuario_id
    HAVING COUNT(*) = 1
) unico
WHERE unico.usuario_id = u.id;

-- El puente productivo conocido conserva POSTVENTA como principal y BACKOFFICE como secundario.
UPDATE usuarios u
SET rol_principal_id = postventa.id
FROM roles postventa
WHERE postventa.nombre = 'ASESOR_POSTVENTA'
  AND EXISTS (
      SELECT 1 FROM usuario_rol ur
      WHERE ur.usuario_id = u.id AND ur.rol_id = postventa.id
  )
  AND EXISTS (
      SELECT 1
      FROM usuario_rol ur
      JOIN roles r ON r.id = ur.rol_id
      WHERE ur.usuario_id = u.id AND r.nombre = 'ASESOR_BACKOFFICE'
  );

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM usuarios u
        WHERE EXISTS (SELECT 1 FROM usuario_rol ur WHERE ur.usuario_id = u.id)
          AND u.rol_principal_id IS NULL
    ) THEN
        RAISE EXCEPTION 'Hay usuarios con roles cuyo principal no pudo determinarse';
    END IF;
END $$;

ALTER TABLE usuarios
    ADD CONSTRAINT fk_usuario_rol_principal_asignado
    FOREIGN KEY (id, rol_principal_id)
    REFERENCES usuario_rol (usuario_id, rol_id)
    DEFERRABLE INITIALLY DEFERRED;

UPDATE refresh_tokens rt
SET rol_activo_id = u.rol_principal_id
FROM usuarios u
WHERE u.id = rt.usuario_id;

-- El cutover revoca todas las sesiones. Los tokens históricos de cuentas sin rol no tienen
-- contexto válido que preservar y se eliminan antes de imponer la invariantes NOT NULL.
UPDATE refresh_tokens
SET revoked_at = COALESCE(revoked_at, NOW());

DELETE FROM refresh_tokens
WHERE rol_activo_id IS NULL;

ALTER TABLE refresh_tokens
    ALTER COLUMN rol_activo_id SET NOT NULL;

-- Construir el nuevo username exclusivamente desde el prefijo de identidad ya existente.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM (
            SELECT split_part(username, '@albru.', 1) || '@albru.pe' AS username_nuevo
            FROM usuarios
            GROUP BY 1
            HAVING COUNT(*) > 1
        ) colisiones
    ) THEN
        RAISE EXCEPTION 'El formato estable de username genera colisiones';
    END IF;
END $$;

INSERT INTO usuario_username_migracion (usuario_id, username_anterior, username_nuevo)
SELECT id, username, split_part(username, '@albru.', 1) || '@albru.pe'
FROM usuarios;

UPDATE usuarios
SET username = split_part(username, '@albru.', 1) || '@albru.pe';

-- El cutover obliga a iniciar una sesión nueva con username estable y tokenVersion 2.
