-- Correccion manual: separar rafito45 del lead/contacto +51 933141308.
--
-- Contexto observado:
-- - contacto 30308 y lead 30254 pertenecen al telefono +51 933141308.
-- - usermeta rafito45 fue asociado por error a ese contacto/lead.
-- - Este script limpia esa asociacion y crea un contacto/lead independiente para rafito45.

BEGIN;

DO $$
DECLARE
    v_usermeta CONSTANT text := 'rafito45';
    v_created_at CONSTANT timestamptz := '2026-08-03 15:12:57.18125+00';
    v_registro_at CONSTANT timestamptz := '2026-08-03 15:12:57.192223+00';
    v_contacto_erroneo CONSTANT bigint := 30308;
    v_lead_erroneo CONSTANT bigint := 30254;
    v_id_campana CONSTANT bigint := 69;
    v_id_equipo CONSTANT bigint := 2;
    v_id_actor CONSTANT bigint := 17;
    v_nombre_actor CONSTANT text := 'Anny Yoselin Prieto Ovalles';
    v_rol_actor CONSTANT text := 'ASESOR_GTR';
    v_nuevo_contacto bigint;
    v_nuevo_lead bigint;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM contacto
        WHERE id = v_contacto_erroneo
          AND prefijo = '+51'
          AND lead = '933141308'
          AND lower(usermeta) = v_usermeta
    ) THEN
        RAISE EXCEPTION 'No se encontro el contacto esperado % con usermeta %', v_contacto_erroneo, v_usermeta;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM lead
        WHERE id = v_lead_erroneo
          AND prefijo = '+51'
          AND lead = '933141308'
          AND lower(usermeta) = v_usermeta
          AND id_contacto = v_contacto_erroneo
    ) THEN
        RAISE EXCEPTION 'No se encontro el lead esperado % con usermeta %', v_lead_erroneo, v_usermeta;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM contacto
        WHERE lower(usermeta) = v_usermeta
          AND id <> v_contacto_erroneo
    ) THEN
        RAISE EXCEPTION 'Ya existe otro contacto con usermeta %', v_usermeta;
    END IF;

    UPDATE lead
       SET usermeta = NULL,
           updated_at = now()
     WHERE id = v_lead_erroneo
       AND lower(usermeta) = v_usermeta;

    UPDATE contacto
       SET usermeta = NULL,
           updated_at = now()
     WHERE id = v_contacto_erroneo
       AND lower(usermeta) = v_usermeta;

    INSERT INTO contacto (prefijo, lead, nombre_conocido, created_at, updated_at, usermeta)
    VALUES (NULL, NULL, NULL, v_created_at, v_created_at, v_usermeta)
    RETURNING id INTO v_nuevo_contacto;

    INSERT INTO lead (
        prefijo,
        lead,
        etapa,
        estado,
        id_campana,
        base,
        created_at,
        last_entry_at,
        updated_at,
        id_contacto,
        id_equipo,
        requiere_atencion_gtr,
        usermeta
    )
    VALUES (
        NULL,
        NULL,
        'PREVENTA',
        'NUEVO',
        v_id_campana,
        'WHATSAPP',
        v_created_at,
        v_created_at,
        v_created_at,
        v_nuevo_contacto,
        v_id_equipo,
        FALSE,
        v_usermeta
    )
    RETURNING id INTO v_nuevo_lead;

    INSERT INTO evento (
        id_lead,
        id_campana,
        id_actor,
        nombre_actor,
        rol_actor,
        accion,
        etapa,
        created_at
    )
    VALUES (
        v_nuevo_lead,
        v_id_campana,
        v_id_actor,
        v_nombre_actor,
        v_rol_actor,
        'REGISTRO',
        'PREVENTA',
        v_registro_at
    );

    INSERT INTO lead_etapa_resumen (
        id_lead,
        etapa,
        fecha_ingreso_etapa,
        numero_pasadas,
        total_tipificaciones,
        total_asignaciones,
        created_at,
        updated_at
    )
    VALUES (
        v_nuevo_lead,
        'PREVENTA',
        v_registro_at,
        1,
        0,
        0,
        v_registro_at,
        v_registro_at
    );

    RAISE NOTICE 'Correccion completada. Nuevo contacto %, nuevo lead %', v_nuevo_contacto, v_nuevo_lead;
END $$;

SELECT
    c.id AS contacto_id,
    c.prefijo AS contacto_prefijo,
    c.lead AS contacto_lead,
    c.usermeta AS contacto_usermeta,
    l.id AS lead_id,
    l.prefijo AS lead_prefijo,
    l.lead AS lead_numero,
    l.usermeta AS lead_usermeta,
    l.created_at,
    l.last_entry_at,
    l.estado
FROM contacto c
JOIN lead l ON l.id_contacto = c.id
WHERE c.id = 30308
   OR l.id = 30254
   OR lower(c.usermeta) = 'rafito45'
   OR lower(l.usermeta) = 'rafito45'
ORDER BY l.id;

COMMIT;
