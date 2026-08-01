\set ON_ERROR_STOP on

-- Backfill POSTVENTA 2026-07-31 / Script 01
-- Objetivo: registrar los 19 leads que estan en POSTVENTA_ALBRU.xlsx pero no existen en lead_db.
-- Fuente principal de datos comerciales: VENTAS_BD.xlsx, hoja BASE, columna M (LEAD).
-- Criterio acordado: el plan exacto es secundario; el precio final del plan es obligatorio.

BEGIN;

WITH src(
    lead, tipo_documento, documento, cliente, celular_registro, celular_referencia,
    departamento, direccion, fecha_instalacion, plan_snapshot, precio_final,
    asesor_ventas, alias_asesor, compania, status_venta, servicio_contratado,
    velocidad_contratada, dispositivos_adicionales, plataforma_digital, id_plataforma,
    hoja_postventa, fila_postventa, corte_postventa, fila_ventas_bd
) AS (
    VALUES
        ('993893066', 'DNI', '72852376', 'VEGA RIVERA BRIGDY LUCERO', '993893066', '922764114', 'LIMA', 'Av. Paseo de la República 4095 torre .b', '2026-04-25', 'Dúo - Fibra, WinTV Premium - 750 Mbps', 109.9, 'MARYORI STEFANY PÉREZ LECAROS', 'MARYORI.P', NULL, '5 - INSTALADA', 'Fibra, WinTV Premium', '750 Mbps', 'NINGUNO', 'IPTV', 1, '26ABR', 199, 2, 8196),
        ('955914951', 'DNI', '17923429', 'MARGARITA NANCY ZARATE ESPEJO', '955914951', '955914951', 'LIMA', 'JIRON EMILIO ALTHAUS 121', '2026-04-26', 'Trío - Fibra, WinTV Premium, FonoWIN - 1000 Mbps', 139.9, 'JESSICA DIANA MEZA VELASQUEZ', 'JESSICA', NULL, '5 - INSTALADA', 'Fibra, WinTV Premium, FonoWIN', '1000 Mbps', '2 MESH', 'IPTV', 1, '26ABR', 213, 2, 8210),
        ('908002051', 'CE', '009527186', 'GENESIS EGLEE FLORES DAVILA', '916612354', '908002051', 'LIMA', 'AVENIDA LIMA 1071 URBANIZACION TEJADA ALTA (BARRANCO, LIMA, LIMA)', '2026-04-30', 'Mono - Fibra - 500 Mbps', 99, 'FABRIZZIO FARITH VELIZ KRUCHINSKY', 'FABRIZZIO', NULL, '5 - INSTALADA', 'Fibra', '500 Mbps', 'NINGUNO', 'NINGUNO', NULL, '26ABR', 248, 2, 8245),
        ('933443348', 'CE', '004711821', 'MIGDALIA GONZALEZ DELGADO', '933443348', '933443348', 'LIMA', 'PASAJE MARTIN LUTHER KING 123 RESIDENCIAL OYAGUE (PUEBLO LIBRE, LIMA, LIMA)', '2026-07-01', 'Dúo - Fibra, DGO Hogar - 1000 Mbps', 159.9, 'MARIA JOSE PINEDA RODRIGUEZ', 'M.JOSE', NULL, '5 - INSTALADA', 'Fibra, DGO Hogar', '1000 Mbps', '2 MESH', 'NINGUNO', NULL, '26JUL', 11, 1, 8786),
        ('968375486', 'DNI', '72350103', 'JOEL FERNANDO HUAMAN VERAMENDI', '941695837', '941695837', 'LIMA', 'MZ C LOTE 33 URB SAN JUAN BAUTISTA COMAS', '2026-07-04', 'Dúo - Fibra, DGO Hogar - 850 Mbps', 119.9, 'XIOMARA VEGA MAGALLANES', 'XIOMARA.V', NULL, '5 - INSTALADA', 'Fibra, DGO Hogar', '850 Mbps', '1 MESH', 'NINGUNO', NULL, '26JUL', 30, 1, 8805),
        ('944177719', 'DNI', '45160294', 'CINDY CATHERINE BALTODANO YOUNG', '944177719', '944177719', 'LIMA', 'AVENIDA CAMINO DE AMANCAES 100 CONDOMINIO ALAMEDA ALCAZAR ETAPADA 2  TORRE C', '2026-07-05', 'Dúo - Fibra, WinTV L1 MAX Premium - 850 Mbps', 129.9, 'REILEX GABRIEL RAMIREZ TOVAR', 'GABRIEL', NULL, '5 - INSTALADA', 'Fibra, WinTV L1 MAX Premium', '850 Mbps', '1 WINBOX', 'NINGUNO', NULL, '26JUL', 46, 1, 8821),
        ('951192491', 'DNI', '44597466', 'ANDERSON ALBERTO BARRANZUELA CISNEROS', '951192491', '951192491', 'LIMA', 'CALLE SIMON BOLIVAR MZ  N LOTE 1 HUAQUILLAY ETAPA 2 (COMAS, LIMA, LIMA)', '2026-07-07', 'Dúo - Fibra, DGO Hogar - 850 Mbps', 159.9, 'YARITZA IBETH GARCÍA YARLEQUE', 'YARITZA', NULL, '5 - INSTALADA', 'Fibra, DGO Hogar', '850 Mbps', '1 MESH, 2 WINBOX', 'NINGUNO', NULL, '26JUL', 61, 1, 8836),
        ('910304594', 'DNI', '08129644', 'HAILLE EDUARDO REYES GOMEZ', '910304594', '910304594', 'LIMA', 'FLOR DE AMANCAES COMITE 11 MZ R LT 1, RIMAC, LIMA, LIMA, PERÚ', '2026-06-01', 'Mono - Fibra, WinTV Premium - 500 Mbps', 99.9, 'JORGE LUIS PICHIHUA PUMA', 'JORGE', NULL, '5 - INSTALADA', 'Fibra, WinTV Premium', '500 Mbps', 'NINGUNO', 'IPTV', 1, '26JUN', 8, 1, 8494),
        ('924144047', 'DNI', '70988684', 'GARAY BACA SEBASTIAN ALEJANDRO', '924144047', '924144047', 'LIMA', 'ASENTAMIENTO HUMANO SANTA FE DE TOTORITA MZ D LT 7', '2026-06-19', 'Dúo - Fibra, DGO Hogar - 850 Mbps', 139.9, 'FABIO MARCELO MALDONADO HERRERA', 'FABIO', NULL, '5 - INSTALADA', 'Fibra, DGO Hogar', '850 Mbps', '1 MESH', 'IPTV, MAGIS', 1, '26JUN', 202, 1, 8689),
        ('977365809', 'DNI', '70251268', 'ARIANA NICOLE VARGAS ROSSELLO', '991578104', '991578104', 'LIMA', 'JIRON ERNESTO CHE GUEVARA 565 ASENTAMIENTO HUMANO VILLA SEÑOR DE LOS MILAGROS (CARMEN DE LA LEGUA REYNOSO, CALLAO, CALLAO)', '2026-06-20', 'Dúo - Fibra, DGO Hogar - 850 Mbps', 154.9, 'LUCIA PAREDES CASAMAYOR', 'LUCIA', NULL, '5 - INSTALADA', 'Fibra, DGO Hogar', '850 Mbps', '2 WINBOX', 'NINGUNO', NULL, '26JUN', 203, 1, 8690),
        ('931028734', 'DNI', '61096243', 'NICOLE ALEXANDRA PEREZ GALLARDO', '976082560', '976082560', 'LIMA', 'AVENIDA CORDILLERA CENTRAL MZ C13 LOTE 4 URB.LAS DELICIAS DE VILLA', '2026-06-20', 'Dúo - Fibra, WinTV Premium - 1000 Mbps', 139.9, 'XIOMARA VEGA MAGALLANES', 'XIOMARA.V', NULL, '5 - INSTALADA', 'Fibra, WinTV Premium', '1000 Mbps', '1 MESH, 1 WINBOX', 'IPTV, MAGIS', 1, '26JUN', 207, 1, 8694),
        ('982347106', 'DNI', '07589883', 'MARIA ROSA CURAY AGURTO', '982347106', '921552391', 'LIMA', 'AVENIDA SAN LUIS 2721', '2026-06-27', 'Mono - Fibra, WinTV Premium - 500 Mbps', 99.9, 'JORGE LUIS PICHIHUA PUMA', 'JORGE', NULL, '5 - INSTALADA', 'Fibra, WinTV Premium', '500 Mbps', 'NINGUNO', 'IPTV', 1, '26JUN', 264, 2, 8750),
        ('906332922', 'DNI', '08119351', 'CARMEN ROSA DIAZ LINO', '960477538', '906332922', 'LIMA', 'JIRON LA LIBERTAD 3708 URBANIZACION PERU ZONA 7 (SAN MARTIN DE PORRES, LIMA, LIMA)', '2026-06-29', 'Dúo - Fibra, WinTV Premium - 500 Mbps', 99.9, 'FABRIZZIO FARITH VELIZ KRUCHINSKY', 'FABRIZZIO', NULL, '5 - INSTALADA', 'Fibra, WinTV Premium', '500 Mbps', '1 WINBOX', 'NINGUNO', NULL, '26JUN', 279, 2, 8765),
        ('928776185', 'DNI', '45201156', 'BIANCA DEYSI NUÑEZ RIOS', '928309679', '928309679', 'LIMA', 'AV. SANTA ANA 650 ASOCIACION SAN JUAN CELESTIAL', '2026-05-06', 'Mono - Fibra - 1000 Mbps', 139, 'JESSICA DIANA MEZA VELASQUEZ', 'JESSICA', NULL, '5 - INSTALADA', 'Fibra', '1000 Mbps', '1 WINBOX, 2 MESH', 'NINGUNO', NULL, '26MAY', 37, 1, 8282),
        ('908932652', 'CE', '008483661', 'Marco Segundo Maldonado Hurtado', '955778967', '908932652', 'LIMA', 'CALLE TACNA (GENERAL EMILIO SOYER CABERO) 486 URBANIZACION BARBONCITO', '2026-05-11', 'Dúo - Fibra, WinTV Premium - 500 Mbps', 99.9, 'JESSICA DIANA MEZA VELASQUEZ', 'JESSICA', NULL, '5 - INSTALADA', 'Fibra, WinTV Premium', '500 Mbps', 'NINGUNO', 'IPTV', 1, '26MAY', 82, 1, 8327),
        ('982007651', 'DNI', '42571074', 'MIRTHA MERCEDES CLEMENT CLEMENT', '982008454', '982007651', 'LIMA', 'JIRON EMILIO DE LOS RIOS URBANIZACION VILLA SOL ETAPA 4 MZ Z LOTE 5 (LOS OLIVOS, LIMA, LIMA) PISO 2  INTERIOR / NRO DE DEPA: NA', '2026-05-17', 'Dúo - Fibra, WinTV Premium - 500 Mbps', 99.9, 'JUAN PABLO CLEMENT CLEMENT', 'JUAN', NULL, '5 - INSTALADA', 'Fibra, WinTV Premium', '500 Mbps', 'NINGUNO', 'IPTV', 1, '26MAY', 146, 1, 8391),
        ('972531040', 'DNI', '44721460', 'GLORIA HANCCO BEJAR', '972531040', '972531040', 'LIMA', 'ASOCIACION SANTA ELIZABETH ETAPA 1 MZ G LT 19 (SAN JUAN DE LURIGANCHO, LIMA, LIMA)PISO 1  INTERIOR / NRO DE DEPA: NA', '2026-05-20', 'Mono - WinTV Premium - 500 Mbps', 99, 'JUAN PABLO CLEMENT CLEMENT', 'JUAN', NULL, '5 - INSTALADA', 'WinTV Premium', '500 Mbps', 'NINGUNO', 'NINGUNO', NULL, '26MAY', 168, 1, 8414),
        ('965108203', 'DNI', '72797264', 'ANA ALMENDRA IPANAQUE NIÑO', '965108203', '940422968', 'LIMA', 'CALLE MIGUEL UNAMUNO URB VILLA LOS OLIVOS MZ D LT 3 (SAN MARTIN DE PORRES, LIMA, LIMA)', '2026-05-28', 'Dúo - Fibra, DGO BASICO  L1 MAX - 850 Mbps', 139.9, 'OSCAR ANDRES ESPICHAN LAGUNA', 'OSCAR', NULL, '5 - INSTALADA', 'Fibra, DGO BASICO  L1 MAX', '850 Mbps', '1 WINBOX', 'IPTV', 1, '26MAY', 213, 2, 8458),
        ('955361871', 'DNI', '09586162', 'JOSE PEDRO POVES BALBOA', '955361871', '955361871', 'LIMA', 'Mz A, LT 34 A.h 15 de setiembre', '2026-05-31', 'Dúo - Fibra, DGO Básico - 850 Mbps', 139.9, 'LUCIA PAREDES CASAMAYOR', 'LUCIA', NULL, '5 - INSTALADA', 'Fibra, DGO Básico', '850 Mbps', '1 MESH', 'IPTV', 1, '26MAY', 244, 2, 8489)
), contacto_upsert AS (
    INSERT INTO contacto (prefijo, lead, nombre_conocido, created_at, updated_at)
    SELECT '+51', s.lead, s.cliente, now(), now()
    FROM src s
    ON CONFLICT (prefijo, lead) DO UPDATE
    SET nombre_conocido = COALESCE(NULLIF(contacto.nombre_conocido, ''), EXCLUDED.nombre_conocido),
        updated_at = now()
    RETURNING id, lead
), src_ready AS (
    SELECT
        s.lead,
        s.tipo_documento,
        s.documento,
        s.cliente,
        s.celular_registro,
        s.celular_referencia,
        s.departamento,
        s.direccion,
        s.fecha_instalacion::date AS fecha_instalacion,
        s.plan_snapshot,
        s.precio_final::numeric(38, 2) AS precio_final,
        s.asesor_ventas,
        s.alias_asesor,
        s.compania,
        s.status_venta,
        s.servicio_contratado,
        s.velocidad_contratada,
        s.dispositivos_adicionales,
        s.plataforma_digital,
        s.id_plataforma::bigint AS id_plataforma,
        s.hoja_postventa,
        s.fila_postventa::integer AS fila_postventa,
        s.corte_postventa::integer AS corte_postventa,
        s.fila_ventas_bd::integer AS fila_ventas_bd,
        c.id AS id_contacto
    FROM src s
    JOIN contacto_upsert c ON c.lead = s.lead
    WHERE NOT EXISTS (
        SELECT 1
        FROM lead l
        WHERE regexp_replace(coalesce(l.lead, ''), '\D', '', 'g') = s.lead
    )
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
    FROM src_ready s
    RETURNING id, numero_documento_titular_servicio
), direccion_insert AS (
    INSERT INTO direccion (tipo_domicilio, direccion, referencia)
    SELECT
        'HOGAR',
        s.direccion,
        concat_ws(' | ', 'Backfill POSTVENTA', NULLIF(s.departamento, ''), NULLIF(s.servicio_contratado, ''), NULLIF(s.dispositivos_adicionales, ''))
    FROM src_ready s
    RETURNING id, direccion
), prepared AS (
    SELECT
        s.*,
        d.id AS id_datos_preventa,
        di.id AS id_direccion,
        row_number() OVER (ORDER BY s.hoja_postventa, s.fila_postventa) AS rn
    FROM src_ready s
    JOIN datos_insert d ON d.numero_documento_titular_servicio = s.documento
    JOIN direccion_insert di ON di.direccion = s.direccion
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
        p.precio_final,
        NULL,
        p.precio_final,
        23,
        3,
        p.id_plataforma,
        CASE
            WHEN upper(coalesce(p.status_venta, '')) LIKE '%BAJA%' THEN 'BAJA'
            WHEN upper(coalesce(p.status_venta, '')) LIKE '%SUSPEND%' THEN 'SUSPENDIDO'
            ELSE 'ACTIVO'
        END,
        (p.fecha_instalacion::timestamp AT TIME ZONE 'America/Lima'),
        (p.fecha_instalacion::timestamp AT TIME ZONE 'America/Lima'),
        now()
    FROM prepared p
    RETURNING id, lead, precio_final
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
        s.fecha_instalacion,
        'WIN',
        s.plan_snapshot,
        3,
        s.precio_final,
        'WIN',
        23,
        28,
        date_trunc('month', s.fecha_instalacion)::date,
        CASE WHEN extract(day from s.fecha_instalacion) <= 22 THEN 1 ELSE 2 END,
        CASE WHEN extract(day from s.fecha_instalacion) <= 22 THEN 'MISMO_MES' ELSE 'MES_SIGUIENTE' END,
        true,
        true,
        false,
        concat('BACKFILL_POSTVENTA_20260731 | fuente=VENTAS_BD fila ', s.fila_ventas_bd, ' / POSTVENTA ', s.hoja_postventa, ' fila ', s.fila_postventa),
        now(),
        now()
    FROM src_ready s
    JOIN lead_insert l ON l.lead = s.lead
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
        'BACKFILL_POSTVENTA_20260731 | periodo base; cierre/pagos/encuestas se reconstruyen en script posterior',
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
    (SELECT count(*) FROM src) AS fuente_19,
    (SELECT count(*) FROM lead_insert) AS leads_insertados,
    (SELECT count(*) FROM calendario_insert) AS calendarios_insertados,
    (SELECT count(*) FROM periodo_uno_insert) AS periodos_uno_insertados;

-- Validacion esperada despues del COMMIT: los 19 deben existir en POSTVENTA con calendario y periodo 1.
SELECT
    s.lead,
    l.id AS id_lead,
    l.etapa,
    l.estado,
    l.nombre_proveedor_snapshot,
    l.precio_final,
    c.fecha_instalacion,
    c.mes_corte_base,
    c.numero_corte_base,
    p.numero_periodo,
    p.estado AS estado_periodo
FROM (VALUES
        ('993893066'),
        ('955914951'),
        ('908002051'),
        ('933443348'),
        ('968375486'),
        ('944177719'),
        ('951192491'),
        ('910304594'),
        ('924144047'),
        ('977365809'),
        ('931028734'),
        ('982347106'),
        ('906332922'),
        ('928776185'),
        ('908932652'),
        ('982007651'),
        ('972531040'),
        ('965108203'),
        ('955361871')
) AS s(lead)
LEFT JOIN lead l ON regexp_replace(coalesce(l.lead, ''), '\D', '', 'g') = s.lead
LEFT JOIN calendario_facturacion_postventa c ON c.id_lead = l.id
LEFT JOIN periodo_facturacion_postventa p ON p.id_lead = l.id AND p.numero_periodo = 1
ORDER BY s.lead;

COMMIT;
