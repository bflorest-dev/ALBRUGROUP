INSERT INTO permisos (nombre, descripcion, recurso, accion)
VALUES
    ('READ_LEAD_GESTION_SUPERVISOR_GTR', 'Puede consultar el detalle de gestion de leads PREVENTA sin equipo', 'LEAD_GESTION_SUPERVISOR_GTR', 'READ'),
    ('UPDATE_LEAD_GESTION_SUPERVISOR_GTR', 'Puede actualizar datos de gestion de leads PREVENTA sin equipo', 'LEAD_GESTION_SUPERVISOR_GTR', 'UPDATE'),
    ('TYPIFY_LEAD_GESTION_SUPERVISOR_GTR', 'Puede tipificar leads PREVENTA sin equipo desde Supervisor GTR', 'LEAD_GESTION_SUPERVISOR_GTR', 'TYPIFY'),
    ('READ_LEAD_NUMEROS_LLAMADA_SUPERVISOR_GTR', 'Puede consultar numeros de llamada de leads sin equipo', 'LEAD_NUMERO_LLAMADA_SUPERVISOR_GTR', 'READ'),
    ('UPDATE_LEAD_NUMERO_LLAMADA_SUPERVISOR_GTR', 'Puede actualizar el numero para llamar de leads sin equipo', 'LEAD_NUMERO_LLAMADA_SUPERVISOR_GTR', 'UPDATE'),
    ('CONTACT_LEAD_GESTION_SUPERVISOR_GTR', 'Puede registrar llamadas y chats de leads sin equipo', 'LEAD_GESTION_SUPERVISOR_GTR', 'CONTACT')
ON CONFLICT (nombre) DO NOTHING;

DO $$
DECLARE
    permisos_esperados CONSTANT TEXT[] := ARRAY[
        'READ_LEAD_GESTION_SUPERVISOR_GTR',
        'UPDATE_LEAD_GESTION_SUPERVISOR_GTR',
        'TYPIFY_LEAD_GESTION_SUPERVISOR_GTR',
        'READ_LEAD_NUMEROS_LLAMADA_SUPERVISOR_GTR',
        'UPDATE_LEAD_NUMERO_LLAMADA_SUPERVISOR_GTR',
        'CONTACT_LEAD_GESTION_SUPERVISOR_GTR'
    ];
    faltantes TEXT[];
    v_rol_id BIGINT;
BEGIN
    SELECT id INTO v_rol_id FROM roles WHERE nombre = 'SUPERVISOR_GTR';
    IF v_rol_id IS NULL THEN
        RAISE EXCEPTION 'No existe el rol SUPERVISOR_GTR para gestionar permisos de leads';
    END IF;

    SELECT ARRAY_AGG(nombre ORDER BY nombre)
    INTO faltantes
    FROM unnest(permisos_esperados) AS esperado(nombre)
    WHERE NOT EXISTS (
        SELECT 1
        FROM permisos p
        WHERE p.nombre = esperado.nombre
    );
    IF faltantes IS NOT NULL THEN
        RAISE EXCEPTION 'Faltan permisos de gestion Supervisor GTR: %', faltantes;
    END IF;

    INSERT INTO rol_permiso (rol_id, permiso_id)
    SELECT v_rol_id, p.id
    FROM permisos p
    WHERE p.nombre = ANY(permisos_esperados)
       OR p.nombre IN ('READ_ZONAS', 'READ_UBIGEO', 'READ_PLANES', 'READ_ADICIONALES', 'READ_PROMOCIONES')
    ON CONFLICT (rol_id, permiso_id) DO NOTHING;

    IF (
        SELECT COUNT(*)
        FROM rol_permiso rp
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE rp.rol_id = v_rol_id
          AND p.nombre = ANY(permisos_esperados)
    ) <> cardinality(permisos_esperados) THEN
        RAISE EXCEPTION 'No se pudieron asociar todos los permisos a SUPERVISOR_GTR';
    END IF;
END $$;
