\set ON_ERROR_STOP on

-- Backfill POSTVENTA 2026-07-31 / Script 04
-- Objetivo: pasar a POSTVENTA 60 leads que actualmente estan en VENTA.
-- Criterio acordado: al estar en VENTA, se conservan sus datos comerciales organicos y
-- se regulariza la fecha de instalacion para inicializar calendario, periodo 1 y encuesta inicial.
-- Para documento/cliente se toma POSTVENTA_ALBRU.xlsx, validado contra VENTAS_BD.xlsx.

BEGIN;

WITH src(
    id_lead, lead, documento_excel, cliente_excel, departamento, fecha_instalacion,
    corte_postventa, hoja_postventa, fila_postventa, status_cliente_excel,
    plan_bd, precio_final_excel, documento_bd
) AS (
    VALUES
        (25589, '981996586', '74719300', 'GEANELLA NICOLLE EMELY PEREZ VASQUEZ', 'LIMA', '2026-06-02', 1, '26JUN', 16, 'ACTIVO', 'WIN PRO', 99.90, '74719300'),
        (25538, '912435463', '42930282', 'LEYDDY SILVIA MESIAS MENACHO', 'LIMA', '2026-06-03', 1, '26JUN', 20, 'ACTIVO', 'WIN PRO', 109.80, '42930282'),
        (25548, '956248318', '60977469', 'JOHAN ADRIANO OSORIO CACHIQUE', 'LIMA', '2026-06-03', 1, '26JUN', 21, 'ACTIVO', 'PROMO WIN DGO FULL', 245.00, '60977469'),
        (25627, '973112068', '43972628', 'CESAR CALLALLI MESONES', 'LIMA', '2026-06-03', 1, '26JUN', 22, 'ACTIVO', 'PROMO WIN DGO FULL', 245.00, '43972628'),
        (25657, '965298691', '16704132', 'LILIANA MORALES RAMIREZ DE VALLEJOS', 'LIMA', '2026-06-03', 1, '26JUN', 23, 'ACTIVO', 'WIN PRO', 99.90, '16704132'),
        (25633, '972761911', '25840097', 'JUAN GABRIEL RAMIREZ NIEVES', 'LIMA', '2026-06-03', 1, '26JUN', 24, 'ACTIVO', 'WIN PRO', 99.90, '25840097'),
        (23477, '988807097', '70377969', 'NATALY NOEMI DOLORES MEDINA', 'LIMA', '2026-06-03', 1, '26JUN', 26, 'ACTIVO', 'PROMO WIN DGO HOGAR', 197.90, '70377969'),
        (25639, '987955750', '10491362', 'EDWIN ANTONIO DIAZ CASTRO', 'LIMA', '2026-06-03', 1, '26JUN', 27, 'ACTIVO', 'PROMO WIN DGO HOGAR', 203.00, '1049136'),
        (25636, '926328962', '005424372', 'DEIWY WALMORE PEREZ RIVAS', 'LIMA', '2026-06-03', 1, '26JUN', 28, 'ACTIVO', 'WIN PRO', 114.90, '005424372'),
        (25664, '958384525', '74549121', 'GERARDO WALTER SALAZAR CABALLERO', 'LIMA', '2026-06-03', 1, '26JUN', 29, 'SUSPENDIDO', 'WIN PRO + DGO FULL', 219.90, '74549121'),
        (25505, '938422168', '73035225', 'TOMAS AUGUSTO SAAVEDRA GUTIERREZ', 'LIMA', '2026-06-03', 1, '26JUN', 30, 'ACTIVO', 'PROMO WIN DGO HOGAR', 232.90, '73035225'),
        (25644, '944557627', '15403605', 'JULIO CESAR ALCALA MALASQUEZ', 'LIMA', '2026-06-03', 1, '26JUN', 33, 'ACTIVO', 'PROMO WIN DGO HOGAR', 203.00, '15403605'),
        (25663, '982845573', '09344666', 'DANISA VELASQUEZ VILLA', 'LIMA', '2026-06-04', 1, '26JUN', 35, 'ACTIVO', 'WIN PRO', 99.90, '09344666'),
        (25671, '974400534', '42430831', 'KATTY SANCHEZ GARAY', 'LIMA', '2026-06-04', 1, '26JUN', 36, 'ACTIVO', 'WIN PRO + WINTV PREMIUM', 139.90, '42430831'),
        (25730, '966297527', '71017523', 'RODRIGO PAREDES SANCHEZ', 'LIMA', '2026-06-04', 1, '26JUN', 39, 'ACTIVO', 'PROMO WIN DGO FULL', 234.80, '71017523'),
        (25734, '960370164', '70327873', 'FLOR GISELA CABALLERO LUCHO', 'LIMA', '2026-06-04', 1, '26JUN', 40, 'ACTIVO', 'WIN PRO', 99.90, '70327873'),
        (25741, '929869418', '47915183', 'WESLYN VICENTE PEREZ JURADO', 'LIMA', '2026-06-04', 1, '26JUN', 41, 'ACTIVO', 'WIN PRO', 114.90, '47915183'),
        (25651, '956052782', '26681595', 'JUAN RAMON PAREDES SAENZ', 'LA LIBERTAD', '2026-06-04', 1, '26JUN', 43, 'ACTIVO', 'PROMO WIN DGO FULL', 234.80, '26681595'),
        (25679, '982099821', '44906399', 'JHON KEVIN MEZA GARCIA', 'LIMA', '2026-06-04', 1, '26JUN', 44, 'ACTIVO', 'WIN PRO', 99.90, '44906399'),
        (25655, '970132031', '47992468', 'DAVID ARTURO YUMBATO LOPEZ', 'LIMA', '2026-06-05', 1, '26JUN', 45, 'ACTIVO', 'WIN PRO', 99.90, '47992468'),
        (2529, '951262219', '42780079', 'ROCIO ELIZABETH PAJAR SEDANO DE ESCOBAL', 'LIMA', '2026-06-05', 1, '26JUN', 48, 'ACTIVO', 'WIN PRO', 114.90, '42780079'),
        (25776, '997538793', '45870421', 'OSCAR FERNANDO ALEDO UEMA', 'LIMA', '2026-06-05', 1, '26JUN', 49, 'ACTIVO', 'WIN PRO', 99.00, '45870421'),
        (25777, '953888138', '29713125', 'VERONICA GUADALUPE QUILLA BEATO', 'LIMA', '2026-06-05', 1, '26JUN', 51, 'ACTIVO', 'WIN PRO + WINTV PREMIUM', 119.90, '29713125'),
        (25697, '992102158', '07445457', 'CARLOS MORAN VILCHEZ', 'LIMA', '2026-06-05', 1, '26JUN', 52, 'ACTIVO', 'PROMO WIN DGO FULL', 254.90, '07445457'),
        (25569, '940493782', '76980564', 'CLAUDIA XIMENA YABIKU CHAVARRIA', 'LIMA', '2026-06-05', 1, '26JUN', 54, 'ACTIVO', 'WIN PRO', 99.00, '41304453'),
        (25781, '989092872', '44307992', 'BERTHA ELIZABETH HURTADO FERNANDEZ', 'LIMA', '2026-06-05', 1, '26JUN', 55, 'ACTIVO', 'PROMO WIN DGO HOGAR', 188.00, '44307992'),
        (25599, '923525037', '08231778', 'OSCAR ALFREDO ORESTES ZEGARRA VALENCIA', 'LIMA', '2026-06-05', 1, '26JUN', 57, 'SUSPENDIDO', 'PROMO WIN DGO FULL', 239.90, '08231778'),
        (25539, '912315022', '10495450', 'ARNALDO OSCAR CONDOR EUSEBIO', 'LIMA', '2026-06-05', 1, '26JUN', 58, 'ACTIVO', 'PROMO WIN DGO HOGAR', 188.00, '10495450'),
        (25637, '968707524', '73414302', 'ROBERTO PAULO ROSSI CARRANZA MEJIA', 'LIMA', '2026-06-05', 1, '26JUN', 60, 'ACTIVO', 'WIN PRO', 99.00, '73414302'),
        (25800, '954156895', '71719473', 'ROGER CUEVA PEÑA', 'PIURA', '2026-06-05', 1, '26JUN', 61, 'ACTIVO', 'PROMO PROVINCIA DGO HOGAR', 144.90, '71719473'),
        (25701, '910816194', '70869855', 'RENZO NEFTALI REATEGUI PEREYRA', 'LIMA', '2026-06-06', 1, '26JUN', 63, 'ACTIVO', 'WIN PRO', 99.90, '70869855'),
        (25611, '992796390', '10635452', 'GERMAN ADOLFO LEDESMA GURREONERO', 'LIMA', '2026-06-06', 1, '26JUN', 64, 'ACTIVO', 'PROMO WIN DGO HOGAR', 203.00, '10635452'),
        (25575, '989753551', '08053674', 'NESTOR ELVER MUGRUZA ZUÑIGA', 'LIMA', '2026-06-06', 1, '26JUN', 65, 'ACTIVO', 'PROMO WIN DGO HOGAR', 188.00, '08053674'),
        (25749, '987827711', '46101253', 'MILAGROS DEL PILAR ICOCHEA PEÑA', 'LIMA', '2026-06-06', 1, '26JUN', 67, 'ACTIVO', 'WIN PRO', 99.90, '46101253'),
        (25284, '960589713', '15666634', 'AZUCENA MARGARITA PINEDA REYES', 'LIMA', '2026-06-06', 1, '26JUN', 68, 'ACTIVO', 'WIN PRO + WINTV PREMIUM', 109.90, '15666634'),
        (25826, '981537162', '71668739', 'DIEGO ROMERO NERVI', 'LIMA', '2026-06-07', 1, '26JUN', 71, 'ACTIVO', 'WIN PRO + WINTV PREMIUM', 119.90, '71668739'),
        (25857, '948860600', '25810131', 'CARMEN JULIA ALEMAN PAIS', 'LIMA', '2026-06-07', 1, '26JUN', 73, 'ACTIVO', 'WIN PRO', 109.00, '25810131'),
        (25864, '992451002', '09271169', 'SONIA DEL PILAR TORRES CHAUCA', 'LIMA', '2026-06-07', 1, '26JUN', 74, 'ACTIVO', 'WIN PRO', 99.90, '09271169'),
        (25869, '965769079', '10719062', 'CARMEN ROXANA ALCANTARA PAHUACHON', 'LIMA', '2026-06-07', 1, '26JUN', 75, 'ACTIVO', 'WIN PRO + WINTV PREMIUM', 139.90, '10719062'),
        (25839, '982442437', '44738996', 'EDGAR PRIMO MENDOZA', 'LIMA', '2026-06-08', 1, '26JUN', 76, 'ACTIVO', 'WIN PRO', 109.00, '44738996'),
        (25888, '901307744', '76174334', 'ANGIE KASSANDRA ROJAS MITMA', 'LIMA', '2026-06-08', 1, '26JUN', 77, 'ACTIVO', 'WIN PRO', 99.90, '76174334'),
        (25894, '953415310', '75850853', 'JUAN DANIEL VASQUEZ RENGIFO', 'LIMA', '2026-06-08', 1, '26JUN', 78, 'ACTIVO', 'PROMO WIN DGO HOGAR', 232.90, '75850853'),
        (25904, '974834163', '46404389', 'DIEGO ANTONIO RAMIREZ BOLIVAR', 'LIMA', '2026-06-08', 1, '26JUN', 79, 'ACTIVO', 'WIN PRO', 108.90, '46404389'),
        (25508, '999349026', '76182977', 'GRISSELLE DANIA RAMIREZ PALACIOS', 'LIMA', '2026-06-08', 1, '26JUN', 80, 'ACTIVO', 'PROMO WINTV L1MAX PREMIUM', 168.50, '76182977'),
        (25659, '935693763', '77078510', 'MONICA GIULIANNA GONZALES ANGERMÜLLER', 'LIMA', '2026-06-08', 1, '26JUN', 81, 'ACTIVO', 'PROMO WIN DGO HOGAR', 197.90, '77078510'),
        (25824, '984375891', '45953701', 'FREDERICK ARTHURS TITO APAZA', 'LIMA', '2026-06-08', 1, '26JUN', 82, 'ACTIVO', 'PROMO WIN DGO FULL', 215.00, '45953701'),
        (25845, '903228520', '71282165', 'GIANNINA YOLANDA CACERES PEREZ', 'LIMA', '2026-06-09', 1, '26JUN', 83, 'ACTIVO', 'PROMO WIN DGO HOGAR', 188.00, '70896110'),
        (25743, '989070141', '74731753', 'AYMAR ANTHONY VARGAS CUBAS', 'LIMA', '2026-06-09', 1, '26JUN', 84, 'ACTIVO', 'WIN PRO', 99.90, '74731753'),
        (25928, '977927308', '71537511', 'SEBASTIAN JOAQUIN FREYRE VICENTE', 'LIMA', '2026-06-09', 1, '26JUN', 85, 'ACTIVO', 'WIN PRO', 99.00, '71537511'),
        (25938, '959296004', '70121468', 'EDUARDO ANDREE MORALES ROMERO', 'LIMA', '2026-06-09', 1, '26JUN', 86, 'ACTIVO', 'WIN PRO', 99.90, '70121468'),
        (25952, '970135970', '76990419', 'LUIS FERNANDO RAMIREZ MATOS', 'LIMA', '2026-06-09', 1, '26JUN', 89, 'ACTIVO', 'PROMO WIN DGO HOGAR', 197.90, '76990419'),
        (25884, '999851660', '20504851703', 'KLIMA AIR SAC', 'LIMA', '2026-06-09', 1, '26JUN', 91, 'ACTIVO', 'PROMO WINTV L1MAX PREMIUM', 163.40, '16496645'),
        (25902, '989556609', '72041392', 'YADHIRA REYNA ARISMENDIZ HERRERA', 'LIMA', '2026-06-09', 1, '26JUN', 94, 'ACTIVO', 'WIN PRO', 99.90, '72041392'),
        (25993, '955727128', '09502145', 'MARIA DEL ROSARIO AGURTO CAMPOS', 'LIMA', '2026-06-10', 1, '26JUN', 98, 'ACTIVO', 'PROMO WINTV L1MAX PREMIUM', 153.50, '09502145'),
        (25812, '959091531', '76805524', 'NATHALIA NICOL OREJUELA ESPINOZA', 'LIMA', '2026-06-10', 1, '26JUN', 99, 'ACTIVO', 'WIN PRO', 119.00, '76805524'),
        (25985, '941127555', '42520185', 'JESUS EDUARDO ESTRADA PEÑA', 'LIMA', '2026-06-10', 1, '26JUN', 100, 'ACTIVO', 'PROMO WIN DGO HOGAR', 203.00, '42520185'),
        (25868, '901947293', '48875728', 'JUAN CARLOS ALVAREZ FLORES', 'LIMA', '2026-06-10', 1, '26JUN', 106, 'ACTIVO', 'PROMO WIN DGO HOGAR', 203.00, '48875728'),
        (25954, '979321685', '10267598', 'MARISOL ZARIQUIEY VALLE RIESTRA DE GRAHAMMER', 'LIMA', '2026-06-11', 1, '26JUN', 112, 'ACTIVO', 'PROMO WIN DGO HOGAR', 197.90, '10267598'),
        (25790, '988291998', '45630293', 'NATHIA LIZETH MEGO TORRES', 'LIMA', '2026-06-13', 1, '26JUN', 125, 'ACTIVO', 'PROMO WIN DGO HOGAR', 197.90, '45630293'),
        (25618, '966452049', '47025759', 'JOSE GIANCARLOS PADILLA SOTO', 'LIMA', '2026-06-13', 1, '26JUN', 129, 'ACTIVO', 'WIN PRO', 99.90, '47025759')
), src_ready AS (
    SELECT
        s.*,
        s.fecha_instalacion::date AS fecha_instalacion_date,
        s.precio_final_excel::numeric(38, 2) AS precio_final_num
    FROM src s
), datos_update AS (
    UPDATE datos_preventa dp
    SET
        numero_documento_titular_servicio = s.documento_excel,
        nombre_titular_servicio = s.cliente_excel
    FROM src_ready s
    JOIN lead l ON l.id = s.id_lead
    WHERE dp.id = l.id_datos_preventa
      AND (
          dp.numero_documento_titular_servicio IS DISTINCT FROM s.documento_excel
          OR dp.nombre_titular_servicio IS DISTINCT FROM s.cliente_excel
      )
    RETURNING dp.id
), lead_update AS (
    UPDATE lead l
    SET
        etapa = 'POSTVENTA',
        estado = 'NUEVO',
        id_asesor_asignado = NULL,
        nombre_asesor_asignado = NULL,
        id_tipificacion = NULL,
        codigo_tipificacion = NULL,
        id_subtipificacion = NULL,
        codigo_subtipificacion = NULL,
        numero_documento_titular_servicio_snapshot = s.documento_excel,
        nombre_proveedor_snapshot = 'WIN',
        nombre_plan_snapshot = coalesce(NULLIF(l.nombre_plan_snapshot, ''), s.plan_bd),
        precio_plan_snapshot = coalesce(l.precio_plan_snapshot, s.precio_final_num),
        precio_final = coalesce(l.precio_final, s.precio_final_num),
        dia_corte_facturacion = 23,
        meses_permanencia_snapshot = 3,
        estado_cliente_postventa = CASE
            WHEN upper(coalesce(s.status_cliente_excel, '')) LIKE '%BAJA%' THEN 'BAJA'
            WHEN upper(coalesce(s.status_cliente_excel, '')) LIKE '%SUSPEND%' THEN 'SUSPENDIDO'
            ELSE 'ACTIVO'
        END,
        last_entry_at = now(),
        updated_at = now()
    FROM src_ready s
    WHERE l.id = s.id_lead
      AND l.etapa = 'VENTA'
    RETURNING
        l.id,
        l.lead,
        s.documento_excel,
        s.fecha_instalacion_date,
        coalesce(NULLIF(l.nombre_plan_snapshot, ''), s.plan_bd) AS plan_snapshot,
        coalesce(l.precio_final, s.precio_final_num) AS precio_final,
        s.hoja_postventa,
        s.fila_postventa
), normalized_leads AS (
    SELECT * FROM lead_update
    UNION ALL
    SELECT
        l.id,
        l.lead,
        s.documento_excel,
        s.fecha_instalacion_date,
        coalesce(NULLIF(l.nombre_plan_snapshot, ''), s.plan_bd) AS plan_snapshot,
        coalesce(l.precio_final, s.precio_final_num) AS precio_final,
        s.hoja_postventa,
        s.fila_postventa
    FROM src_ready s
    JOIN lead l ON l.id = s.id_lead
    JOIN datos_preventa dp ON dp.id = l.id_datos_preventa
    WHERE l.etapa = 'POSTVENTA'
      AND dp.numero_documento_titular_servicio = s.documento_excel
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
        l.precio_final,
        'WIN',
        23,
        28,
        date_trunc('month', l.fecha_instalacion_date)::date,
        CASE WHEN extract(day from l.fecha_instalacion_date) <= 22 THEN 1 ELSE 2 END,
        CASE WHEN extract(day from l.fecha_instalacion_date) <= 22 THEN 'MISMO_MES' ELSE 'MES_SIGUIENTE' END,
        true,
        true,
        false,
        concat('BACKFILL_POSTVENTA_20260731_VENTA | POSTVENTA ', l.hoja_postventa, ' fila ', l.fila_postventa),
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
        'BACKFILL_POSTVENTA_20260731_VENTA | periodo base; cierre/pagos/encuestas se reconstruyen en script posterior',
        now(),
        now()
    FROM calendario_insert c
    WHERE NOT EXISTS (
        SELECT 1
        FROM periodo_facturacion_postventa p
        WHERE p.id_lead = c.id_lead AND p.numero_periodo = 1
    )
    RETURNING id, id_lead
), encuesta_insert AS (
    INSERT INTO encuesta_postventa (
        id_lead,
        tipo_encuesta,
        estado,
        prioridad,
        fecha_programada,
        fecha_limite,
        numero_encuesta,
        created_at,
        updated_at
    )
    SELECT
        p.id_lead,
        'SATISFACCION_ASESOR',
        'PENDIENTE',
        'NORMAL',
        now() AT TIME ZONE 'America/Lima',
        (now() AT TIME ZONE 'America/Lima') + interval '48 hours',
        1,
        now(),
        now()
    FROM periodo_uno_insert p
    WHERE NOT EXISTS (
        SELECT 1
        FROM encuesta_postventa e
        WHERE e.id_lead = p.id_lead AND e.numero_encuesta = 1
    )
    RETURNING id
)
SELECT
    (SELECT count(*) FROM src) AS fuente_60,
    (SELECT count(*) FROM datos_update) AS datos_preventa_actualizados,
    (SELECT count(*) FROM lead_update) AS leads_venta_actualizados,
    (SELECT count(*) FROM calendario_insert) AS calendarios_insertados,
    (SELECT count(*) FROM periodo_uno_insert) AS periodos_uno_insertados,
    (SELECT count(*) FROM encuesta_insert) AS encuestas_iniciales_insertadas;

-- Validacion esperada: deben existir 60 leads POSTVENTA con calendario, periodo 1 y encuesta inicial.
SELECT
    count(*) AS leads_validados
FROM (VALUES
        (25589, '981996586', '74719300'),
        (25538, '912435463', '42930282'),
        (25548, '956248318', '60977469'),
        (25627, '973112068', '43972628'),
        (25657, '965298691', '16704132'),
        (25633, '972761911', '25840097'),
        (23477, '988807097', '70377969'),
        (25639, '987955750', '10491362'),
        (25636, '926328962', '005424372'),
        (25664, '958384525', '74549121'),
        (25505, '938422168', '73035225'),
        (25644, '944557627', '15403605'),
        (25663, '982845573', '09344666'),
        (25671, '974400534', '42430831'),
        (25730, '966297527', '71017523'),
        (25734, '960370164', '70327873'),
        (25741, '929869418', '47915183'),
        (25651, '956052782', '26681595'),
        (25679, '982099821', '44906399'),
        (25655, '970132031', '47992468'),
        (2529, '951262219', '42780079'),
        (25776, '997538793', '45870421'),
        (25777, '953888138', '29713125'),
        (25697, '992102158', '07445457'),
        (25569, '940493782', '76980564'),
        (25781, '989092872', '44307992'),
        (25599, '923525037', '08231778'),
        (25539, '912315022', '10495450'),
        (25637, '968707524', '73414302'),
        (25800, '954156895', '71719473'),
        (25701, '910816194', '70869855'),
        (25611, '992796390', '10635452'),
        (25575, '989753551', '08053674'),
        (25749, '987827711', '46101253'),
        (25284, '960589713', '15666634'),
        (25826, '981537162', '71668739'),
        (25857, '948860600', '25810131'),
        (25864, '992451002', '09271169'),
        (25869, '965769079', '10719062'),
        (25839, '982442437', '44738996'),
        (25888, '901307744', '76174334'),
        (25894, '953415310', '75850853'),
        (25904, '974834163', '46404389'),
        (25508, '999349026', '76182977'),
        (25659, '935693763', '77078510'),
        (25824, '984375891', '45953701'),
        (25845, '903228520', '71282165'),
        (25743, '989070141', '74731753'),
        (25928, '977927308', '71537511'),
        (25938, '959296004', '70121468'),
        (25952, '970135970', '76990419'),
        (25884, '999851660', '20504851703'),
        (25902, '989556609', '72041392'),
        (25993, '955727128', '09502145'),
        (25812, '959091531', '76805524'),
        (25985, '941127555', '42520185'),
        (25868, '901947293', '48875728'),
        (25954, '979321685', '10267598'),
        (25790, '988291998', '45630293'),
        (25618, '966452049', '47025759')
) AS s(id_lead, lead, documento)
JOIN lead l ON l.id = s.id_lead AND l.lead = s.lead
JOIN datos_preventa dp ON dp.id = l.id_datos_preventa
    AND dp.numero_documento_titular_servicio = s.documento
JOIN calendario_facturacion_postventa c ON c.id_lead = l.id
JOIN periodo_facturacion_postventa p ON p.id_lead = l.id AND p.numero_periodo = 1
JOIN encuesta_postventa e ON e.id_lead = l.id AND e.numero_encuesta = 1
WHERE l.etapa = 'POSTVENTA'
  AND l.estado = 'NUEVO'
  AND l.nombre_proveedor_snapshot = 'WIN'
  AND p.estado = 'ABIERTO';

COMMIT;
