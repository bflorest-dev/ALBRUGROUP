-- Habilita temporalmente a los asesores postventa para operar tambien como backoffice.
-- No duplica permisos en ASESOR_POSTVENTA: agrega el rol ASESOR_BACKOFFICE al usuario.
INSERT INTO usuario_rol (usuario_id, rol_id)
SELECT postventa_usuarios.usuario_id, backoffice.id
FROM usuario_rol postventa_usuarios
JOIN roles postventa ON postventa.id = postventa_usuarios.rol_id
JOIN roles backoffice ON backoffice.nombre = 'ASESOR_BACKOFFICE'
WHERE postventa.nombre = 'ASESOR_POSTVENTA'
ON CONFLICT (usuario_id, rol_id) DO NOTHING;
