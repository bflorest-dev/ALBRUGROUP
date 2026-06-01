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
    SELECT trim(regexp_replace(upper(COALESCE(p_text, '')), '\s+', ' ', 'g'));
$$;

CREATE OR REPLACE FUNCTION pg_temp.seed_plain_text(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT regexp_replace(pg_temp.seed_normalize_text(p_text), '[^A-Z0-9]', '', 'g');
$$;

CREATE OR REPLACE FUNCTION pg_temp.seed_only_digits(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT regexp_replace(COALESCE(p_text, ''), '[^0-9]', '', 'g');
$$;

CREATE OR REPLACE FUNCTION pg_temp.seed_normalize_phone(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    WITH digits AS (
        SELECT pg_temp.seed_only_digits(p_text) AS value
    ),
    candidate AS (
        SELECT
            CASE
                WHEN length(value) >= 9 THEN right(value, 9)
                ELSE value
            END AS value
        FROM digits
    )
    SELECT CASE WHEN value ~ '^9[0-9]{8}$' THEN value ELSE NULL END
    FROM candidate;
$$;

CREATE OR REPLACE FUNCTION pg_temp.seed_valid_name(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN NULLIF(trim(COALESCE(p_text, '')), '') IS NULL THEN NULL
        WHEN pg_temp.seed_normalize_text(p_text) IN ('SIN NOMBRE', 'S/N', 'SN', 'NO REGISTRA') THEN NULL
        WHEN trim(p_text) ~ '[0-9]' THEN NULL
        WHEN length(trim(p_text)) < 3 THEN NULL
        ELSE trim(p_text)
    END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.seed_tipificacion_original(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN pg_temp.seed_normalize_text(p_text) = 'PREVENTA COMPLETA' THEN 'PREVENTA_COMPLETA'
        WHEN pg_temp.seed_normalize_text(p_text) = '7 - VC MES SIGUIENTE' THEN 'PREVENTA_COMPLETA'
        WHEN pg_temp.seed_normalize_text(p_text) IN ('PREVENTA INCOMPLETA', '6 - PREVENTA') THEN 'SCORE_PREVENTA'
        WHEN pg_temp.seed_normalize_text(p_text) = '6 - PDTE SCORE' THEN 'SCORE_PREVENTA'
        WHEN pg_temp.seed_normalize_text(p_text) = '0 - NO CONTESTA' THEN 'SIN_CONTACTO'
        WHEN pg_temp.seed_normalize_text(p_text) = '0 - BUZON' THEN 'SIN_CONTACTO'
        WHEN pg_temp.seed_normalize_text(p_text) LIKE '0 - N% EQUIVOCADO' THEN 'SIN_CONTACTO'
        WHEN pg_temp.seed_normalize_text(p_text) = '0 - FUERA DE SERVICIO' THEN 'SIN_CONTACTO'
        WHEN pg_temp.seed_normalize_text(p_text) = '0 - CORTA LLAMADA' THEN 'SEGUIMIENTO'
        WHEN pg_temp.seed_normalize_text(p_text) = '1 - SEGUIMIENTO' THEN 'SEGUIMIENTO'
        WHEN pg_temp.seed_normalize_text(p_text) = '1 - SOLO INFO' THEN 'SEGUIMIENTO'
        WHEN pg_temp.seed_normalize_text(p_text) LIKE '1 - GESTI% X CHAT' THEN 'SEGUIMIENTO'
        WHEN pg_temp.seed_normalize_text(p_text) = '2 - AGENDADO' THEN 'AGENDADO'
        WHEN pg_temp.seed_normalize_text(p_text) = '2 - FIN DE MES' THEN 'AGENDADO'
        WHEN pg_temp.seed_normalize_text(p_text) LIKE '2 - CONSULTAR% CON FAMILIAR' THEN 'AGENDADO'
        WHEN pg_temp.seed_normalize_text(p_text) = '3 - NO DESEA' THEN 'RECHAZADO'
        WHEN pg_temp.seed_normalize_text(p_text) = '3 - NO CALIFICA' THEN 'RECHAZADO'
        WHEN pg_temp.seed_normalize_text(p_text) LIKE '3 - CON PROGRAMACI%' THEN 'RECHAZADO'
        WHEN pg_temp.seed_normalize_text(p_text) = '3 - VC DESAPROBADA' THEN 'RECHAZADO'
        WHEN pg_temp.seed_normalize_text(p_text) = '3 - ZONA F' THEN 'RECHAZADO'
        WHEN pg_temp.seed_normalize_text(p_text) = '4 - ND PUBLICIDAD' THEN 'REITERADO'
        WHEN pg_temp.seed_normalize_text(p_text) = '4 - DOBLE CLICK' THEN 'REITERADO'
        WHEN pg_temp.seed_normalize_text(p_text) = '5 - SIN COBERTURA' THEN 'SIN_FACILIDADES'
        WHEN pg_temp.seed_normalize_text(p_text) = '5 - SERVICIO ACTIVO' THEN 'SIN_FACILIDADES'
        WHEN pg_temp.seed_normalize_text(p_text) = '5 - EDIFICIO SIN LIBERAR' THEN 'SIN_FACILIDADES'
        WHEN pg_temp.seed_normalize_text(p_text) = '5 - SIN CTO' THEN 'SIN_FACILIDADES'
        WHEN pg_temp.seed_normalize_text(p_text) = '8 - LISTA NEGRA' THEN 'LISTA_NEGRA'
        ELSE NULL
    END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.seed_subtipificacion_original(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN pg_temp.seed_normalize_text(p_text) = 'PREVENTA COMPLETA' THEN 'VENTA_CERRADA'
        WHEN pg_temp.seed_normalize_text(p_text) = '7 - VC MES SIGUIENTE' THEN 'VC_SIGUIENTE_MES'
        WHEN pg_temp.seed_normalize_text(p_text) IN ('PREVENTA INCOMPLETA', '6 - PREVENTA') THEN 'PREVENTA_INCOMPLETA'
        WHEN pg_temp.seed_normalize_text(p_text) = '6 - PDTE SCORE' THEN 'PDTE_SCORE'
        WHEN pg_temp.seed_normalize_text(p_text) = '0 - NO CONTESTA' THEN 'NO_CONTESTA'
        WHEN pg_temp.seed_normalize_text(p_text) = '0 - BUZON' THEN 'BUZON_DE_VOZ'
        WHEN pg_temp.seed_normalize_text(p_text) LIKE '0 - N% EQUIVOCADO' THEN 'NUMERO_EQUIVOCADO'
        WHEN pg_temp.seed_normalize_text(p_text) = '0 - FUERA DE SERVICIO' THEN 'FUERA_DE_SERVICIO'
        WHEN pg_temp.seed_normalize_text(p_text) = '0 - CORTA LLAMADA' THEN 'LLAMADA_INTERRUMPIDA'
        WHEN pg_temp.seed_normalize_text(p_text) = '1 - SEGUIMIENTO' THEN 'SEGUIMIENTO'
        WHEN pg_temp.seed_normalize_text(p_text) = '1 - SOLO INFO' THEN 'SOLO_INFORMACION'
        WHEN pg_temp.seed_normalize_text(p_text) LIKE '1 - GESTI% X CHAT' THEN 'GESTION_CHAT'
        WHEN pg_temp.seed_normalize_text(p_text) = '2 - AGENDADO' THEN 'AGENDADO'
        WHEN pg_temp.seed_normalize_text(p_text) = '2 - FIN DE MES' THEN 'FIN_DE_MES'
        WHEN pg_temp.seed_normalize_text(p_text) LIKE '2 - CONSULTAR% CON FAMILIAR' THEN 'CONSULTARA_CON_FAMILIAR'
        WHEN pg_temp.seed_normalize_text(p_text) = '3 - NO DESEA' THEN 'NO_DESEA'
        WHEN pg_temp.seed_normalize_text(p_text) = '3 - NO CALIFICA' THEN 'NO_CALIFICA'
        WHEN pg_temp.seed_normalize_text(p_text) LIKE '3 - CON PROGRAMACI%' THEN 'CON_PROGRAMACION'
        WHEN pg_temp.seed_normalize_text(p_text) = '3 - VC DESAPROBADA' THEN 'VC_DESAPROBADA'
        WHEN pg_temp.seed_normalize_text(p_text) = '3 - ZONA F' THEN 'ZONA_FRAUDE'
        WHEN pg_temp.seed_normalize_text(p_text) = '4 - ND PUBLICIDAD' THEN 'ND_PUBLICIDAD'
        WHEN pg_temp.seed_normalize_text(p_text) = '4 - DOBLE CLICK' THEN 'DOBLE_CLICK'
        WHEN pg_temp.seed_normalize_text(p_text) = '5 - SIN COBERTURA' THEN 'SIN_COBERTURA'
        WHEN pg_temp.seed_normalize_text(p_text) = '5 - SERVICIO ACTIVO' THEN 'SERVICIO_ACTIVO'
        WHEN pg_temp.seed_normalize_text(p_text) = '5 - EDIFICIO SIN LIBERAR' THEN 'EDIFICIO_SIN_LIBERAR'
        WHEN pg_temp.seed_normalize_text(p_text) = '5 - SIN CTO' THEN 'SIN_CTO'
        WHEN pg_temp.seed_normalize_text(p_text) = '8 - LISTA NEGRA' THEN 'BLACKLIST'
        ELSE NULL
    END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.seed_tipificacion_final(p_categoria TEXT, p_subcategoria TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'PREVENTA COMPLETA'
             AND pg_temp.seed_normalize_text(p_subcategoria) IN ('VENTA CERRADA', 'RECHAZADO') THEN 'PREVENTA_COMPLETA'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'PREVENTA INCOMPLETA'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'PREVENTA INCOMPLETA' THEN 'SCORE_PREVENTA'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SIN CONTACTO'
             AND (
                pg_temp.seed_normalize_text(p_subcategoria) IN ('NO CONTESTA', 'FUERA DE SERVICIO', 'CORTA LLAMADA')
                OR pg_temp.seed_normalize_text(p_subcategoria) LIKE 'BUZ%'
                OR pg_temp.seed_normalize_text(p_subcategoria) LIKE 'N% EQUIVOCADO'
             ) THEN CASE
                WHEN pg_temp.seed_normalize_text(p_subcategoria) = 'CORTA LLAMADA' THEN 'SEGUIMIENTO'
                ELSE 'SIN_CONTACTO'
             END
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SIN FACILIDADES'
             AND pg_temp.seed_normalize_text(p_subcategoria) IN ('SIN COBERTURA', 'SERVICIO ACTIVO', 'EDIFICIO SIN LIBERAR', 'SIN CTO') THEN 'SIN_FACILIDADES'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SEGUIMIENTO'
             AND (
                pg_temp.seed_normalize_text(p_subcategoria) IN ('SEGUIMIENTO', 'SOLO INFO', 'LLAMADA INTERRUMPIDA')
                OR pg_temp.seed_normalize_text(p_subcategoria) LIKE 'GESTI% O CHAT'
                OR pg_temp.seed_normalize_text(p_subcategoria) LIKE 'LLAMAR% DESPU%'
             ) THEN 'SEGUIMIENTO'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'AGENDADO'
             AND (
                pg_temp.seed_normalize_text(p_subcategoria) IN ('AGENDADO', 'FIN DE MES')
                OR pg_temp.seed_normalize_text(p_subcategoria) LIKE 'CONSULTAR% CON FAMILIAR'
             ) THEN 'AGENDADO'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'RECHAZADO'
             AND (
                pg_temp.seed_normalize_text(p_subcategoria) IN ('NO DESEA', 'NO CALIFICA', 'VENTA CERRADA DESAPROBADA', 'ZONA FRAUDE')
                OR pg_temp.seed_normalize_text(p_subcategoria) LIKE 'CON PROGRAMACI%'
             ) THEN 'RECHAZADO'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'RETIRADO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'NO DESEA PUBLICIDAD' THEN 'REITERADO'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'LISTA NEGRA' THEN 'LISTA_NEGRA'
        ELSE NULL
    END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.seed_subtipificacion_final(p_categoria TEXT, p_subcategoria TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'PREVENTA COMPLETA'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'VENTA CERRADA' THEN 'VENTA_CERRADA'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'PREVENTA COMPLETA'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'RECHAZADO' THEN 'VENTA_CERRADA'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'PREVENTA INCOMPLETA'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'PREVENTA INCOMPLETA' THEN 'PREVENTA_INCOMPLETA'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SIN CONTACTO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'NO CONTESTA' THEN 'NO_CONTESTA'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SIN CONTACTO'
             AND pg_temp.seed_normalize_text(p_subcategoria) LIKE 'BUZ%' THEN 'BUZON_DE_VOZ'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SIN CONTACTO'
             AND pg_temp.seed_normalize_text(p_subcategoria) LIKE 'N% EQUIVOCADO' THEN 'NUMERO_EQUIVOCADO'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SIN CONTACTO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'FUERA DE SERVICIO' THEN 'FUERA_DE_SERVICIO'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SIN CONTACTO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'CORTA LLAMADA' THEN 'LLAMADA_INTERRUMPIDA'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SIN FACILIDADES'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'SIN COBERTURA' THEN 'SIN_COBERTURA'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SIN FACILIDADES'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'SERVICIO ACTIVO' THEN 'SERVICIO_ACTIVO'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SIN FACILIDADES'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'EDIFICIO SIN LIBERAR' THEN 'EDIFICIO_SIN_LIBERAR'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SIN FACILIDADES'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'SIN CTO' THEN 'SIN_CTO'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SEGUIMIENTO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'SEGUIMIENTO' THEN 'SEGUIMIENTO'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SEGUIMIENTO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'SOLO INFO' THEN 'SOLO_INFORMACION'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SEGUIMIENTO'
             AND pg_temp.seed_normalize_text(p_subcategoria) LIKE 'GESTI% O CHAT' THEN 'GESTION_CHAT'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SEGUIMIENTO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'LLAMADA INTERRUMPIDA' THEN 'LLAMADA_INTERRUMPIDA'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'SEGUIMIENTO'
             AND pg_temp.seed_normalize_text(p_subcategoria) LIKE 'LLAMAR% DESPU%' THEN 'SEGUIMIENTO'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'AGENDADO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'AGENDADO' THEN 'AGENDADO'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'AGENDADO'
             AND pg_temp.seed_normalize_text(p_subcategoria) LIKE 'CONSULTAR% CON FAMILIAR' THEN 'CONSULTARA_CON_FAMILIAR'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'AGENDADO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'FIN DE MES' THEN 'FIN_DE_MES'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'RECHAZADO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'NO DESEA' THEN 'NO_DESEA'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'RECHAZADO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'NO CALIFICA' THEN 'NO_CALIFICA'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'RECHAZADO'
             AND pg_temp.seed_normalize_text(p_subcategoria) LIKE 'CON PROGRAMACI%' THEN 'CON_PROGRAMACION'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'RECHAZADO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'VENTA CERRADA DESAPROBADA' THEN 'VC_DESAPROBADA'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'RECHAZADO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'ZONA FRAUDE' THEN 'ZONA_FRAUDE'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'RETIRADO'
             AND pg_temp.seed_normalize_text(p_subcategoria) = 'NO DESEA PUBLICIDAD' THEN 'ND_PUBLICIDAD'
        WHEN pg_temp.seed_normalize_text(p_categoria) = 'LISTA NEGRA' THEN 'BLACKLIST'
        ELSE NULL
    END;
$$;

CREATE TEMP TABLE seed_geo_distrito_departamento AS
SELECT
    pg_temp.seed_plain_text(dep.nombre) AS departamento_key,
    pg_temp.seed_plain_text(dis.nombre) AS distrito_key,
    min(dis.codigo) AS codigo,
    count(*) AS matches
FROM distrito dis
JOIN departamento dep ON dep.id = dis.departamento_id
GROUP BY pg_temp.seed_plain_text(dep.nombre), pg_temp.seed_plain_text(dis.nombre);

CREATE TEMP TABLE seed_geo_distrito_unico AS
SELECT
    pg_temp.seed_plain_text(nombre) AS distrito_key,
    min(codigo) AS codigo,
    count(*) AS matches
FROM distrito
GROUP BY pg_temp.seed_plain_text(nombre);

CREATE TEMP TABLE seed_legacy_cliente_mapped AS
WITH raw_normalized AS (
    SELECT
        NULLIF(TRIM(id), '')::BIGINT AS legacy_cliente_id,
        pg_temp.seed_normalize_phone(telefono) AS numero_lead,
        COALESCE(NULLIF(TRIM(telefono), ''), NULLIF(TRIM(leads_original_telefono), '')) AS telefono_original,
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
            WHEN pg_temp.seed_plain_text(compania) LIKE '%WIN%' THEN 'WIN'
            WHEN pg_temp.seed_plain_text(compania) LIKE '%CLARO%' THEN 'CLARO'
            WHEN pg_temp.seed_plain_text(compania) LIKE '%PERUFIBRA%' THEN 'PERUFIBRA'
            WHEN pg_temp.seed_plain_text(compania) LIKE '%PERFIBRA%' THEN 'PERUFIBRA'
            WHEN pg_temp.seed_plain_text(compania) = '' THEN 'WIN'
            ELSE pg_temp.seed_plain_text(compania)
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
        COALESCE(
            NULLIF(regexp_replace(COALESCE(dni, ''), '[^0-9A-Za-z]', '', 'g'), ''),
            CASE
                WHEN regexp_replace(TRIM(COALESCE(dni_nombre_titular, '')), '\s', '', 'g') ~ '^[0-9]{8,11}$'
                    THEN regexp_replace(TRIM(dni_nombre_titular), '\s', '', 'g')
                WHEN TRIM(COALESCE(dni_nombre_titular, '')) ~ '^[0-9A-Za-z]{8,11}\s+.+$'
                    THEN regexp_replace(split_part(TRIM(dni_nombre_titular), ' ', 1), '[^0-9A-Za-z]', '', 'g')
                ELSE NULL
            END
        ) AS numero_documento,
        COALESCE(
            CASE
                WHEN TRIM(COALESCE(dni_nombre_titular, '')) ~ '^[0-9A-Za-z]{8,11}\s+.+$'
                    THEN pg_temp.seed_valid_name(regexp_replace(TRIM(dni_nombre_titular), '^[0-9A-Za-z]{8,11}\s+', ''))
                ELSE pg_temp.seed_valid_name(dni_nombre_titular)
            END,
            pg_temp.seed_valid_name(nombre)
        ) AS nombre_titular_documento,
        pg_temp.seed_normalize_phone(telefono_registro) AS celular_registro,
        pg_temp.seed_normalize_phone(telefono_referencia_wizard) AS celular_referencia,
        CASE
            WHEN COALESCE(correo_electronico, '') ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
                THEN lower(TRIM(correo_electronico))
            ELSE NULL
        END AS correo,
        CASE
            WHEN NULLIF(TRIM(direccion_completa), '') IS NOT NULL THEN TRIM(direccion_completa)
            ELSE NULL
        END AS direccion_completa,
        NULLIF(TRIM(direccion_interior), '') AS direccion_interior,
        NULLIF(TRIM(numero_piso_wizard), '') AS numero_piso,
        pg_temp.seed_plain_text(departamento) AS departamento_key,
        pg_temp.seed_plain_text(distrito) AS distrito_key,
        CASE
            WHEN NULLIF(TRIM(distrito), '') ~ '^[0-9]{6}$' THEN TRIM(distrito)
            ELSE NULL
        END AS ubigeo_domicilio_directo,
        NULLIF(TRIM(tipo_plan), '') AS tipo_plan_legacy,
        NULLIF(TRIM(servicio_contratado), '') AS servicio_contratado_legacy,
        NULLIF(TRIM(velocidad_contratada), '') AS velocidad_contratada_legacy,
        CASE
            WHEN NULLIF(TRIM(precio_plan), '') ~ '^[0-9]+(\.[0-9]+)?$' THEN TRIM(precio_plan)::NUMERIC(10,2)
            ELSE NULL
        END AS precio_plan_legacy,
        pg_temp.seed_tipificacion_original(tipificacion_original) AS original_codigo_tipificacion,
        pg_temp.seed_subtipificacion_original(tipificacion_original) AS original_codigo_subtipificacion,
        pg_temp.seed_tipificacion_final(estatus_comercial_categoria, estatus_comercial_subcategoria) AS legacy_codigo_tipificacion,
        pg_temp.seed_subtipificacion_final(estatus_comercial_categoria, estatus_comercial_subcategoria) AS legacy_codigo_subtipificacion
    FROM seed_legacy_cliente_raw
),
with_ubigeo AS (
    SELECT
        r.*,
        COALESCE(
            r.ubigeo_domicilio_directo,
            CASE WHEN gd.matches = 1 THEN gd.codigo ELSE NULL END,
            CASE WHEN gu.matches = 1 THEN gu.codigo ELSE NULL END
        ) AS ubigeo_domicilio
    FROM raw_normalized r
    LEFT JOIN seed_geo_distrito_departamento gd
      ON gd.departamento_key = r.departamento_key
     AND gd.distrito_key = r.distrito_key
    LEFT JOIN seed_geo_distrito_unico gu
      ON gu.distrito_key = r.distrito_key
    WHERE r.numero_lead IS NOT NULL
)
SELECT
    *,
    COALESCE(legacy_codigo_tipificacion, original_codigo_tipificacion) AS final_codigo_tipificacion,
    COALESCE(legacy_codigo_subtipificacion, original_codigo_subtipificacion) AS final_codigo_subtipificacion,
    COALESCE(last_activity_legacy, updated_at_legacy, created_at_legacy) AS last_entry_at_destino,
    NULLIF(CONCAT_WS(' | ', tipo_plan_legacy, servicio_contratado_legacy, velocidad_contratada_legacy), '') AS nombre_plan_snapshot
FROM with_ubigeo;

CREATE TEMP TABLE seed_legacy_tip_first AS
SELECT DISTINCT ON (numero_lead)
    numero_lead,
    original_codigo_tipificacion AS primera_codigo_tipificacion,
    original_codigo_subtipificacion AS primera_codigo_subtipificacion,
    COALESCE(created_at_legacy, last_entry_at_destino) AS primera_tipificacion_at,
    tipificacion_original_normalizada
FROM seed_legacy_cliente_mapped
WHERE original_codigo_tipificacion IS NOT NULL
  AND original_codigo_subtipificacion IS NOT NULL
ORDER BY numero_lead, COALESCE(created_at_legacy, last_entry_at_destino), legacy_cliente_id;

CREATE TEMP TABLE seed_legacy_tip_final AS
SELECT DISTINCT ON (numero_lead)
    numero_lead,
    final_codigo_tipificacion AS codigo_tipificacion,
    final_codigo_subtipificacion AS codigo_subtipificacion,
    last_entry_at_destino AS tipificacion_at,
    observaciones_asesor,
    fecha_programacion_legacy
FROM seed_legacy_cliente_mapped
WHERE final_codigo_tipificacion IS NOT NULL
  AND final_codigo_subtipificacion IS NOT NULL
ORDER BY numero_lead, last_entry_at_destino DESC, legacy_cliente_id DESC;

CREATE TEMP TABLE seed_legacy_cliente_stage AS
WITH ranked AS (
    SELECT
        m.*,
        ROW_NUMBER() OVER (
            PARTITION BY m.numero_lead
            ORDER BY
                CASE WHEN m.final_codigo_tipificacion IS NOT NULL AND m.final_codigo_subtipificacion IS NOT NULL THEN 1 ELSE 0 END DESC,
                CASE
                    WHEN m.numero_documento IS NOT NULL
                      OR m.nombre_titular_documento IS NOT NULL
                      OR m.direccion_completa IS NOT NULL
                      OR m.correo IS NOT NULL
                      OR m.nombre_plan_snapshot IS NOT NULL
                      OR m.precio_plan_legacy IS NOT NULL
                    THEN 1
                    ELSE 0
                END DESC,
                m.last_entry_at_destino DESC,
                m.legacy_cliente_id DESC
        ) AS rn
    FROM seed_legacy_cliente_mapped m
),
canonical AS (
    SELECT *
    FROM ranked
    WHERE rn = 1
)
SELECT
    c.legacy_cliente_id,
    c.numero_lead,
    c.telefono_original,
    c.base_destino,
    c.proveedor_destino,
    c.campana_legacy,
    c.proveedor_legacy,
    c.created_at_legacy,
    c.updated_at_legacy,
    c.last_activity_legacy,
    c.last_entry_at_destino,
    c.fecha_programacion_legacy,
    c.categoria_legacy_normalizada,
    c.subcategoria_legacy_normalizada,
    c.tipificacion_original_normalizada,
    c.observaciones_asesor,
    CASE
        WHEN c.tipo_documento_legacy = 'DNI' THEN 'DNI'
        WHEN c.tipo_documento_legacy = 'CE' THEN 'CE'
        WHEN c.tipo_documento_legacy = 'RUC' THEN 'RUC'
        WHEN c.numero_documento ~ '^[0-9]{8}$' THEN 'DNI'
        WHEN c.numero_documento ~ '^[0-9]{11}$' THEN 'RUC'
        ELSE NULL
    END AS tipo_documento_destino,
    CASE
        WHEN c.numero_documento ~ '^[0-9A-Za-z]{8,11}$' THEN c.numero_documento
        ELSE NULL
    END AS numero_documento_destino,
    c.nombre_titular_documento AS nombre_titular_destino,
    c.celular_registro,
    c.celular_referencia,
    c.correo,
    c.direccion_completa,
    c.direccion_interior,
    c.numero_piso,
    c.ubigeo_domicilio,
    c.nombre_plan_snapshot,
    c.precio_plan_legacy,
    COALESCE(tf.primera_codigo_tipificacion, tfin.codigo_tipificacion) AS primera_codigo_tipificacion,
    COALESCE(tf.primera_codigo_subtipificacion, tfin.codigo_subtipificacion) AS primera_codigo_subtipificacion,
    COALESCE(tf.primera_tipificacion_at, tfin.tipificacion_at) AS primera_tipificacion_at,
    tfin.codigo_tipificacion,
    tfin.codigo_subtipificacion,
    tfin.tipificacion_at,
    tfin.observaciones_asesor AS observaciones_final,
    tfin.fecha_programacion_legacy AS fecha_programacion_final,
    CASE
        WHEN tfin.codigo_tipificacion = 'PREVENTA_COMPLETA'
         AND tfin.codigo_subtipificacion = 'VENTA_CERRADA' THEN 'VENTA'
        ELSE 'PREVENTA'
    END AS etapa_destino,
    CASE
        WHEN tfin.codigo_tipificacion IS NOT NULL AND tfin.codigo_subtipificacion IS NOT NULL THEN 'GESTIONADO'
        ELSE 'NUEVO'
    END AS estado_destino
FROM canonical c
LEFT JOIN seed_legacy_tip_first tf ON tf.numero_lead = c.numero_lead
LEFT JOIN seed_legacy_tip_final tfin ON tfin.numero_lead = c.numero_lead;

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
    v_total_raw BIGINT;
    v_total_valid BIGINT;
    v_total_stage BIGINT;
    v_descartados BIGINT;
    v_preventa BIGINT;
    v_venta BIGINT;
    v_con_datos_preventa BIGINT;
    v_con_direccion BIGINT;
    v_con_tipificacion BIGINT;
    v_doble_tipificacion BIGINT;
BEGIN
    SELECT count(*) INTO v_total_raw FROM seed_legacy_cliente_raw;
    SELECT count(*) INTO v_total_valid FROM seed_legacy_cliente_mapped;
    SELECT count(*) INTO v_total_stage FROM seed_legacy_cliente_stage;
    v_descartados := v_total_raw - v_total_valid;

    SELECT count(*) INTO v_preventa FROM seed_legacy_cliente_stage WHERE etapa_destino = 'PREVENTA';
    SELECT count(*) INTO v_venta FROM seed_legacy_cliente_stage WHERE etapa_destino = 'VENTA';
    SELECT count(*) INTO v_con_datos_preventa
    FROM seed_legacy_cliente_stage
    WHERE tipo_documento_destino IS NOT NULL
       OR numero_documento_destino IS NOT NULL
       OR nombre_titular_destino IS NOT NULL
       OR celular_registro IS NOT NULL
       OR celular_referencia IS NOT NULL
       OR correo IS NOT NULL;
    SELECT count(*) INTO v_con_direccion
    FROM seed_legacy_cliente_stage
    WHERE ubigeo_domicilio IS NOT NULL
       OR direccion_completa IS NOT NULL
       OR direccion_interior IS NOT NULL
       OR numero_piso IS NOT NULL;
    SELECT count(*) INTO v_con_tipificacion
    FROM seed_legacy_cliente_stage
    WHERE codigo_tipificacion IS NOT NULL
      AND codigo_subtipificacion IS NOT NULL;
    SELECT count(*) INTO v_doble_tipificacion
    FROM seed_legacy_cliente_stage
    WHERE primera_codigo_tipificacion IS NOT NULL
      AND primera_codigo_subtipificacion IS NOT NULL
      AND codigo_tipificacion IS NOT NULL
      AND codigo_subtipificacion IS NOT NULL
      AND (primera_codigo_tipificacion, primera_codigo_subtipificacion)
          IS DISTINCT FROM (codigo_tipificacion, codigo_subtipificacion);

    RAISE NOTICE 'Auditoria migracion legacy: raw=%, validos=%, descartados_por_telefono=%, leads_unicos=%',
        v_total_raw, v_total_valid, v_descartados, v_total_stage;
    RAISE NOTICE 'Auditoria migracion legacy: preventa=%, venta=%, con_datos_preventa=%, con_direccion=%',
        v_preventa, v_venta, v_con_datos_preventa, v_con_direccion;
    RAISE NOTICE 'Auditoria migracion legacy: con_tipificacion=%, con_doble_tipificacion=%',
        v_con_tipificacion, v_doble_tipificacion;
END $$;

DO $$
DECLARE
    rec RECORD;
    v_id_campana BIGINT;
    v_id_campana_base BIGINT;
    v_id_datos_preventa BIGINT;
    v_id_direccion BIGINT;
    v_id_lead BIGINT;
    v_id_tipificacion BIGINT;
    v_id_subtipificacion BIGINT;
    v_crear_datos_preventa BOOLEAN;
    v_crear_direccion BOOLEAN;
BEGIN
    SELECT c.id
    INTO v_id_campana_base
    FROM campana c
    WHERE UPPER(TRIM(c.nombre)) = 'BASE'
    ORDER BY CASE WHEN c.activo THEN 0 ELSE 1 END, c.id
    LIMIT 1;

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

        SELECT c.id
        INTO v_id_campana
        FROM campana c
        JOIN proveedor p ON p.id = c.id_proveedor
        WHERE UPPER(TRIM(p.nombre)) = UPPER(TRIM(rec.proveedor_destino))
        ORDER BY CASE WHEN c.activo THEN 0 ELSE 1 END, c.id
        LIMIT 1;

        v_id_campana := COALESCE(v_id_campana, v_id_campana_base);

        v_id_tipificacion := NULL;
        v_id_subtipificacion := NULL;

        IF rec.etapa_destino = 'PREVENTA' AND rec.codigo_tipificacion IS NOT NULL THEN
            SELECT t.id
            INTO v_id_tipificacion
            FROM tipificacion t
            WHERE t.etapa = 'PREVENTA'
              AND t.codigo = rec.codigo_tipificacion
              AND t.activo IS TRUE
            ORDER BY t.id
            LIMIT 1;
        END IF;

        IF v_id_tipificacion IS NOT NULL AND rec.codigo_subtipificacion IS NOT NULL THEN
            SELECT s.id
            INTO v_id_subtipificacion
            FROM subtipificacion s
            WHERE s.tipificacion_id = v_id_tipificacion
              AND s.codigo = rec.codigo_subtipificacion
              AND s.activo IS TRUE
            ORDER BY s.id
            LIMIT 1;
        END IF;

        IF v_id_tipificacion IS NULL OR v_id_subtipificacion IS NULL THEN
            v_id_tipificacion := NULL;
            v_id_subtipificacion := NULL;
        END IF;

        v_crear_datos_preventa :=
            rec.tipo_documento_destino IS NOT NULL
            OR rec.numero_documento_destino IS NOT NULL
            OR rec.nombre_titular_destino IS NOT NULL
            OR rec.celular_registro IS NOT NULL
            OR rec.celular_referencia IS NOT NULL
            OR rec.correo IS NOT NULL;

        v_crear_direccion :=
            rec.ubigeo_domicilio IS NOT NULL
            OR rec.direccion_completa IS NOT NULL
            OR rec.direccion_interior IS NOT NULL
            OR rec.numero_piso IS NOT NULL;

        v_id_datos_preventa := NULL;
        v_id_direccion := NULL;

        IF v_crear_datos_preventa THEN
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
        END IF;

        IF v_crear_direccion THEN
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
                NULL,
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
        END IF;

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
            primera_codigo_tipificacion,
            primera_codigo_subtipificacion,
            numero_documento_titular_servicio_snapshot,
            direccion_snapshot,
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
            dia_corte_facturacion,
            meses_permanencia_snapshot,
            estado_postventa,
            created_at,
            last_entry_at,
            updated_at
        ) VALUES (
            '+51',
            rec.numero_lead,
            rec.etapa_destino,
            rec.estado_destino,
            NULL,
            NULL,
            v_id_campana,
            rec.base_destino,
            v_id_tipificacion,
            CASE WHEN v_id_tipificacion IS NOT NULL THEN rec.codigo_tipificacion ELSE NULL END,
            v_id_subtipificacion,
            CASE WHEN v_id_subtipificacion IS NOT NULL THEN rec.codigo_subtipificacion ELSE NULL END,
            rec.primera_codigo_tipificacion,
            rec.primera_codigo_subtipificacion,
            rec.numero_documento_destino,
            rec.direccion_completa,
            v_id_datos_preventa,
            v_id_direccion,
            NULL,
            rec.nombre_plan_snapshot,
            rec.proveedor_destino,
            rec.precio_plan_legacy,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
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
            'MIGRACION',
            NULL,
            'MIGRACION',
            NULL,
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

        IF rec.primera_codigo_tipificacion IS NOT NULL
           AND rec.primera_codigo_subtipificacion IS NOT NULL THEN
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
                'MIGRACION',
                NULL,
                'MIGRACION',
                NULL,
                'TIPIFICACION',
                'PREVENTA',
                rec.primera_codigo_tipificacion,
                rec.primera_codigo_subtipificacion,
                NULL,
                CONCAT(
                    'Primera tipificacion legacy',
                    CASE
                        WHEN rec.tipificacion_original_normalizada IS NOT NULL AND rec.tipificacion_original_normalizada <> ''
                        THEN CONCAT(': ', rec.tipificacion_original_normalizada)
                        ELSE ''
                    END
                ),
                CASE WHEN rec.primera_codigo_tipificacion = 'AGENDADO' THEN TIME '09:00:00' ELSE NULL END,
                COALESCE(rec.primera_tipificacion_at, rec.created_at_legacy)
            );
        END IF;

        IF rec.codigo_tipificacion IS NOT NULL
           AND rec.codigo_subtipificacion IS NOT NULL
           AND (
                rec.primera_codigo_tipificacion IS NULL
                OR rec.primera_codigo_subtipificacion IS NULL
                OR (rec.primera_codigo_tipificacion, rec.primera_codigo_subtipificacion)
                   IS DISTINCT FROM (rec.codigo_tipificacion, rec.codigo_subtipificacion)
           ) THEN
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
                'MIGRACION',
                NULL,
                'MIGRACION',
                NULL,
                'TIPIFICACION',
                'PREVENTA',
                rec.codigo_tipificacion,
                rec.codigo_subtipificacion,
                NULL,
                COALESCE(
                    rec.observaciones_final,
                    CONCAT(
                        'Ultima tipificacion legacy desde clientes.id=', rec.legacy_cliente_id,
                        CASE
                            WHEN rec.fecha_programacion_final IS NOT NULL
                            THEN CONCAT(', fecha_programacion=', rec.fecha_programacion_final)
                            ELSE ''
                        END
                    )
                ),
                CASE WHEN rec.codigo_tipificacion = 'AGENDADO' THEN TIME '09:00:00' ELSE NULL END,
                COALESCE(rec.tipificacion_at, rec.last_entry_at_destino)
            );
        END IF;
    END LOOP;
END $$;

DROP TABLE seed_legacy_cliente_stage;
DROP TABLE seed_legacy_tip_final;
DROP TABLE seed_legacy_tip_first;
DROP TABLE seed_legacy_cliente_mapped;
DROP TABLE seed_geo_distrito_unico;
DROP TABLE seed_geo_distrito_departamento;
DROP TABLE seed_legacy_cliente_raw;

COMMIT;
