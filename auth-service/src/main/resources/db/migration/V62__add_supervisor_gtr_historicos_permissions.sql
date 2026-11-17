INSERT INTO permisos (nombre, descripcion, recurso, accion)
VALUES
    ('READ_HISTORICOS_SUPERVISOR_GTR', 'Puede consultar historicos de leads PREVENTA de sus proveedores', 'HISTORICOS_SUPERVISOR_GTR', 'READ'),
    ('ASSIGN_HISTORICOS_EQUIPO_SUPERVISOR_GTR', 'Puede mover leads historicos PREVENTA entre equipos del proveedor', 'HISTORICOS_SUPERVISOR_GTR', 'ASSIGN')
ON CONFLICT (nombre) DO NOTHING;

DO $$
DECLARE
    permisos_esperados CONSTANT TEXT[] := ARRAY[
        'READ_HISTORICOS_SUPERVISOR_GTR',
        'ASSIGN_HISTORICOS_EQUIPO_SUPERVISOR_GTR'
    ];
    faltantes TEXT[];
    v_rol_id BIGINT;
BEGIN
    SELECT id INTO v_rol_id FROM roles WHERE nombre = 'SUPERVISOR_GTR';
    IF v_rol_id IS NULL THEN
        RAISE EXCEPTION 'No existe el rol SUPERVISOR_GTR para historicos';
    END IF;

    SELECT ARRAY_AGG(nombre ORDER BY nombre)
    INTO faltantes
    FROM unnest(permisos_esperados) AS esperado(nombre)
    WHERE NOT EXISTS (
        SELECT 1 FROM permisos p WHERE p.nombre = esperado.nombre
    );
    IF faltantes IS NOT NULL THEN
        RAISE EXCEPTION 'Faltan permisos de historicos Supervisor GTR: %', faltantes;
    END IF;

    INSERT INTO rol_permiso (rol_id, permiso_id)
    SELECT v_rol_id, p.id
    FROM permisos p
    WHERE p.nombre = ANY(permisos_esperados)
    ON CONFLICT (rol_id, permiso_id) DO NOTHING;

    IF (
        SELECT COUNT(*)
        FROM rol_permiso rp
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE rp.rol_id = v_rol_id
          AND p.nombre = ANY(permisos_esperados)
    ) <> cardinality(permisos_esperados) THEN
        RAISE EXCEPTION 'No se pudieron asociar todos los permisos de historicos a SUPERVISOR_GTR';
    END IF;
END $$;
