\set ON_ERROR_STOP on

-- Backfill POSTVENTA 2026-08-01 / Script 10
-- Objetivo: corregir referidos WIN que avanzaron organicamente con el numero original.
-- El registro organico conserva el historial y recibe la identidad/estructura del referido.
-- El registro creado por backfill queda como el lead original en PREVENTA NO DESEA.

BEGIN;

CREATE TEMP TABLE tmp_ref_pairs (
    org_id bigint PRIMARY KEY,
    back_id bigint NOT NULL UNIQUE,
    lead_original text NOT NULL,
    lead_referido text NOT NULL,
    documento text NOT NULL,
    excel_ref text NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_ref_pairs (org_id, back_id, lead_original, lead_referido, documento, excel_ref) VALUES
    (27590, 30081, '999259900', '933443348', '004711821', 'POSTVENTA_ALBRU2.xlsx 26JUL fila 11'),
    (27210, 30089, '989145791', '982347106', '07589883',  'POSTVENTA_ALBRU2.xlsx 26JUN fila 264'),
    (27360, 30090, '978236396', '906332922', '08119351',  'POSTVENTA_ALBRU2.xlsx 26JUN fila 279'),
    (27709, 27785, '988010827', '992943824', '43307733',  'POSTVENTA_ALBRU2.xlsx 26JUL fila 26'),
    (27844, 30084, '948161882', '951192491', '44597466',  'POSTVENTA_ALBRU2.xlsx 26JUL fila 61');

CREATE TEMP TABLE tmp_ref_metrics (
    metric text PRIMARY KEY,
    value integer NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE tmp_ref_snapshot AS
WITH evento_counts AS (
    SELECT
        id_lead,
        count(*) AS eventos_total,
        count(*) FILTER (WHERE etapa IN ('VENTA', 'POSTVENTA', 'COBRANZA')) AS eventos_avance
    FROM evento
    GROUP BY id_lead
), rel_counts AS (
    SELECT
        p.org_id,
        p.back_id,
        count(DISTINCT cal_org.id) AS org_calendarios,
        count(DISTINCT per_org.id) AS org_periodos,
        count(DISTINCT pag_org.id) AS org_pagos,
        count(DISTINCT cal_back.id) AS back_calendarios,
        count(DISTINCT per_back.id) AS back_periodos,
        count(DISTINCT pag_back.id) AS back_pagos
    FROM tmp_ref_pairs p
    LEFT JOIN calendario_facturacion_postventa cal_org ON cal_org.id_lead = p.org_id
    LEFT JOIN periodo_facturacion_postventa per_org ON per_org.id_lead = p.org_id
    LEFT JOIN pago_postventa pag_org ON pag_org.id_lead = p.org_id
    LEFT JOIN calendario_facturacion_postventa cal_back ON cal_back.id_lead = p.back_id
    LEFT JOIN periodo_facturacion_postventa per_back ON per_back.id_lead = p.back_id
    LEFT JOIN pago_postventa pag_back ON pag_back.id_lead = p.back_id
    GROUP BY p.org_id, p.back_id
)
SELECT
    p.*,
    org.lead AS org_lead_actual,
    org.etapa AS org_etapa,
    org.estado AS org_estado,
    org.base AS org_base,
    org.id_campana AS org_id_campana,
    org.id_equipo AS org_id_equipo,
    org.id_asesor_asignado AS org_id_asesor_asignado,
    org.nombre_asesor_asignado AS org_nombre_asesor_asignado,
    org.id_contacto AS org_id_contacto,
    org.id_datos_preventa AS org_id_datos_preventa,
    org.id_direccion AS org_id_direccion,
    org.id_plan AS org_id_plan,
    org.numero_documento_titular_servicio_snapshot AS org_documento_snapshot,
    org.created_at AS org_created_at,
    org.last_entry_at AS org_last_entry_at,
    back.lead AS back_lead_actual,
    back.etapa AS back_etapa,
    back.estado AS back_estado,
    back.base AS back_base,
    back.id_campana AS back_id_campana,
    back.id_equipo AS back_id_equipo,
    back.id_asesor_asignado AS back_id_asesor_asignado,
    back.nombre_asesor_asignado AS back_nombre_asesor_asignado,
    back.id_contacto AS back_id_contacto,
    back.id_datos_preventa AS back_id_datos_preventa,
    back.id_direccion AS back_id_direccion,
    back.id_plan AS back_id_plan,
    back.id_promocion_interna AS back_id_promocion_interna,
    back.nombre_promocion_interna_snapshot AS back_nombre_promocion_interna_snapshot,
    back.precio_adicionales_snapshot AS back_precio_adicionales_snapshot,
    back.nombre_plan_snapshot AS back_nombre_plan_snapshot,
    back.nombre_proveedor_snapshot AS back_nombre_proveedor_snapshot,
    back.precio_plan_snapshot AS back_precio_plan_snapshot,
    back.precio_final AS back_precio_final,
    back.dia_corte_facturacion AS back_dia_corte_facturacion,
    back.meses_permanencia_snapshot AS back_meses_permanencia_snapshot,
    back.numero_documento_titular_servicio_snapshot AS back_documento_snapshot,
    back.direccion_snapshot AS back_direccion_snapshot,
    back.sec AS back_sec,
    back.sot AS back_sot,
    back.id_plataforma_digital_ofrecida AS back_id_plataforma_digital_ofrecida,
    back.estado_cliente_postventa AS back_estado_cliente_postventa,
    org_ct.lead AS org_contacto_lead,
    back_ct.lead AS back_contacto_lead,
    org_dp.numero_documento_titular_servicio AS org_dp_documento,
    org_dp.nombre_titular_servicio AS org_dp_nombre,
    org_dp.celular_registro AS org_celular_registro,
    org_dp.celular_referencia AS org_celular_referencia,
    back_dp.numero_documento_titular_servicio AS back_dp_documento,
    back_dp.nombre_titular_servicio AS back_dp_nombre,
    coalesce(org_ev.eventos_total, 0) AS org_eventos_total,
    coalesce(back_ev.eventos_total, 0) AS back_eventos_total,
    coalesce(back_ev.eventos_avance, 0) AS back_eventos_avance,
    rc.org_calendarios,
    rc.org_periodos,
    rc.org_pagos,
    rc.back_calendarios,
    rc.back_periodos,
    rc.back_pagos
FROM tmp_ref_pairs p
LEFT JOIN lead org ON org.id = p.org_id
LEFT JOIN lead back ON back.id = p.back_id
LEFT JOIN contacto org_ct ON org_ct.id = org.id_contacto
LEFT JOIN contacto back_ct ON back_ct.id = back.id_contacto
LEFT JOIN datos_preventa org_dp ON org_dp.id = org.id_datos_preventa
LEFT JOIN datos_preventa back_dp ON back_dp.id = back.id_datos_preventa
LEFT JOIN evento_counts org_ev ON org_ev.id_lead = org.id
LEFT JOIN evento_counts back_ev ON back_ev.id_lead = back.id
LEFT JOIN rel_counts rc ON rc.org_id = p.org_id AND rc.back_id = p.back_id;

DO $$
DECLARE
    v_total integer;
    v_final integer;
    v_initial integer;
    v_bad integer;
BEGIN
    SELECT count(*) INTO v_total FROM tmp_ref_snapshot;
    IF v_total <> 5 THEN
        RAISE EXCEPTION 'Script 10 abortado: pares esperados=5, encontrados=%', v_total;
    END IF;

    WITH estados AS (
        SELECT
            *,
            (
                org_lead_actual = lead_referido
                AND back_lead_actual = lead_original
                AND org_contacto_lead = lead_referido
                AND back_contacto_lead = lead_original
                AND org_etapa IN ('POSTVENTA', 'COBRANZA')
                AND org_base = 'REFERIDO'
                AND org_id_campana IS NULL
                AND org_calendarios = 1
                AND org_periodos > 0
                AND back_etapa = 'PREVENTA'
                AND back_calendarios = 0
                AND back_periodos = 0
                AND back_pagos = 0
            ) AS final_ok,
            (
                org_lead_actual = lead_original
                AND back_lead_actual = lead_referido
                AND org_contacto_lead = lead_original
                AND back_contacto_lead = lead_referido
                AND org_etapa = 'POSTVENTA'
                AND org_eventos_total > 0
                AND org_calendarios = 0
                AND org_periodos = 0
                AND org_pagos = 0
                AND back_calendarios = 1
                AND back_periodos > 0
                AND back_eventos_avance = 0
                AND regexp_replace(coalesce(org_documento_snapshot, org_dp_documento, ''), '^0+', '', 'g')
                    = regexp_replace(coalesce(back_documento_snapshot, back_dp_documento, ''), '^0+', '', 'g')
                AND regexp_replace(coalesce(back_documento_snapshot, back_dp_documento, ''), '^0+', '', 'g')
                    = regexp_replace(documento, '^0+', '', 'g')
                AND (
                    regexp_replace(coalesce(org_celular_registro, ''), '\D', '', 'g') = regexp_replace(lead_referido, '\D', '', 'g')
                    OR regexp_replace(coalesce(org_celular_referencia, ''), '\D', '', 'g') = regexp_replace(lead_referido, '\D', '', 'g')
                )
            ) AS initial_ok
        FROM tmp_ref_snapshot
    )
    SELECT
        count(*) FILTER (WHERE final_ok),
        count(*) FILTER (WHERE initial_ok),
        count(*) FILTER (WHERE NOT final_ok AND NOT initial_ok)
    INTO v_final, v_initial, v_bad
    FROM estados;

    IF v_final = 5 THEN
        RETURN;
    END IF;

    IF v_initial <> 5 OR v_bad > 0 THEN
        RAISE EXCEPTION 'Script 10 abortado: estado inicial/final no reconocido. initial_ok=%, final_ok=%, bad=%',
            v_initial, v_final, v_bad;
    END IF;
END $$;

WITH estado_final AS (
    SELECT count(*) AS finalizados
    FROM tmp_ref_snapshot
    WHERE org_lead_actual = lead_referido
      AND back_lead_actual = lead_original
      AND org_contacto_lead = lead_referido
      AND back_contacto_lead = lead_original
      AND org_base = 'REFERIDO'
      AND org_id_campana IS NULL
      AND org_calendarios = 1
      AND org_periodos > 0
      AND back_etapa = 'PREVENTA'
      AND back_calendarios = 0
      AND back_periodos = 0
      AND back_pagos = 0
)
INSERT INTO tmp_ref_metrics(metric, value)
SELECT 'pares_ya_corregidos_antes_de_ejecutar', finalizados FROM estado_final;

DO $$
DECLARE
    v_final integer;
BEGIN
    SELECT value INTO v_final
    FROM tmp_ref_metrics
    WHERE metric = 'pares_ya_corregidos_antes_de_ejecutar';

    IF v_final = 5 THEN
        RETURN;
    END IF;

    UPDATE calendario_facturacion_postventa c
    SET id_lead = s.org_id,
        updated_at = now(),
        observacion = left(coalesce(c.observacion || ' | ', '') || 'SCRIPT_10_REFERIDO_WIN transferido desde lead ' || s.back_id, 255)
    FROM tmp_ref_snapshot s
    WHERE c.id_lead = s.back_id;

    UPDATE periodo_facturacion_postventa p
    SET id_lead = s.org_id,
        updated_at = now(),
        observacion = left(coalesce(p.observacion || ' | ', '') || 'SCRIPT_10_REFERIDO_WIN transferido desde lead ' || s.back_id, 255)
    FROM tmp_ref_snapshot s
    WHERE p.id_lead = s.back_id;

    UPDATE pago_postventa pp
    SET id_lead = s.org_id,
        updated_at = now(),
        observacion = left(coalesce(pp.observacion || ' | ', '') || 'SCRIPT_10_REFERIDO_WIN transferido desde lead ' || s.back_id, 255)
    FROM tmp_ref_snapshot s
    WHERE pp.id_lead = s.back_id;

    UPDATE encuesta_postventa e
    SET id_lead = s.org_id,
        updated_at = now(),
        comentario = left(coalesce(e.comentario || ' | ', '') || 'SCRIPT_10_REFERIDO_WIN transferido desde lead ' || s.back_id, 255)
    FROM tmp_ref_snapshot s
    WHERE e.id_lead = s.back_id;

    UPDATE entrega_credencial_plataforma e
    SET id_lead = s.org_id,
        updated_at = now(),
        observacion = left(coalesce(e.observacion || ' | ', '') || 'SCRIPT_10_REFERIDO_WIN transferido desde lead ' || s.back_id, 255)
    FROM tmp_ref_snapshot s
    WHERE e.id_lead = s.back_id;

    UPDATE lead_adicional la
    SET id_lead = s.org_id
    FROM tmp_ref_snapshot s
    WHERE la.id_lead = s.back_id;

    UPDATE lead org
    SET
        lead = s.lead_referido,
        base = 'REFERIDO',
        id_campana = NULL,
        id_contacto = s.back_id_contacto,
        id_datos_preventa = s.back_id_datos_preventa,
        id_direccion = s.back_id_direccion,
        id_plan = s.back_id_plan,
        id_promocion_interna = s.back_id_promocion_interna,
        nombre_promocion_interna_snapshot = s.back_nombre_promocion_interna_snapshot,
        precio_adicionales_snapshot = s.back_precio_adicionales_snapshot,
        nombre_plan_snapshot = s.back_nombre_plan_snapshot,
        nombre_proveedor_snapshot = s.back_nombre_proveedor_snapshot,
        precio_plan_snapshot = s.back_precio_plan_snapshot,
        precio_final = s.back_precio_final,
        dia_corte_facturacion = s.back_dia_corte_facturacion,
        meses_permanencia_snapshot = s.back_meses_permanencia_snapshot,
        numero_documento_titular_servicio_snapshot = s.back_documento_snapshot,
        direccion_snapshot = s.back_direccion_snapshot,
        sec = s.back_sec,
        sot = s.back_sot,
        id_plataforma_digital_ofrecida = s.back_id_plataforma_digital_ofrecida,
        estado_cliente_postventa = s.back_estado_cliente_postventa,
        etapa = s.back_etapa,
        estado = s.back_estado,
        updated_at = now()
    FROM tmp_ref_snapshot s
    WHERE org.id = s.org_id;

    UPDATE lead back
    SET
        lead = s.lead_original,
        etapa = 'PREVENTA',
        estado = 'GESTIONADO',
        base = s.org_base,
        id_campana = s.org_id_campana,
        id_equipo = s.org_id_equipo,
        id_asesor_asignado = s.org_id_asesor_asignado,
        nombre_asesor_asignado = s.org_nombre_asesor_asignado,
        id_contacto = s.org_id_contacto,
        id_tipificacion = t.id,
        codigo_tipificacion = t.codigo,
        id_subtipificacion = st.id,
        codigo_subtipificacion = st.codigo,
        id_datos_preventa = NULL,
        id_direccion = NULL,
        id_plan = NULL,
        id_promocion_interna = NULL,
        nombre_promocion_interna_snapshot = NULL,
        precio_adicionales_snapshot = NULL,
        nombre_plan_snapshot = NULL,
        nombre_proveedor_snapshot = NULL,
        precio_plan_snapshot = NULL,
        precio_final = NULL,
        dia_corte_facturacion = NULL,
        meses_permanencia_snapshot = NULL,
        numero_documento_titular_servicio_snapshot = NULL,
        direccion_snapshot = NULL,
        sec = NULL,
        sot = NULL,
        id_plataforma_digital_ofrecida = NULL,
        estado_cliente_postventa = NULL,
        requiere_atencion_gtr = false,
        updated_at = now()
    FROM tmp_ref_snapshot s
    LEFT JOIN tipificacion t
        ON t.etapa = 'PREVENTA'
       AND t.id_equipo = s.org_id_equipo
       AND t.codigo = 'NO DESEA'
       AND t.activo = true
    LEFT JOIN subtipificacion st
        ON st.tipificacion_id = t.id
       AND st.codigo = 'NO DESEA'
       AND st.activo = true
    WHERE back.id = s.back_id;

    DELETE FROM lead_etapa_resumen r
    USING tmp_ref_snapshot s
    WHERE r.id_lead = s.back_id
      AND r.etapa IN ('VENTA', 'POSTVENTA', 'COBRANZA');

    INSERT INTO lead_etapa_resumen (
        id_lead, etapa, fecha_ingreso_etapa, fecha_salida_etapa, numero_pasadas,
        total_tipificaciones, total_asignaciones,
        primera_codigo_tipificacion, primera_codigo_subtipificacion, primera_tipificacion_at,
        ultima_codigo_tipificacion, ultima_codigo_subtipificacion, ultima_tipificacion_orden, ultima_tipificacion_at,
        mayor_rango_codigo_tipificacion, mayor_rango_codigo_subtipificacion, mayor_rango_orden, mayor_rango_at,
        fecha_ultima_gestion, created_at, updated_at, primera_tipificacion_orden
    )
    SELECT
        s.back_id,
        'PREVENTA',
        coalesce(s.org_created_at, now()),
        NULL,
        1,
        1,
        0,
        'NO DESEA',
        'NO DESEA',
        now(),
        'NO DESEA',
        'NO DESEA',
        st.orden,
        now(),
        'NO DESEA',
        'NO DESEA',
        st.orden,
        now(),
        now(),
        now(),
        now(),
        st.orden
    FROM tmp_ref_snapshot s
    LEFT JOIN tipificacion t
        ON t.etapa = 'PREVENTA'
       AND t.id_equipo = s.org_id_equipo
       AND t.codigo = 'NO DESEA'
       AND t.activo = true
    LEFT JOIN subtipificacion st
        ON st.tipificacion_id = t.id
       AND st.codigo = 'NO DESEA'
       AND st.activo = true
    ON CONFLICT (id_lead, etapa) DO UPDATE SET
        fecha_salida_etapa = NULL,
        total_tipificaciones = GREATEST(lead_etapa_resumen.total_tipificaciones, 1),
        primera_codigo_tipificacion = coalesce(lead_etapa_resumen.primera_codigo_tipificacion, 'NO DESEA'),
        primera_codigo_subtipificacion = coalesce(lead_etapa_resumen.primera_codigo_subtipificacion, 'NO DESEA'),
        primera_tipificacion_at = coalesce(lead_etapa_resumen.primera_tipificacion_at, now()),
        ultima_codigo_tipificacion = 'NO DESEA',
        ultima_codigo_subtipificacion = 'NO DESEA',
        ultima_tipificacion_orden = excluded.ultima_tipificacion_orden,
        ultima_tipificacion_at = now(),
        mayor_rango_codigo_tipificacion = 'NO DESEA',
        mayor_rango_codigo_subtipificacion = 'NO DESEA',
        mayor_rango_orden = excluded.mayor_rango_orden,
        mayor_rango_at = now(),
        fecha_ultima_gestion = now(),
        updated_at = now();

    INSERT INTO evento (
        id_lead, accion, etapa, tipificacion, subtipificacion,
        comentario, nombre_actor, rol_actor, created_at
    )
    SELECT
        s.back_id,
        'TIPIFICACION',
        'PREVENTA',
        'NO DESEA',
        'NO DESEA',
        left('SCRIPT_10_REFERIDO_WIN | lead original queda en PREVENTA; referido postventa=' || s.lead_referido, 255),
        'Backfill POSTVENTA',
        'SISTEMA',
        now()
    FROM tmp_ref_snapshot s;
END $$;

DO $$
DECLARE
    v_hallazgos integer;
BEGIN
    WITH post AS (
        SELECT
            p.*,
            org.lead AS org_lead_actual,
            org.etapa AS org_etapa,
            org.base AS org_base,
            org.id_campana AS org_id_campana,
            org.id_contacto AS org_id_contacto,
            org.id_datos_preventa AS org_id_datos_preventa,
            back.lead AS back_lead_actual,
            back.etapa AS back_etapa,
            back.base AS back_base,
            back.id_campana AS back_id_campana,
            back.id_contacto AS back_id_contacto,
            back.id_datos_preventa AS back_id_datos_preventa,
            back.id_direccion AS back_id_direccion,
            back.id_plan AS back_id_plan,
            back.nombre_proveedor_snapshot AS back_proveedor,
            back.nombre_plan_snapshot AS back_plan,
            back.precio_final AS back_precio_final,
            back.numero_documento_titular_servicio_snapshot AS back_documento,
            org_ct.lead AS org_contacto_lead,
            back_ct.lead AS back_contacto_lead,
            count(DISTINCT org_cal.id) AS org_calendarios,
            count(DISTINCT org_per.id) AS org_periodos,
            count(DISTINCT back_cal.id) AS back_calendarios,
            count(DISTINCT back_per.id) AS back_periodos,
            count(DISTINCT back_pag.id) AS back_pagos,
            count(DISTINCT back_enc.id) AS back_encuestas,
            count(DISTINCT back_cred.id) AS back_credenciales
        FROM tmp_ref_pairs p
        JOIN lead org ON org.id = p.org_id
        JOIN lead back ON back.id = p.back_id
        LEFT JOIN contacto org_ct ON org_ct.id = org.id_contacto
        LEFT JOIN contacto back_ct ON back_ct.id = back.id_contacto
        LEFT JOIN calendario_facturacion_postventa org_cal ON org_cal.id_lead = org.id AND org_cal.activo = true
        LEFT JOIN periodo_facturacion_postventa org_per ON org_per.id_lead = org.id
        LEFT JOIN calendario_facturacion_postventa back_cal ON back_cal.id_lead = back.id
        LEFT JOIN periodo_facturacion_postventa back_per ON back_per.id_lead = back.id
        LEFT JOIN pago_postventa back_pag ON back_pag.id_lead = back.id
        LEFT JOIN encuesta_postventa back_enc ON back_enc.id_lead = back.id
        LEFT JOIN entrega_credencial_plataforma back_cred ON back_cred.id_lead = back.id
        GROUP BY
            p.org_id, p.back_id, p.lead_original, p.lead_referido, p.documento, p.excel_ref,
            org.lead, org.etapa, org.base, org.id_campana, org.id_contacto, org.id_datos_preventa,
            back.lead, back.etapa, back.base, back.id_campana, back.id_contacto, back.id_datos_preventa,
            back.id_direccion, back.id_plan, back.nombre_proveedor_snapshot, back.nombre_plan_snapshot,
            back.precio_final, back.numero_documento_titular_servicio_snapshot, org_ct.lead, back_ct.lead
    ), hallazgos AS (
        SELECT 'ORGANICO_NO_QUEDO_REFERIDO_POSTVENTA' AS regla, *
        FROM post
        WHERE NOT (
            org_lead_actual = lead_referido
            AND org_contacto_lead = lead_referido
            AND org_etapa IN ('POSTVENTA', 'COBRANZA')
            AND org_base = 'REFERIDO'
            AND org_id_campana IS NULL
            AND org_calendarios = 1
            AND org_periodos > 0
            AND org_id_datos_preventa IS NOT NULL
        )
        UNION ALL
        SELECT 'BACKFILL_NO_QUEDO_ORIGINAL_PREVENTA', *
        FROM post
        WHERE NOT (
            back_lead_actual = lead_original
            AND back_contacto_lead = lead_original
            AND back_etapa = 'PREVENTA'
            AND back_calendarios = 0
            AND back_periodos = 0
            AND back_pagos = 0
            AND back_encuestas = 0
            AND back_credenciales = 0
            AND back_id_datos_preventa IS NULL
            AND back_id_direccion IS NULL
            AND back_id_plan IS NULL
            AND back_proveedor IS NULL
            AND back_plan IS NULL
            AND back_precio_final IS NULL
            AND back_documento IS NULL
        )
    )
    SELECT count(*) INTO v_hallazgos FROM hallazgos;

    IF v_hallazgos > 0 THEN
        RAISE EXCEPTION 'Script 10 incoherente: validacion posterior con hallazgos=%', v_hallazgos;
    END IF;
END $$;

INSERT INTO tmp_ref_metrics(metric, value)
SELECT 'pares_corregidos_o_validados', 5
ON CONFLICT (metric) DO UPDATE SET value = excluded.value;

SELECT metric, value FROM tmp_ref_metrics ORDER BY metric;

WITH pares AS (
    SELECT
        p.lead_original,
        p.lead_referido,
        org.id AS id_organico,
        org.lead AS lead_organico_actual,
        org.etapa AS etapa_organico,
        org.base AS base_organico,
        org.id_campana AS campana_organico,
        org_ct.lead AS contacto_organico,
        back.id AS id_original,
        back.lead AS lead_original_actual,
        back.etapa AS etapa_original,
        back.base AS base_original,
        back.id_campana AS campana_original,
        back_ct.lead AS contacto_original,
        count(DISTINCT cal.id) AS calendarios_referido,
        count(DISTINCT per.id) AS periodos_referido
    FROM tmp_ref_pairs p
    JOIN lead org ON org.id = p.org_id
    JOIN lead back ON back.id = p.back_id
    LEFT JOIN contacto org_ct ON org_ct.id = org.id_contacto
    LEFT JOIN contacto back_ct ON back_ct.id = back.id_contacto
    LEFT JOIN calendario_facturacion_postventa cal ON cal.id_lead = org.id AND cal.activo = true
    LEFT JOIN periodo_facturacion_postventa per ON per.id_lead = org.id
    GROUP BY
        p.lead_original, p.lead_referido, org.id, org.lead, org.etapa, org.base, org.id_campana,
        org_ct.lead, back.id, back.lead, back.etapa, back.base, back.id_campana, back_ct.lead
)
SELECT *
FROM pares
ORDER BY lead_referido;

COMMIT;
