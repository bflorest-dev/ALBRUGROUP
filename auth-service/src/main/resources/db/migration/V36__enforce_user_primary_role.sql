CREATE OR REPLACE FUNCTION assert_usuario_rol_principal(p_usuario_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM usuarios u
        WHERE u.id = p_usuario_id
          AND u.rol_principal_id IS NULL
          AND EXISTS (SELECT 1 FROM usuario_rol ur WHERE ur.usuario_id = u.id)
    ) THEN
        RAISE EXCEPTION 'El usuario % tiene roles asignados pero no rol principal', p_usuario_id;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION validar_usuario_rol_desde_asignacion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_usuario_id BIGINT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_usuario_id := OLD.usuario_id;
    ELSE
        v_usuario_id := NEW.usuario_id;
    END IF;
    PERFORM assert_usuario_rol_principal(v_usuario_id);
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION validar_usuario_rol_desde_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM assert_usuario_rol_principal(NEW.id);
    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_usuario_rol_requiere_principal
AFTER INSERT OR UPDATE OR DELETE ON usuario_rol
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validar_usuario_rol_desde_asignacion();

CREATE CONSTRAINT TRIGGER trg_usuario_principal_requerido
AFTER INSERT OR UPDATE ON usuarios
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validar_usuario_rol_desde_usuario();
