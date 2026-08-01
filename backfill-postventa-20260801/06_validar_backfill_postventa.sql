-- Validacion posterior al backfill POSTVENTA WIN.
-- Debe devolver 0 filas en la primera consulta. La segunda solo muestra distribucion del alcance.

WITH scope AS (
    SELECT
        l.id AS id_lead,
        l.id_datos_preventa,
        l.id_contacto
    FROM lead l
    JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
    WHERE c.proveedor_snapshot = 'WIN'
      AND (
          (c.mes_corte_base = date '2026-04-01' AND c.numero_corte_base = 2)
          OR (c.mes_corte_base = date '2026-05-01' AND c.numero_corte_base IN (1, 2))
          OR (c.mes_corte_base = date '2026-06-01' AND c.numero_corte_base IN (1, 2))
          OR (c.mes_corte_base = date '2026-07-01' AND c.numero_corte_base = 1)
      )
),
invalidos(campo, valor, cantidad) AS (
    SELECT 'lead.etapa', l.etapa, count(*)
    FROM lead l JOIN scope s ON s.id_lead = l.id
    WHERE l.etapa IS NOT NULL AND l.etapa NOT IN ('PREVENTA', 'VENTA', 'POSTVENTA', 'COBRANZA')
    GROUP BY l.etapa
    UNION ALL
    SELECT 'lead.estado', l.estado, count(*)
    FROM lead l JOIN scope s ON s.id_lead = l.id
    WHERE l.estado IS NOT NULL AND l.estado NOT IN ('NUEVO', 'ASIGNADO', 'EN_GESTION', 'GESTIONADO')
    GROUP BY l.estado
    UNION ALL
    SELECT 'lead.estado_cliente_postventa', l.estado_cliente_postventa, count(*)
    FROM lead l JOIN scope s ON s.id_lead = l.id
    WHERE l.estado_cliente_postventa IS NOT NULL AND l.estado_cliente_postventa NOT IN ('ACTIVO', 'BAJA', 'SUSPENDIDO')
    GROUP BY l.estado_cliente_postventa
    UNION ALL
    SELECT 'datos_preventa.tipo_documento', dp.tipo_documento, count(*)
    FROM datos_preventa dp JOIN scope s ON s.id_datos_preventa = dp.id
    WHERE dp.tipo_documento IS NOT NULL AND dp.tipo_documento NOT IN ('DNI', 'CE', 'RUC')
    GROUP BY dp.tipo_documento
    UNION ALL
    SELECT 'calendario.tipo_regla_proveedor', c.tipo_regla_proveedor, count(*)
    FROM calendario_facturacion_postventa c JOIN scope s ON s.id_lead = c.id_lead
    WHERE c.tipo_regla_proveedor IS NOT NULL AND c.tipo_regla_proveedor NOT IN ('WIN', 'CLARO', 'PERSONALIZADA')
    GROUP BY c.tipo_regla_proveedor
    UNION ALL
    SELECT 'calendario.bloque_facturacion', c.bloque_facturacion, count(*)
    FROM calendario_facturacion_postventa c JOIN scope s ON s.id_lead = c.id_lead
    WHERE c.bloque_facturacion IS NOT NULL AND c.bloque_facturacion NOT IN ('MISMO_MES', 'MES_SIGUIENTE', 'DIA_INSTALACION', 'PERSONALIZADO')
    GROUP BY c.bloque_facturacion
    UNION ALL
    SELECT 'periodo.estado', p.estado, count(*)
    FROM periodo_facturacion_postventa p JOIN scope s ON s.id_lead = p.id_lead
    WHERE p.estado IS NOT NULL AND p.estado NOT IN ('ABIERTO', 'CERRADO_PAGO_CLIENTE', 'CERRADO_PAGO_EMPRESA', 'CERRADO_BAJA', 'CERRADO_BAJA_ADEUDO')
    GROUP BY p.estado
    UNION ALL
    SELECT 'pago.aportante', pp.aportante, count(*)
    FROM pago_postventa pp
    JOIN periodo_facturacion_postventa p ON p.id = pp.id_periodo_facturacion
    JOIN scope s ON s.id_lead = p.id_lead
    WHERE pp.aportante IS NOT NULL AND pp.aportante NOT IN ('CLIENTE', 'EMPRESA')
    GROUP BY pp.aportante
    UNION ALL
    SELECT 'pago.estado', pp.estado, count(*)
    FROM pago_postventa pp
    JOIN periodo_facturacion_postventa p ON p.id = pp.id_periodo_facturacion
    JOIN scope s ON s.id_lead = p.id_lead
    WHERE pp.estado IS NOT NULL AND pp.estado NOT IN ('COMPROMETIDO', 'PAGADO_CLIENTE', 'PAGADO_EMPRESA')
    GROUP BY pp.estado
    UNION ALL
    SELECT 'pago.condicion', pp.condicion, count(*)
    FROM pago_postventa pp
    JOIN periodo_facturacion_postventa p ON p.id = pp.id_periodo_facturacion
    JOIN scope s ON s.id_lead = p.id_lead
    WHERE pp.condicion IS NOT NULL AND pp.condicion NOT IN ('NORMAL', 'REINTEGRO', 'CASHBACK_ASESOR_VENTAS', 'CASHBACK_POSTVENTA')
    GROUP BY pp.condicion
    UNION ALL
    SELECT 'encuesta.tipo_contacto', e.tipo_contacto, count(*)
    FROM encuesta_postventa e JOIN scope s ON s.id_lead = e.id_lead
    WHERE e.tipo_contacto IS NOT NULL AND e.tipo_contacto NOT IN ('LLAMADA', 'CHAT')
    GROUP BY e.tipo_contacto
    UNION ALL
    SELECT 'encuesta.tipo_encuesta', e.tipo_encuesta, count(*)
    FROM encuesta_postventa e JOIN scope s ON s.id_lead = e.id_lead
    WHERE e.tipo_encuesta IS NOT NULL AND e.tipo_encuesta NOT IN ('SATISFACCION_ASESOR', 'SATISFACCION_SERVICIO')
    GROUP BY e.tipo_encuesta
    UNION ALL
    SELECT 'encuesta.estado', e.estado, count(*)
    FROM encuesta_postventa e JOIN scope s ON s.id_lead = e.id_lead
    WHERE e.estado IS NOT NULL AND e.estado NOT IN ('PENDIENTE', 'REALIZADA', 'VENCIDA', 'OMITIDA', 'ANULADA')
    GROUP BY e.estado
    UNION ALL
    SELECT 'encuesta.status', e.status, count(*)
    FROM encuesta_postventa e JOIN scope s ON s.id_lead = e.id_lead
    WHERE e.status IS NOT NULL AND e.status NOT IN ('MALO', 'REGULAR', 'BUENO', 'EXCELENTE')
    GROUP BY e.status
    UNION ALL
    SELECT 'encuesta.prioridad', e.prioridad, count(*)
    FROM encuesta_postventa e JOIN scope s ON s.id_lead = e.id_lead
    WHERE e.prioridad IS NOT NULL AND e.prioridad NOT IN ('NORMAL', 'PROXIMA', 'URGENTE', 'VENCIDA')
    GROUP BY e.prioridad
    UNION ALL
    SELECT 'lead.nombre_plan_snapshot_con_??', l.nombre_plan_snapshot, count(*)
    FROM lead l JOIN scope s ON s.id_lead = l.id
    WHERE l.nombre_plan_snapshot LIKE '%??%'
    GROUP BY l.nombre_plan_snapshot
    UNION ALL
    SELECT 'lead.direccion_snapshot_con_??', l.direccion_snapshot, count(*)
    FROM lead l JOIN scope s ON s.id_lead = l.id
    WHERE l.direccion_snapshot LIKE '%??%'
    GROUP BY l.direccion_snapshot
    UNION ALL
    SELECT 'lead.nombre_asesor_asignado_con_??', l.nombre_asesor_asignado, count(*)
    FROM lead l JOIN scope s ON s.id_lead = l.id
    WHERE l.nombre_asesor_asignado LIKE '%??%'
    GROUP BY l.nombre_asesor_asignado
    UNION ALL
    SELECT 'datos_preventa.nombre_titular_servicio_con_??', dp.nombre_titular_servicio, count(*)
    FROM datos_preventa dp JOIN scope s ON s.id_datos_preventa = dp.id
    WHERE dp.nombre_titular_servicio LIKE '%??%'
    GROUP BY dp.nombre_titular_servicio
    UNION ALL
    SELECT 'datos_preventa.nombre_titular_servicio_numerico', dp.nombre_titular_servicio, count(*)
    FROM datos_preventa dp JOIN scope s ON s.id_datos_preventa = dp.id
    WHERE regexp_replace(coalesce(dp.nombre_titular_servicio, ''), '\s+', '', 'g') ~ '^[0-9]+$'
    GROUP BY dp.nombre_titular_servicio
    UNION ALL
    SELECT 'datos_preventa.nombre_titular_servicio_con_digitos', dp.nombre_titular_servicio, count(*)
    FROM datos_preventa dp JOIN scope s ON s.id_datos_preventa = dp.id
    WHERE coalesce(dp.nombre_titular_servicio, '') ~ '[0-9]'
    GROUP BY dp.nombre_titular_servicio
    UNION ALL
    SELECT 'contacto.nombre_conocido_con_??', ct.nombre_conocido, count(*)
    FROM contacto ct JOIN scope s ON s.id_contacto = ct.id
    WHERE ct.nombre_conocido LIKE '%??%'
    GROUP BY ct.nombre_conocido
    UNION ALL
    SELECT 'contacto.nombre_conocido_numerico', ct.nombre_conocido, count(*)
    FROM contacto ct JOIN scope s ON s.id_contacto = ct.id
    WHERE regexp_replace(coalesce(ct.nombre_conocido, ''), '\s+', '', 'g') ~ '^[0-9]+$'
    GROUP BY ct.nombre_conocido
    UNION ALL
    SELECT 'contacto.nombre_conocido_con_digitos', ct.nombre_conocido, count(*)
    FROM contacto ct JOIN scope s ON s.id_contacto = ct.id
    WHERE coalesce(ct.nombre_conocido, '') ~ '[0-9]'
    GROUP BY ct.nombre_conocido
)
SELECT * FROM invalidos ORDER BY campo, valor;

WITH scope AS (
    SELECT l.id AS id_lead, l.id_datos_preventa
    FROM lead l
    JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
    WHERE c.proveedor_snapshot = 'WIN'
      AND (
          (c.mes_corte_base = date '2026-04-01' AND c.numero_corte_base = 2)
          OR (c.mes_corte_base = date '2026-05-01' AND c.numero_corte_base IN (1, 2))
          OR (c.mes_corte_base = date '2026-06-01' AND c.numero_corte_base IN (1, 2))
          OR (c.mes_corte_base = date '2026-07-01' AND c.numero_corte_base = 1)
      )
)
SELECT 'lead.etapa' AS campo, l.etapa AS valor, count(*) AS cantidad
FROM lead l JOIN scope s ON s.id_lead = l.id
GROUP BY l.etapa
UNION ALL
SELECT 'lead.estado_cliente_postventa', l.estado_cliente_postventa, count(*)
FROM lead l JOIN scope s ON s.id_lead = l.id
GROUP BY l.estado_cliente_postventa
UNION ALL
SELECT 'datos_preventa.tipo_documento', dp.tipo_documento, count(*)
FROM datos_preventa dp JOIN scope s ON s.id_datos_preventa = dp.id
GROUP BY dp.tipo_documento
UNION ALL
SELECT 'periodo.estado', p.estado, count(*)
FROM periodo_facturacion_postventa p JOIN scope s ON s.id_lead = p.id_lead
GROUP BY p.estado
UNION ALL
SELECT 'pago.aportante', pp.aportante, count(*)
FROM pago_postventa pp
JOIN periodo_facturacion_postventa p ON p.id = pp.id_periodo_facturacion
JOIN scope s ON s.id_lead = p.id_lead
GROUP BY pp.aportante
UNION ALL
SELECT 'pago.estado', pp.estado, count(*)
FROM pago_postventa pp
JOIN periodo_facturacion_postventa p ON p.id = pp.id_periodo_facturacion
JOIN scope s ON s.id_lead = p.id_lead
GROUP BY pp.estado
UNION ALL
SELECT 'pago.condicion', pp.condicion, count(*)
FROM pago_postventa pp
JOIN periodo_facturacion_postventa p ON p.id = pp.id_periodo_facturacion
JOIN scope s ON s.id_lead = p.id_lead
GROUP BY pp.condicion
UNION ALL
SELECT 'encuesta.tipo_contacto', coalesce(e.tipo_contacto, '<NULL>'), count(*)
FROM encuesta_postventa e JOIN scope s ON s.id_lead = e.id_lead
GROUP BY e.tipo_contacto
UNION ALL
SELECT 'encuesta.tipo_encuesta', e.tipo_encuesta, count(*)
FROM encuesta_postventa e JOIN scope s ON s.id_lead = e.id_lead
GROUP BY e.tipo_encuesta
UNION ALL
SELECT 'encuesta.estado', e.estado, count(*)
FROM encuesta_postventa e JOIN scope s ON s.id_lead = e.id_lead
GROUP BY e.estado
UNION ALL
SELECT 'encuesta.status', coalesce(e.status, '<NULL>'), count(*)
FROM encuesta_postventa e JOIN scope s ON s.id_lead = e.id_lead
GROUP BY e.status
UNION ALL
SELECT 'encuesta.prioridad', e.prioridad, count(*)
FROM encuesta_postventa e JOIN scope s ON s.id_lead = e.id_lead
GROUP BY e.prioridad
ORDER BY campo, valor;
