\set ON_ERROR_STOP on

-- Backfill POSTVENTA 2026-07-31 / Script 02
-- Objetivo: regularizar 7 ventas reales que comparten 3 telefonos de contacto.
-- Regla acordada: cada fila de POSTVENTA representa un lead/venta real independiente.
-- Implementacion: reutiliza el lead PREVENTA vacio mas antiguo de cada telefono para la
-- primera venta y crea leads adicionales para las demas ventas del mismo contacto.

BEGIN;

WITH src(
    lead, tipo_documento, documento, cliente, celular_registro, celular_referencia,
    departamento, direccion, fecha_instalacion, plan_snapshot, precio_final,
    asesor_ventas, alias_asesor, compania, status_venta, servicio_contratado,
    velocidad_contratada, dispositivos_adicionales, plataforma_digital, id_plataforma,
    hoja_postventa, fila_postventa, corte_postventa, fila_ventas_bd
) AS (
    VALUES
        ('997548503', 'DNI', '45111949', 'CESAR EDUARDO VERA TORRES', '997548503', '997548503', 'LIMA', 'CALLE PASEO DE LOS CONDES 199 URBANIZACION LAS LOMAS DE LA MOLINA VIEJA ETAPA 1 (LA MOLINA, LIMA, LIMA)', '2026-04-25', 'Duo - Fibra, WinTV Premium - 500 Mbps', 99.90, 'SEBASTIAN ALESSANDRO BATISTA LIZARBE ACASIETE', 'SEBASTIAN', NULL, '5 - INSTALADA', 'Fibra, WinTV Premium', '500 Mbps', 'NINGUNO', 'IPTV', 1, '26ABR', 196, 2, NULL),
        ('997548503', 'DNI', '44469982', 'ANTHONY ALFONSO DE LA CRUZ SALAZAR', '997548503', '997548503', 'LIMA', 'CALLE 5 URB 200 MILLAS ETAPA 1 MZ J LT 31 (CALLAO, CALLAO, CALLAO)', '2026-04-25', 'Trio - Fibra, WinTV Premium, FonoWIN - 500 Mbps', 109.90, 'SEBASTIAN ALESSANDRO BATISTA LIZARBE ACASIETE', 'SEBASTIAN', NULL, '5 - INSTALADA', 'Fibra, WinTV Premium, FonoWIN', '500 Mbps', 'NINGUNO', 'IPTV', 1, '26ABR', 200, 2, NULL),
        ('998939250', 'DNI', '73529046', 'GABRIEL ANTONIO FERIA', '998939250', '998939250', 'LIMA', 'EDIFICIO NOVO 2 JIRON HERMILIO VALDIZAN 528 (JESUS MARIA, LIMA, LIMA)', '2026-04-30', 'Duo - Fibra, WinTV Premium - 500 Mbps', 99.90, 'FABRIZZIO FARITH VELIZ KRUCHINSKY', 'FABRIZZIO', NULL, '5 - INSTALADA', 'Fibra, WinTV Premium', '500 Mbps', 'NINGUNO', 'IPTV', 1, '26ABR', 247, 2, NULL),
        ('998939250', 'DNI', '15385261', 'MIGUEL ANTONIO SANCHEZ CASAS', '998939250', '998939250', 'LIMA', 'NUEVO LURIN ETAPA 2 MZ 25 LT 4', '2026-04-30', 'Duo - Fibra, WinTV Premium - 500 Mbps', 99.90, 'MARYORI STEFANY PEREZ LECAROS', 'MARYORI.P', NULL, '5 - INSTALADA', 'Fibra, WinTV Premium', '500 Mbps', 'NINGUNO', 'IPTV', 1, '26ABR', 252, 2, NULL),
        ('954838665', 'DNI', '76444829', 'HAMIR OMAR LOZADA IGNACIO', '954838665', '954838665', 'LIMA', 'CALLE LOS INCAS FORTALEZA DE VITARTE MZ B LT 31 (ATE, LIMA, LIMA) CALLES LOS INCAS 120', '2026-05-04', 'Duo - WinTV L1 MAX Premium - 1000 Mbps', 99.90, 'XIOMARA VEGA MAGALLANES', 'XIOMARA.V', NULL, '5 - INSTALADA', 'WinTV L1 MAX Premium', '1000 Mbps', 'NINGUNO', 'IPTV', 1, '26MAY', 21, 1, NULL),
        ('954838665', 'DNI', '41856058', 'FRANKLIN OMAR CRUZ PINGO', '954838665', '954838665', 'LIMA', 'Calle Concepcion 182 Asociacion Fortaleza de Vitarte', '2026-05-11', 'Duo - Fibra, WinTV L1 MAX Premium - 1000 Mbps', 159.80, 'LUCIA PAREDES CASAMAYOR', 'LUCIA', NULL, '5 - INSTALADA', 'Fibra, WinTV L1 MAX Premium', '1000 Mbps', 'NINGUNO', 'IPTV', 1, '26MAY', 89, 1, NULL),
        ('954838665', 'DNI', '74882432', 'EDYSON BARRON DEL AGUILA', '954838665', '954838665', 'LIMA', 'Calle RIO HUALLAGA 244 - URBANIZACION LOS ANGELES DE VITARTE SECTOR D, INTERIOR B', '2026-05-23', 'Duo - Fibra, WinTV L1 MAX Premium - 1000 Mbps', 159.80, 'LUCIA PAREDES CASAMAYOR', 'LUCIA', NULL, '5 - INSTALADA', 'Fibra, WinTV L1 MAX Premium', '1000 Mbps', 'NINGUNO', 'IPTV', 1, '26MAY', 182, 2, NULL)
), contacto_upsert AS (
    INSERT INTO contacto (prefijo, lead, nombre_conocido, created_at, updated_at)
    SELECT DISTINCT '+51', s.lead, min(s.cliente), now(), now()
    FROM src s
    GROUP BY s.lead
    ON CONFLICT (prefijo, lead) DO UPDATE
    SET updated_at = now()
    RETURNING id, lead
), src_ready AS (
    SELECT
        s.*,
        s.fecha_instalacion::date AS fecha_instalacion_date,
        s.precio_final::numeric(38, 2) AS precio_final_num,
        row_number() OVER (PARTITION BY s.lead ORDER BY s.hoja_postventa, s.fila_postventa) AS rn,
        c.id AS id_contacto
    FROM src s
    JOIN contacto c ON c.prefijo = '+51' AND c.lead = s.lead
), existing_by_document AS (
    SELECT
        s.lead,
        s.documento,
        l.id AS id_lead
    FROM src_ready s
    JOIN lead l ON l.id_contacto = s.id_contacto
    JOIN datos_preventa dp ON dp.id = l.id_datos_preventa
        AND dp.numero_documento_titular_servicio = s.documento
), preventa_slot AS (
    SELECT DISTINCT ON (s.lead)
        s.lead,
        l.id AS id_lead
    FROM src_ready s
    JOIN lead l ON l.id_contacto = s.id_contacto
    LEFT JOIN datos_preventa dp ON dp.id = l.id_datos_preventa
    WHERE s.rn = 1
      AND l.etapa = 'PREVENTA'
      AND nullif(dp.numero_documento_titular_servicio, '') IS NULL
    ORDER BY s.lead, l.id
), source_resolution AS (
    SELECT
        s.*,
        e.id_lead AS id_lead_existente_documento,
        CASE
            WHEN e.id_lead IS NOT NULL THEN e.id_lead
            WHEN s.rn = 1 THEN ps.id_lead
            ELSE NULL
        END AS id_lead_resuelto,
        CASE
            WHEN e.id_lead IS NOT NULL THEN 'YA_EXISTE_DOCUMENTO'
            WHEN s.rn = 1 AND ps.id_lead IS NOT NULL THEN 'ACTUALIZAR_PREVENTA_EXISTENTE'
            ELSE 'CREAR_LEAD_ADICIONAL'
        END AS accion
    FROM src_ready s
    LEFT JOIN existing_by_document e ON e.lead = s.lead AND e.documento = s.documento
    LEFT JOIN preventa_slot ps ON ps.lead = s.lead
), source_to_write AS (
    SELECT *
    FROM source_resolution
    WHERE accion <> 'YA_EXISTE_DOCUMENTO'
), datos_insert AS (
    INSERT INTO datos_preventa (
        tipo_documento,
        numero_documento_titular_servicio,
        nombre_titular_servicio,
        celular_registro,
        celular_referencia
    )
    SELECT
        s.tipo_documento,
        s.documento,
        s.cliente,
        NULLIF(s.celular_registro, ''),
        NULLIF(s.celular_referencia, '')
    FROM source_to_write s
    RETURNING id, numero_documento_titular_servicio
), direccion_insert AS (
    INSERT INTO direccion (tipo_domicilio, direccion, referencia)
    SELECT
        'HOGAR',
        s.direccion,
        concat_ws(' | ', 'Backfill POSTVENTA multiservicio', NULLIF(s.departamento, ''), NULLIF(s.servicio_contratado, ''), NULLIF(s.dispositivos_adicionales, ''))
    FROM source_to_write s
    RETURNING id, direccion
), prepared AS (
    SELECT
        s.*,
        d.id AS id_datos_preventa,
        di.id AS id_direccion
    FROM source_to_write s
    JOIN datos_insert d ON d.numero_documento_titular_servicio = s.documento
    JOIN direccion_insert di ON di.direccion = s.direccion
), lead_update AS (
    UPDATE lead l
    SET
        prefijo = '+51',
        lead = p.lead,
        id_contacto = p.id_contacto,
        id_equipo = coalesce(l.id_equipo, 1),
        etapa = 'POSTVENTA',
        estado = 'GESTIONADO',
        base = coalesce(l.base, 'MASIVO'),
        id_campana = NULL,
        id_asesor_asignado = NULL,
        nombre_asesor_asignado = NULL,
        numero_documento_titular_servicio_snapshot = p.documento,
        direccion_snapshot = p.direccion,
        id_datos_preventa = p.id_datos_preventa,
        id_direccion = p.id_direccion,
        id_plan = NULL,
        nombre_plan_snapshot = p.plan_snapshot,
        nombre_proveedor_snapshot = 'WIN',
        precio_plan_snapshot = p.precio_final_num,
        precio_adicionales_snapshot = NULL,
        precio_final = p.precio_final_num,
        dia_corte_facturacion = 23,
        meses_permanencia_snapshot = 3,
        id_plataforma_digital_ofrecida = p.id_plataforma,
        estado_cliente_postventa = CASE
            WHEN upper(coalesce(p.status_venta, '')) LIKE '%BAJA%' THEN 'BAJA'
            WHEN upper(coalesce(p.status_venta, '')) LIKE '%SUSPEND%' THEN 'SUSPENDIDO'
            ELSE 'ACTIVO'
        END,
        last_entry_at = (p.fecha_instalacion_date::timestamp AT TIME ZONE 'America/Lima'),
        updated_at = now()
    FROM prepared p
    WHERE p.accion = 'ACTUALIZAR_PREVENTA_EXISTENTE'
      AND l.id = p.id_lead_resuelto
    RETURNING
        l.id,
        l.lead,
        l.numero_documento_titular_servicio_snapshot AS documento,
        p.fecha_instalacion_date,
        p.plan_snapshot,
        p.precio_final_num,
        p.hoja_postventa,
        p.fila_postventa
), lead_insert AS (
    INSERT INTO lead (
        prefijo,
        lead,
        id_contacto,
        id_equipo,
        etapa,
        estado,
        base,
        id_campana,
        numero_documento_titular_servicio_snapshot,
        direccion_snapshot,
        id_datos_preventa,
        id_direccion,
        id_plan,
        nombre_plan_snapshot,
        nombre_proveedor_snapshot,
        precio_plan_snapshot,
        precio_adicionales_snapshot,
        precio_final,
        dia_corte_facturacion,
        meses_permanencia_snapshot,
        id_plataforma_digital_ofrecida,
        estado_cliente_postventa,
        created_at,
        last_entry_at,
        updated_at
    )
    SELECT
        '+51',
        p.lead,
        p.id_contacto,
        1,
        'POSTVENTA',
        'GESTIONADO',
        'MASIVO',
        NULL,
        p.documento,
        p.direccion,
        p.id_datos_preventa,
        p.id_direccion,
        NULL,
        p.plan_snapshot,
        'WIN',
        p.precio_final_num,
        NULL,
        p.precio_final_num,
        23,
        3,
        p.id_plataforma,
        CASE
            WHEN upper(coalesce(p.status_venta, '')) LIKE '%BAJA%' THEN 'BAJA'
            WHEN upper(coalesce(p.status_venta, '')) LIKE '%SUSPEND%' THEN 'SUSPENDIDO'
            ELSE 'ACTIVO'
        END,
        (p.fecha_instalacion_date::timestamp AT TIME ZONE 'America/Lima'),
        (p.fecha_instalacion_date::timestamp AT TIME ZONE 'America/Lima'),
        now()
    FROM prepared p
    WHERE p.accion = 'CREAR_LEAD_ADICIONAL'
    RETURNING
        id,
        lead,
        numero_documento_titular_servicio_snapshot AS documento
), normalized_leads AS (
    SELECT
        lu.id,
        lu.lead,
        lu.documento,
        lu.fecha_instalacion_date,
        lu.plan_snapshot,
        lu.precio_final_num,
        lu.hoja_postventa,
        lu.fila_postventa
    FROM lead_update lu
    UNION ALL
    SELECT
        li.id,
        p.lead,
        p.documento,
        p.fecha_instalacion_date,
        p.plan_snapshot,
        p.precio_final_num,
        p.hoja_postventa,
        p.fila_postventa
    FROM lead_insert li
    JOIN prepared p ON p.lead = li.lead AND p.documento = li.documento
    UNION ALL
    SELECT
        e.id_lead,
        s.lead,
        s.documento,
        s.fecha_instalacion_date,
        s.plan_snapshot,
        s.precio_final_num,
        s.hoja_postventa,
        s.fila_postventa
    FROM source_resolution s
    JOIN existing_by_document e ON e.lead = s.lead AND e.documento = s.documento
), calendario_insert AS (
    INSERT INTO calendario_facturacion_postventa (
        id_lead,
        fecha_instalacion,
        proveedor_snapshot,
        plan_snapshot,
        meses_permanencia_snapshot,
        monto_plan_snapshot,
        tipo_regla_proveedor,
        dia_corte,
        dia_vencimiento,
        mes_corte_base,
        numero_corte_base,
        bloque_facturacion,
        requiere_prorrateo_inicial,
        activo,
        corte_corregido,
        observacion,
        created_at,
        updated_at
    )
    SELECT
        l.id,
        l.fecha_instalacion_date,
        'WIN',
        l.plan_snapshot,
        3,
        l.precio_final_num,
        'WIN',
        23,
        28,
        date_trunc('month', l.fecha_instalacion_date)::date,
        CASE WHEN extract(day from l.fecha_instalacion_date) <= 22 THEN 1 ELSE 2 END,
        CASE WHEN extract(day from l.fecha_instalacion_date) <= 22 THEN 'MISMO_MES' ELSE 'MES_SIGUIENTE' END,
        true,
        true,
        false,
        concat('BACKFILL_POSTVENTA_20260731_MULTISERVICIO | POSTVENTA ', l.hoja_postventa, ' fila ', l.fila_postventa),
        now(),
        now()
    FROM normalized_leads l
    WHERE NOT EXISTS (SELECT 1 FROM calendario_facturacion_postventa c WHERE c.id_lead = l.id)
    RETURNING id, id_lead, fecha_instalacion, mes_corte_base, numero_corte_base, monto_plan_snapshot
), periodo_uno_insert AS (
    INSERT INTO periodo_facturacion_postventa (
        id_calendario_facturacion,
        id_lead,
        numero_periodo,
        fecha_inicio_periodo,
        fecha_fin_periodo,
        fecha_corte_estimada,
        fecha_vencimiento_estimado,
        monto_esperado,
        estado,
        observacion,
        created_at,
        updated_at
    )
    SELECT
        c.id,
        c.id_lead,
        1,
        CASE WHEN c.numero_corte_base = 2 THEN c.mes_corte_base + interval '22 days' ELSE c.mes_corte_base END::date,
        CASE WHEN c.numero_corte_base = 2 THEN (c.mes_corte_base + interval '1 month' + interval '27 days') ELSE (c.mes_corte_base + interval '27 days') END::date,
        CASE WHEN c.numero_corte_base = 2 THEN (c.mes_corte_base + interval '1 month' + interval '22 days') ELSE (c.mes_corte_base + interval '22 days') END::date,
        CASE WHEN c.numero_corte_base = 2 THEN (c.mes_corte_base + interval '1 month' + interval '27 days') ELSE (c.mes_corte_base + interval '27 days') END::date,
        c.monto_plan_snapshot,
        'ABIERTO',
        'BACKFILL_POSTVENTA_20260731_MULTISERVICIO | periodo base; cierre/pagos/encuestas se reconstruyen en script posterior',
        now(),
        now()
    FROM calendario_insert c
    WHERE NOT EXISTS (
        SELECT 1
        FROM periodo_facturacion_postventa p
        WHERE p.id_lead = c.id_lead AND p.numero_periodo = 1
    )
    RETURNING id
)
SELECT
    (SELECT count(*) FROM src) AS fuente_7,
    (SELECT count(*) FROM lead_update) AS leads_preventa_actualizados,
    (SELECT count(*) FROM lead_insert) AS leads_adicionales_insertados,
    (SELECT count(*) FROM calendario_insert) AS calendarios_insertados,
    (SELECT count(*) FROM periodo_uno_insert) AS periodos_uno_insertados;

-- Validacion esperada: deben existir 7 leads POSTVENTA diferenciados por documento.
SELECT
    s.lead,
    s.documento,
    l.id AS id_lead,
    l.etapa,
    l.estado,
    l.nombre_proveedor_snapshot,
    l.precio_final,
    c.fecha_instalacion,
    c.numero_corte_base,
    p.numero_periodo,
    p.estado AS estado_periodo
FROM (VALUES
        ('997548503', '45111949', 196),
        ('997548503', '44469982', 200),
        ('998939250', '73529046', 247),
        ('998939250', '15385261', 252),
        ('954838665', '76444829', 21),
        ('954838665', '41856058', 89),
        ('954838665', '74882432', 182)
) AS s(lead, documento, fila_postventa)
LEFT JOIN contacto ct ON ct.prefijo = '+51' AND ct.lead = s.lead
LEFT JOIN (
    SELECT
        l.*,
        dp.numero_documento_titular_servicio AS documento
    FROM lead l
    JOIN datos_preventa dp ON dp.id = l.id_datos_preventa
) l ON l.id_contacto = ct.id AND l.documento = s.documento
LEFT JOIN calendario_facturacion_postventa c ON c.id_lead = l.id
LEFT JOIN periodo_facturacion_postventa p ON p.id_lead = l.id AND p.numero_periodo = 1
ORDER BY s.lead, s.fila_postventa;

COMMIT;
