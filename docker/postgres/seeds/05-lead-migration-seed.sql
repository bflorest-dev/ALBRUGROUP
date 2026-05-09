BEGIN;

SET LOCAL TIME ZONE 'America/Lima';

CREATE TEMP TABLE seed_legacy_cliente_raw (
    id TEXT,
    nombre TEXT,
    tipo_base TEXT,
    leads_original_telefono TEXT,
    campana TEXT,
    canal_adquisicion TEXT,
    sala_asignada TEXT,
    compania TEXT,
    telefono TEXT,
    created_at TEXT,
    updated_at TEXT,
    tipo_cliente_wizard TEXT,
    tipo_documento TEXT,
    lead_score TEXT,
    telefono_registro TEXT,
    fecha_nacimiento TEXT,
    dni_nombre_titular TEXT,
    parentesco_titular TEXT,
    telefono_referencia_wizard TEXT,
    telefono_grabacion_wizard TEXT,
    direccion_completa TEXT,
    direccion_interior TEXT,
    numero_piso_wizard TEXT,
    tipo_plan TEXT,
    servicio_contratado TEXT,
    velocidad_contratada TEXT,
    precio_plan TEXT,
    fecha_programacion_wizard TEXT,
    wizard_completado TEXT,
    fecha_wizard_completado TEXT,
    dni TEXT,
    asesor_asignado TEXT,
    contador_reasignaciones TEXT,
    fecha_asignacion_asesor TEXT,
    validador_asignado TEXT,
    fecha_asignacion_validador TEXT,
    estatus_wizard TEXT,
    seguimiento_status TEXT,
    derivado_at TEXT,
    opened_at TEXT,
    last_activity TEXT,
    estatus_comercial_categoria TEXT,
    estatus_comercial_subcategoria TEXT,
    quality_status TEXT,
    returned_at TEXT,
    es_duplicado TEXT,
    telefono_principal_id TEXT,
    cantidad_duplicados TEXT,
    campanas_asociadas TEXT,
    tipificacion_original TEXT,
    observaciones_asesor TEXT,
    contador_reasignaciones_hoy TEXT,
    fecha_ultima_reasignacion TEXT,
    departamento TEXT,
    distrito TEXT,
    correo_electronico TEXT,
    lugar_nacimiento TEXT
);

\copy seed_legacy_cliente_raw FROM '/seed-data/legacy/clientes_campos_utiles_full.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

CREATE OR REPLACE FUNCTION pg_temp.seed_normalize_text(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT trim(
        regexp_replace(
            upper(COALESCE(p_text, '')),
            '\s+',
            ' ',
            'g'
        )
    );
$$;

CREATE OR REPLACE FUNCTION pg_temp.seed_only_digits(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT regexp_replace(COALESCE(p_text, ''), '[^0-9]', '', 'g');
$$;

CREATE TEMP TABLE seed_legacy_cliente_stage AS
WITH raw_normalized AS (
    SELECT
        NULLIF(TRIM(id), '')::BIGINT AS legacy_cliente_id,
        NULLIF(pg_temp.seed_only_digits(telefono), '') AS numero_lead,
        COALESCE(
            NULLIF(TRIM(telefono), ''),
            NULLIF(TRIM(leads_original_telefono), '')
        ) AS telefono_original,
        CASE pg_temp.seed_normalize_text(tipo_base)
            WHEN 'MASIVO' THEN 'MASIVO'
            WHEN 'PREDICTIVO' THEN 'PREDICTIVO'
            WHEN 'REFERIDO' THEN 'REFERIDO'
            WHEN 'REFERIDOS' THEN 'REFERIDO'
            WHEN 'SEG LEAD' THEN 'RECONTACTO'
            WHEN 'FACEBOOK' THEN 'MESSENGER'
            WHEN 'LEADS' THEN 'WHATSAPP'
            WHEN 'BASE' THEN 'WHATSAPP'
            WHEN '' THEN 'WHATSAPP'
            ELSE 'WHATSAPP'
        END AS base_destino,
        CASE
            WHEN regexp_replace(pg_temp.seed_normalize_text(compania), '[^A-Z0-9]', '', 'g') LIKE '%WIN%' THEN 'WIN'
            WHEN regexp_replace(pg_temp.seed_normalize_text(compania), '[^A-Z0-9]', '', 'g') LIKE '%CLARO%' THEN 'CLARO'
            WHEN regexp_replace(pg_temp.seed_normalize_text(compania), '[^A-Z0-9]', '', 'g') LIKE '%PERUFIBRA%' THEN 'PERUFIBRA'
            WHEN regexp_replace(pg_temp.seed_normalize_text(compania), '[^A-Z0-9]', '', 'g') LIKE '%PERFIBRA%' THEN 'PERUFIBRA'
            WHEN regexp_replace(pg_temp.seed_normalize_text(compania), '[^A-Z0-9]', '', 'g') = '' THEN 'WIN'
            ELSE regexp_replace(pg_temp.seed_normalize_text(compania), '[^A-Z0-9]', '', 'g')
        END AS proveedor_destino,
        NULLIF(TRIM(campana), '') AS campana_legacy,
        NULLIF(TRIM(compania), '') AS proveedor_legacy,
        CASE
            WHEN NULLIF(TRIM(created_at), '') IS NOT NULL THEN (TRIM(created_at)::TIMESTAMP AT TIME ZONE 'America/Lima')
            ELSE NOW()
        END AS created_at_legacy,
        CASE
            WHEN NULLIF(TRIM(updated_at), '') IS NOT NULL THEN (TRIM(updated_at)::TIMESTAMP AT TIME ZONE 'America/Lima')
            ELSE NULL
        END AS updated_at_legacy,
        CASE
            WHEN NULLIF(TRIM(last_activity), '') IS NOT NULL THEN (TRIM(last_activity)::TIMESTAMP AT TIME ZONE 'America/Lima')
            ELSE NULL
        END AS last_activity_legacy,
        CASE
            WHEN NULLIF(TRIM(fecha_programacion_wizard), '') IS NOT NULL THEN TRIM(fecha_programacion_wizard)::DATE
            ELSE NULL
        END AS fecha_programacion_legacy,
        pg_temp.seed_normalize_text(estatus_comercial_categoria) AS categoria_legacy_normalizada,
        pg_temp.seed_normalize_text(estatus_comercial_subcategoria) AS subcategoria_legacy_normalizada,
        pg_temp.seed_normalize_text(tipificacion_original) AS tipificacion_original_normalizada,
        NULLIF(TRIM(observaciones_asesor), '') AS observaciones_asesor,
        CASE
            WHEN NULLIF(TRIM(tipo_documento), '') IS NOT NULL THEN pg_temp.seed_normalize_text(tipo_documento)
            ELSE NULL
        END AS tipo_documento_legacy,
        CASE
            WHEN NULLIF(regexp_replace(COALESCE(dni, ''), '[^0-9A-Za-z]', '', 'g'), '') IS NOT NULL
                THEN regexp_replace(COALESCE(dni, ''), '[^0-9A-Za-z]', '', 'g')
            ELSE NULL
        END AS numero_documento,
        CASE
            WHEN NULLIF(TRIM(dni_nombre_titular), '') IS NULL THEN NULL
            WHEN regexp_replace(TRIM(dni_nombre_titular), '\s', '', 'g') ~ '^[0-9]+$' THEN NULL
            WHEN TRIM(dni_nombre_titular) ~ '^[0-9]+\s+.+$' THEN NULLIF(TRIM(regexp_replace(TRIM(dni_nombre_titular), '^[0-9]+\s+', '')), '')
            ELSE NULLIF(TRIM(dni_nombre_titular), '')
        END AS nombre_titular_documento,
        CASE
            WHEN NULLIF(TRIM(nombre), '') IS NOT NULL AND pg_temp.seed_normalize_text(nombre) <> 'SIN NOMBRE' THEN NULLIF(TRIM(nombre), '')
            ELSE NULL
        END AS nombre_contacto,
        CASE
            WHEN NULLIF(pg_temp.seed_only_digits(telefono_registro), '') IS NOT NULL THEN pg_temp.seed_only_digits(telefono_registro)
            ELSE NULLIF(pg_temp.seed_only_digits(telefono), '')
        END AS celular_registro,
        NULLIF(pg_temp.seed_only_digits(telefono_referencia_wizard), '') AS celular_referencia,
        CASE
            WHEN POSITION('@' IN COALESCE(correo_electronico, '')) > 1 THEN NULLIF(TRIM(correo_electronico), '')
            ELSE NULL
        END AS correo,
        CASE
            WHEN NULLIF(TRIM(direccion_completa), '') IS NOT NULL THEN TRIM(direccion_completa)
            ELSE NULL
        END AS direccion_completa,
        NULLIF(TRIM(direccion_interior), '') AS direccion_interior,
        NULLIF(TRIM(numero_piso_wizard), '') AS numero_piso,
        CASE
            WHEN NULLIF(TRIM(distrito), '') ~ '^[0-9]{6}$' THEN TRIM(distrito)
            ELSE NULL
        END AS ubigeo_domicilio,
        NULLIF(TRIM(tipo_plan), '') AS tipo_plan_legacy,
        NULLIF(TRIM(servicio_contratado), '') AS servicio_contratado_legacy,
        NULLIF(TRIM(velocidad_contratada), '') AS velocidad_contratada_legacy,
        CASE
            WHEN NULLIF(TRIM(precio_plan), '') ~ '^[0-9]+(\.[0-9]+)?$' THEN TRIM(precio_plan)::NUMERIC(10,2)
            ELSE NULL
        END AS precio_plan_legacy
    FROM seed_legacy_cliente_raw
),
raw_mapped AS (
    SELECT
        r.*,
        CASE
            WHEN r.tipificacion_original_normalizada = 'PREVENTA COMPLETA' THEN 'PREVENTA_COMPLETA'
            WHEN r.tipificacion_original_normalizada = '7 - VC MES SIGUIENTE' THEN 'PREVENTA_COMPLETA'
            WHEN r.tipificacion_original_normalizada = 'PREVENTA INCOMPLETA' THEN 'SCORE_PREVENTA'
            WHEN r.tipificacion_original_normalizada = '6 - PDTE SCORE' THEN 'SCORE_PREVENTA'
            WHEN r.tipificacion_original_normalizada = '0 - NO CONTESTA' THEN 'SIN_CONTACTO'
            WHEN r.tipificacion_original_normalizada = '0 - BUZON' THEN 'SIN_CONTACTO'
            WHEN r.tipificacion_original_normalizada LIKE '0 - N% EQUIVOCADO' THEN 'SIN_CONTACTO'
            WHEN r.tipificacion_original_normalizada = '0 - FUERA DE SERVICIO' THEN 'SIN_CONTACTO'
            WHEN r.tipificacion_original_normalizada = '0 - CORTA LLAMADA' THEN 'SEGUIMIENTO'
            WHEN r.tipificacion_original_normalizada = '1 - SEGUIMIENTO' THEN 'SEGUIMIENTO'
            WHEN r.tipificacion_original_normalizada = '1 - SOLO INFO' THEN 'SEGUIMIENTO'
            WHEN r.tipificacion_original_normalizada LIKE '1 - GESTI% X CHAT' THEN 'SEGUIMIENTO'
            WHEN r.tipificacion_original_normalizada = '2 - AGENDADO' THEN 'AGENDADO'
            WHEN r.tipificacion_original_normalizada LIKE '2 - CONSULTAR% CON FAMILIAR' THEN 'AGENDADO'
            WHEN r.tipificacion_original_normalizada = '3 - NO DESEA' THEN 'RECHAZADO'
            WHEN r.tipificacion_original_normalizada = '3 - NO CALIFICA' THEN 'RECHAZADO'
            WHEN r.tipificacion_original_normalizada LIKE '3 - CON PROGRAMACI%' THEN 'RECHAZADO'
            WHEN r.tipificacion_original_normalizada = '3 - VC DESAPROBADA' THEN 'RECHAZADO'
            WHEN r.tipificacion_original_normalizada = '3 - ZONA F' THEN 'RECHAZADO'
            WHEN r.tipificacion_original_normalizada = '4 - ND PUBLICIDAD' THEN 'REITERADO'
            WHEN r.tipificacion_original_normalizada = '4 - DOBLE CLICK' THEN 'REITERADO'
            WHEN r.tipificacion_original_normalizada = '5 - SIN COBERTURA' THEN 'SIN_FACILIDADES'
            WHEN r.tipificacion_original_normalizada = '5 - SERVICIO ACTIVO' THEN 'SIN_FACILIDADES'
            WHEN r.tipificacion_original_normalizada = '5 - EDIFICIO SIN LIBERAR' THEN 'SIN_FACILIDADES'
            WHEN r.tipificacion_original_normalizada = '5 - SIN CTO' THEN 'SIN_FACILIDADES'
            WHEN r.tipificacion_original_normalizada = '8 - LISTA NEGRA' THEN 'LISTA_NEGRA'
            WHEN r.categoria_legacy_normalizada = 'PREVENTA COMPLETA' AND r.subcategoria_legacy_normalizada = 'VENTA CERRADA' THEN 'PREVENTA_COMPLETA'
            WHEN r.categoria_legacy_normalizada = 'PREVENTA INCOMPLETA' AND r.subcategoria_legacy_normalizada = 'PREVENTA INCOMPLETA' THEN 'SCORE_PREVENTA'
            WHEN r.categoria_legacy_normalizada = 'SIN CONTACTO'
                 AND (
                    r.subcategoria_legacy_normalizada = 'NO CONTESTA'
                    OR r.subcategoria_legacy_normalizada LIKE 'BUZ%'
                    OR r.subcategoria_legacy_normalizada LIKE 'N% EQUIVOCADO'
                    OR r.subcategoria_legacy_normalizada = 'FUERA DE SERVICIO'
                 ) THEN 'SIN_CONTACTO'
            WHEN r.categoria_legacy_normalizada = 'SIN FACILIDADES' AND r.subcategoria_legacy_normalizada IN ('SIN COBERTURA', 'SERVICIO ACTIVO', 'EDIFICIO SIN LIBERAR', 'SIN CTO') THEN 'SIN_FACILIDADES'
            WHEN r.categoria_legacy_normalizada = 'SEGUIMIENTO'
                 AND (
                    r.subcategoria_legacy_normalizada IN ('SEGUIMIENTO', 'SOLO INFO', 'LLAMADA INTERRUMPIDA')
                    OR r.subcategoria_legacy_normalizada LIKE 'GESTI% O CHAT'
                 ) THEN 'SEGUIMIENTO'
            WHEN r.categoria_legacy_normalizada = 'AGENDADO'
                 AND (
                    r.subcategoria_legacy_normalizada IN ('AGENDADO', 'FIN DE MES')
                    OR r.subcategoria_legacy_normalizada LIKE 'CONSULTAR% CON FAMILIAR'
                 ) THEN 'AGENDADO'
            WHEN r.categoria_legacy_normalizada = 'RECHAZADO'
                 AND (
                    r.subcategoria_legacy_normalizada IN ('NO DESEA', 'NO CALIFICA', 'VENTA CERRADA DESAPROBADA', 'ZONA FRAUDE')
                    OR r.subcategoria_legacy_normalizada LIKE 'CON PROGRAMACI%'
                 ) THEN 'RECHAZADO'
            WHEN r.categoria_legacy_normalizada = 'RETIRADO' AND r.subcategoria_legacy_normalizada = 'NO DESEA PUBLICIDAD' THEN 'REITERADO'
            WHEN r.categoria_legacy_normalizada = 'LISTA NEGRA' THEN 'LISTA_NEGRA'
            ELSE NULL
        END AS codigo_tipificacion,
        CASE
            WHEN r.tipificacion_original_normalizada = 'PREVENTA COMPLETA' THEN 'VENTA_CERRADA'
            WHEN r.tipificacion_original_normalizada = '7 - VC MES SIGUIENTE' THEN 'VC_SIGUIENTE_MES'
            WHEN r.tipificacion_original_normalizada = 'PREVENTA INCOMPLETA' THEN 'PREVENTA_INCOMPLETA'
            WHEN r.tipificacion_original_normalizada = '6 - PDTE SCORE' THEN 'PDTE_SCORE'
            WHEN r.tipificacion_original_normalizada = '0 - NO CONTESTA' THEN 'NO_CONTESTA'
            WHEN r.tipificacion_original_normalizada = '0 - BUZON' THEN 'BUZON_DE_VOZ'
            WHEN r.tipificacion_original_normalizada LIKE '0 - N% EQUIVOCADO' THEN 'NUMERO_EQUIVOCADO'
            WHEN r.tipificacion_original_normalizada = '0 - FUERA DE SERVICIO' THEN 'FUERA_DE_SERVICIO'
            WHEN r.tipificacion_original_normalizada = '0 - CORTA LLAMADA' THEN 'LLAMADA_INTERRUMPIDA'
            WHEN r.tipificacion_original_normalizada = '1 - SEGUIMIENTO' THEN 'SEGUIMIENTO'
            WHEN r.tipificacion_original_normalizada = '1 - SOLO INFO' THEN 'SOLO_INFORMACION'
            WHEN r.tipificacion_original_normalizada LIKE '1 - GESTI% X CHAT' THEN 'GESTION_CHAT'
            WHEN r.tipificacion_original_normalizada = '2 - AGENDADO' THEN 'AGENDADO'
            WHEN r.tipificacion_original_normalizada LIKE '2 - CONSULTAR% CON FAMILIAR' THEN 'CONSULTARA_CON_FAMILIAR'
            WHEN r.tipificacion_original_normalizada = '3 - NO DESEA' THEN 'NO_DESEA'
            WHEN r.tipificacion_original_normalizada = '3 - NO CALIFICA' THEN 'NO_CALIFICA'
            WHEN r.tipificacion_original_normalizada LIKE '3 - CON PROGRAMACI%' THEN 'CON_PROGRAMACION'
            WHEN r.tipificacion_original_normalizada = '3 - VC DESAPROBADA' THEN 'VC_DESAPROBADA'
            WHEN r.tipificacion_original_normalizada = '3 - ZONA F' THEN 'ZONA_FRAUDE'
            WHEN r.tipificacion_original_normalizada = '4 - ND PUBLICIDAD' THEN 'ND_PUBLICIDAD'
            WHEN r.tipificacion_original_normalizada = '4 - DOBLE CLICK' THEN 'DOBLE_CLICK'
            WHEN r.tipificacion_original_normalizada = '5 - SIN COBERTURA' THEN 'SIN_COBERTURA'
            WHEN r.tipificacion_original_normalizada = '5 - SERVICIO ACTIVO' THEN 'SERVICIO_ACTIVO'
            WHEN r.tipificacion_original_normalizada = '5 - EDIFICIO SIN LIBERAR' THEN 'EDIFICIO_SIN_LIBERAR'
            WHEN r.tipificacion_original_normalizada = '5 - SIN CTO' THEN 'SIN_CTO'
            WHEN r.tipificacion_original_normalizada = '8 - LISTA NEGRA' THEN 'BLACKLIST'
            WHEN r.categoria_legacy_normalizada = 'PREVENTA COMPLETA' AND r.subcategoria_legacy_normalizada = 'VENTA CERRADA' THEN 'VENTA_CERRADA'
            WHEN r.categoria_legacy_normalizada = 'PREVENTA INCOMPLETA' AND r.subcategoria_legacy_normalizada = 'PREVENTA INCOMPLETA' THEN 'PREVENTA_INCOMPLETA'
            WHEN r.categoria_legacy_normalizada = 'SIN CONTACTO' AND r.subcategoria_legacy_normalizada = 'NO CONTESTA' THEN 'NO_CONTESTA'
            WHEN r.categoria_legacy_normalizada = 'SIN CONTACTO' AND r.subcategoria_legacy_normalizada LIKE 'BUZ%' THEN 'BUZON_DE_VOZ'
            WHEN r.categoria_legacy_normalizada = 'SIN CONTACTO' AND r.subcategoria_legacy_normalizada LIKE 'N% EQUIVOCADO' THEN 'NUMERO_EQUIVOCADO'
            WHEN r.categoria_legacy_normalizada = 'SIN CONTACTO' AND r.subcategoria_legacy_normalizada = 'FUERA DE SERVICIO' THEN 'FUERA_DE_SERVICIO'
            WHEN r.categoria_legacy_normalizada = 'SIN FACILIDADES' AND r.subcategoria_legacy_normalizada = 'SIN COBERTURA' THEN 'SIN_COBERTURA'
            WHEN r.categoria_legacy_normalizada = 'SIN FACILIDADES' AND r.subcategoria_legacy_normalizada = 'SERVICIO ACTIVO' THEN 'SERVICIO_ACTIVO'
            WHEN r.categoria_legacy_normalizada = 'SIN FACILIDADES' AND r.subcategoria_legacy_normalizada = 'EDIFICIO SIN LIBERAR' THEN 'EDIFICIO_SIN_LIBERAR'
            WHEN r.categoria_legacy_normalizada = 'SIN FACILIDADES' AND r.subcategoria_legacy_normalizada = 'SIN CTO' THEN 'SIN_CTO'
            WHEN r.categoria_legacy_normalizada = 'SEGUIMIENTO' AND r.subcategoria_legacy_normalizada = 'SEGUIMIENTO' THEN 'SEGUIMIENTO'
            WHEN r.categoria_legacy_normalizada = 'SEGUIMIENTO' AND r.subcategoria_legacy_normalizada = 'SOLO INFO' THEN 'SOLO_INFORMACION'
            WHEN r.categoria_legacy_normalizada = 'SEGUIMIENTO' AND r.subcategoria_legacy_normalizada LIKE 'GESTI% O CHAT' THEN 'GESTION_CHAT'
            WHEN r.categoria_legacy_normalizada = 'SEGUIMIENTO' AND r.subcategoria_legacy_normalizada = 'LLAMADA INTERRUMPIDA' THEN 'LLAMADA_INTERRUMPIDA'
            WHEN r.categoria_legacy_normalizada = 'AGENDADO' AND r.subcategoria_legacy_normalizada = 'AGENDADO' THEN 'AGENDADO'
            WHEN r.categoria_legacy_normalizada = 'AGENDADO' AND r.subcategoria_legacy_normalizada LIKE 'CONSULTAR% CON FAMILIAR' THEN 'CONSULTARA_CON_FAMILIAR'
            WHEN r.categoria_legacy_normalizada = 'AGENDADO' AND r.subcategoria_legacy_normalizada = 'FIN DE MES' THEN 'FIN_DE_MES'
            WHEN r.categoria_legacy_normalizada = 'RECHAZADO' AND r.subcategoria_legacy_normalizada = 'NO DESEA' THEN 'NO_DESEA'
            WHEN r.categoria_legacy_normalizada = 'RECHAZADO' AND r.subcategoria_legacy_normalizada = 'NO CALIFICA' THEN 'NO_CALIFICA'
            WHEN r.categoria_legacy_normalizada = 'RECHAZADO' AND r.subcategoria_legacy_normalizada LIKE 'CON PROGRAMACI%' THEN 'CON_PROGRAMACION'
            WHEN r.categoria_legacy_normalizada = 'RECHAZADO' AND r.subcategoria_legacy_normalizada = 'VENTA CERRADA DESAPROBADA' THEN 'VC_DESAPROBADA'
            WHEN r.categoria_legacy_normalizada = 'RECHAZADO' AND r.subcategoria_legacy_normalizada = 'ZONA FRAUDE' THEN 'ZONA_FRAUDE'
            WHEN r.categoria_legacy_normalizada = 'RETIRADO' AND r.subcategoria_legacy_normalizada = 'NO DESEA PUBLICIDAD' THEN 'ND_PUBLICIDAD'
            WHEN r.categoria_legacy_normalizada = 'LISTA NEGRA' THEN 'BLACKLIST'
            ELSE NULL
        END AS codigo_subtipificacion
    FROM raw_normalized r
),
ranked AS (
    SELECT
        m.*,
        ROW_NUMBER() OVER (
            PARTITION BY m.numero_lead
            ORDER BY
                CASE WHEN m.codigo_tipificacion IS NOT NULL AND m.codigo_subtipificacion IS NOT NULL THEN 1 ELSE 0 END DESC,
                CASE
                    WHEN m.numero_documento IS NOT NULL
                      OR m.nombre_titular_documento IS NOT NULL
                      OR m.nombre_contacto IS NOT NULL
                      OR m.direccion_completa IS NOT NULL
                      OR m.correo IS NOT NULL
                      OR m.precio_plan_legacy IS NOT NULL
                    THEN 1
                    ELSE 0
                END DESC,
                COALESCE(m.last_activity_legacy, m.updated_at_legacy, m.created_at_legacy) DESC,
                m.legacy_cliente_id DESC
        ) AS rn
    FROM raw_mapped m
    WHERE m.numero_lead ~ '^[0-9]{9}$'
)
SELECT
    legacy_cliente_id,
    numero_lead,
    telefono_original,
    base_destino,
    proveedor_destino,
    campana_legacy,
    proveedor_legacy,
    created_at_legacy,
    updated_at_legacy,
    last_activity_legacy,
    COALESCE(last_activity_legacy, updated_at_legacy, created_at_legacy) AS last_entry_at_destino,
    fecha_programacion_legacy,
    categoria_legacy_normalizada,
    subcategoria_legacy_normalizada,
    tipificacion_original_normalizada,
    observaciones_asesor,
    CASE
        WHEN tipo_documento_legacy = 'DNI' THEN 'DNI'
        WHEN tipo_documento_legacy = 'CE' THEN 'CE'
        WHEN tipo_documento_legacy = 'RUC' THEN 'RUC'
        WHEN numero_documento ~ '^[0-9]{8}$' THEN 'DNI'
        WHEN numero_documento ~ '^[0-9]{11}$' THEN 'RUC'
        ELSE NULL
    END AS tipo_documento_destino,
    CASE
        WHEN numero_documento ~ '^[0-9A-Za-z]{8,11}$' THEN numero_documento
        ELSE NULL
    END AS numero_documento_destino,
    COALESCE(nombre_titular_documento, nombre_contacto) AS nombre_titular_destino,
    celular_registro,
    celular_referencia,
    correo,
    direccion_completa,
    direccion_interior,
    numero_piso,
    ubigeo_domicilio,
    tipo_plan_legacy,
    servicio_contratado_legacy,
    velocidad_contratada_legacy,
    precio_plan_legacy,
    NULLIF(
        CONCAT_WS(' | ',
            tipo_plan_legacy,
            servicio_contratado_legacy,
            velocidad_contratada_legacy
        ),
        ''
    ) AS nombre_plan_snapshot,
    codigo_tipificacion,
    codigo_subtipificacion,
    CASE
        WHEN codigo_tipificacion IS NOT NULL AND codigo_subtipificacion IS NOT NULL THEN 'GESTIONADO'
        ELSE 'NUEVO'
    END AS estado_destino
FROM ranked
WHERE rn = 1;

DO $$
DECLARE
    proveedores_desconocidos TEXT;
BEGIN
    SELECT string_agg(proveedor_destino, ', ' ORDER BY proveedor_destino)
    INTO proveedores_desconocidos
    FROM (
        SELECT DISTINCT s.proveedor_destino
        FROM seed_legacy_cliente_stage s
        WHERE NOT EXISTS (
            SELECT 1
            FROM proveedor p
            WHERE UPPER(TRIM(p.nombre)) = UPPER(TRIM(s.proveedor_destino))
        )
    ) faltantes;

    IF proveedores_desconocidos IS NOT NULL THEN
        RAISE EXCEPTION 'La migracion legacy contiene proveedores no catalogados: %', proveedores_desconocidos;
    END IF;
END $$;

DO $$
DECLARE
    rec RECORD;
    v_id_proveedor BIGINT;
    v_id_campana BIGINT;
    v_id_datos_preventa BIGINT;
    v_id_direccion BIGINT;
    v_id_lead BIGINT;
    v_id_tipificacion BIGINT;
    v_id_subtipificacion BIGINT;
    v_id_plan BIGINT;
    v_velocidad INTEGER;
BEGIN
    FOR rec IN
        SELECT *
        FROM seed_legacy_cliente_stage
        ORDER BY legacy_cliente_id
    LOOP
        IF EXISTS (
            SELECT 1
            FROM lead l
            WHERE l.prefijo = '+51'
              AND l.lead = rec.numero_lead
        ) THEN
            CONTINUE;
        END IF;

        SELECT p.id
        INTO v_id_proveedor
        FROM proveedor p
        WHERE UPPER(TRIM(p.nombre)) = UPPER(TRIM(rec.proveedor_destino))
        ORDER BY p.id
        LIMIT 1;

        SELECT c.id
        INTO v_id_campana
        FROM campana c
        JOIN proveedor p ON p.id = c.id_proveedor
        WHERE UPPER(TRIM(p.nombre)) = UPPER(TRIM(rec.proveedor_destino))
        ORDER BY
            CASE WHEN c.activo THEN 0 ELSE 1 END,
            c.id ASC
        LIMIT 1;

        v_id_tipificacion := NULL;
        v_id_subtipificacion := NULL;
        v_id_plan := NULL;

        IF rec.codigo_tipificacion IS NOT NULL THEN
            SELECT t.id
            INTO v_id_tipificacion
            FROM tipificacion t
            WHERE t.etapa = 'PREVENTA'
              AND t.codigo = rec.codigo_tipificacion
            ORDER BY t.id
            LIMIT 1;
        END IF;

        IF v_id_tipificacion IS NOT NULL AND rec.codigo_subtipificacion IS NOT NULL THEN
            SELECT s.id
            INTO v_id_subtipificacion
            FROM subtipificacion s
            WHERE s.tipificacion_id = v_id_tipificacion
              AND s.codigo = rec.codigo_subtipificacion
            ORDER BY s.id
            LIMIT 1;
        END IF;

        IF rec.velocidad_contratada_legacy IS NOT NULL
           AND regexp_replace(rec.velocidad_contratada_legacy, '[^0-9]', '', 'g') <> '' THEN
            v_velocidad := regexp_replace(rec.velocidad_contratada_legacy, '[^0-9]', '', 'g')::INTEGER;
        ELSE
            v_velocidad := NULL;
        END IF;

        IF v_id_proveedor IS NOT NULL THEN
            SELECT pl.id
            INTO v_id_plan
            FROM plan pl
            LEFT JOIN internet i ON i.id = pl.id_internet
            WHERE pl.id_proveedor = v_id_proveedor
              AND (rec.precio_plan_legacy IS NULL OR pl.precio = rec.precio_plan_legacy)
              AND (v_velocidad IS NULL OR i.velocidad = v_velocidad)
            ORDER BY
                CASE WHEN rec.precio_plan_legacy IS NOT NULL AND pl.precio = rec.precio_plan_legacy THEN 0 ELSE 1 END,
                CASE WHEN v_velocidad IS NOT NULL AND i.velocidad = v_velocidad THEN 0 ELSE 1 END,
                pl.id
            LIMIT 1;
        END IF;

        IF v_id_tipificacion IS NULL OR v_id_subtipificacion IS NULL THEN
            v_id_tipificacion := NULL;
            v_id_subtipificacion := NULL;
        END IF;

        INSERT INTO datos_preventa (
            tipo_documento,
            numero_documento_titular_servicio,
            ubigeo_nacimiento,
            nombre_titular_servicio,
            celular_registro,
            celular_referencia,
            correo,
            nombre_madre,
            nombre_padre,
            numero_documento_titular_celular_registro,
            nombre_titular_celular_registro
        ) VALUES (
            rec.tipo_documento_destino,
            rec.numero_documento_destino,
            NULL,
            rec.nombre_titular_destino,
            rec.celular_registro,
            rec.celular_referencia,
            rec.correo,
            NULL,
            NULL,
            rec.numero_documento_destino,
            rec.nombre_titular_destino
        )
        RETURNING id INTO v_id_datos_preventa;

        INSERT INTO direccion (
            ubigeo_domicilio,
            tipo_domicilio,
            tipo_via,
            via,
            direccion,
            referencia,
            latitud,
            longitud,
            urbanizacion,
            numero,
            manzana,
            lote,
            nombre_edificio,
            nombre_condominio,
            plano,
            piso,
            interior
        ) VALUES (
            rec.ubigeo_domicilio,
            NULL,
            NULL,
            NULL,
            rec.direccion_completa,
            CONCAT_WS(' | ',
                NULLIF(rec.campana_legacy, ''),
                NULLIF(rec.telefono_original, '')
            ),
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            rec.numero_piso,
            rec.direccion_interior
        )
        RETURNING id INTO v_id_direccion;

        INSERT INTO lead (
            prefijo,
            lead,
            etapa,
            estado,
            id_asesor_asignado,
            nombre_asesor_asignado,
            id_campana,
            base,
            id_tipificacion,
            codigo_tipificacion,
            id_subtipificacion,
            codigo_subtipificacion,
            id_datos_preventa,
            id_direccion,
            id_plan,
            nombre_plan_snapshot,
            nombre_proveedor_snapshot,
            precio_plan_snapshot,
            id_promocion_interna,
            nombre_promocion_interna_snapshot,
            precio_adicionales_snapshot,
            precio_final,
            created_at,
            last_entry_at,
            updated_at
        ) VALUES (
            '+51',
            rec.numero_lead,
            'PREVENTA',
            CASE
                WHEN v_id_tipificacion IS NOT NULL AND v_id_subtipificacion IS NOT NULL THEN 'GESTIONADO'
                ELSE 'NUEVO'
            END,
            NULL,
            NULL,
            v_id_campana,
            rec.base_destino,
            v_id_tipificacion,
            CASE WHEN v_id_tipificacion IS NOT NULL THEN rec.codigo_tipificacion ELSE NULL END,
            v_id_subtipificacion,
            CASE WHEN v_id_subtipificacion IS NOT NULL THEN rec.codigo_subtipificacion ELSE NULL END,
            v_id_datos_preventa,
            v_id_direccion,
            v_id_plan,
            rec.nombre_plan_snapshot,
            rec.proveedor_destino,
            rec.precio_plan_legacy,
            NULL,
            NULL,
            0,
            COALESCE(rec.precio_plan_legacy, 0),
            rec.created_at_legacy,
            rec.last_entry_at_destino,
            COALESCE(rec.updated_at_legacy, rec.last_entry_at_destino, rec.created_at_legacy)
        )
        RETURNING id INTO v_id_lead;

        INSERT INTO evento (
            id_lead,
            id_campana,
            id_actor,
            nombre_actor,
            rol_actor,
            id_asesor_asignado,
            nombre_asesor_asignado,
            id_plan_ofrecido,
            accion,
            etapa,
            tipificacion,
            subtipificacion,
            fecha_instalacion,
            comentario,
            hora_programada,
            created_at
        ) VALUES (
            v_id_lead,
            v_id_campana,
            NULL,
            'MIGRACION',
            'SEED',
            NULL,
            NULL,
            v_id_plan,
            'REGISTRO',
            'PREVENTA',
            NULL,
            NULL,
            NULL,
            CONCAT(
                'Migrado desde legacy clientes.id=', rec.legacy_cliente_id,
                ', campana=', COALESCE(rec.campana_legacy, 'SIN_CAMPANA'),
                ', proveedor=', COALESCE(rec.proveedor_legacy, rec.proveedor_destino)
            ),
            NULL,
            rec.created_at_legacy
        );

        IF v_id_tipificacion IS NOT NULL AND v_id_subtipificacion IS NOT NULL THEN
            INSERT INTO evento (
                id_lead,
                id_campana,
                id_actor,
                nombre_actor,
                rol_actor,
                id_asesor_asignado,
                nombre_asesor_asignado,
                id_plan_ofrecido,
                accion,
                etapa,
                tipificacion,
                subtipificacion,
                fecha_instalacion,
                comentario,
                hora_programada,
                created_at
            ) VALUES (
                v_id_lead,
                v_id_campana,
                NULL,
                'MIGRACION',
                'SEED',
                NULL,
                NULL,
                v_id_plan,
                'TIPIFICACION',
                'PREVENTA',
                rec.codigo_tipificacion,
                rec.codigo_subtipificacion,
                CASE WHEN rec.codigo_tipificacion = 'AGENDADO' THEN rec.fecha_programacion_legacy ELSE NULL END,
                COALESCE(
                    rec.observaciones_asesor,
                    CONCAT('Migrado desde legacy clientes.id=', rec.legacy_cliente_id)
                ),
                CASE WHEN rec.codigo_tipificacion = 'AGENDADO' THEN TIME '09:00:00' ELSE NULL END,
                rec.last_entry_at_destino
            );
        END IF;
    END LOOP;
END $$;

DROP TABLE seed_legacy_cliente_stage;
DROP TABLE seed_legacy_cliente_raw;

COMMIT;
