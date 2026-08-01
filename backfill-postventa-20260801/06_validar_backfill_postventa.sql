-- Validacion posterior al backfill POSTVENTA.
-- Debe devolver 0 filas en la primera consulta. La segunda solo muestra distribucion.

WITH invalidos(campo, valor, cantidad) AS (
    SELECT 'lead.etapa', etapa, count(*) FROM lead
    WHERE etapa IS NOT NULL AND etapa NOT IN ('PREVENTA', 'VENTA', 'POSTVENTA', 'COBRANZA')
    GROUP BY etapa
    UNION ALL
    SELECT 'lead.estado', estado, count(*) FROM lead
    WHERE estado IS NOT NULL AND estado NOT IN ('NUEVO', 'ASIGNADO', 'EN_GESTION', 'GESTIONADO')
    GROUP BY estado
    UNION ALL
    SELECT 'lead.estado_cliente_postventa', estado_cliente_postventa, count(*) FROM lead
    WHERE estado_cliente_postventa IS NOT NULL AND estado_cliente_postventa NOT IN ('ACTIVO', 'BAJA', 'SUSPENDIDO')
    GROUP BY estado_cliente_postventa
    UNION ALL
    SELECT 'datos_preventa.tipo_documento', tipo_documento, count(*) FROM datos_preventa
    WHERE tipo_documento IS NOT NULL AND tipo_documento NOT IN ('DNI', 'CE', 'RUC')
    GROUP BY tipo_documento
    UNION ALL
    SELECT 'calendario.tipo_regla_proveedor', tipo_regla_proveedor, count(*) FROM calendario_facturacion_postventa
    WHERE tipo_regla_proveedor IS NOT NULL AND tipo_regla_proveedor NOT IN ('WIN', 'CLARO', 'PERSONALIZADA')
    GROUP BY tipo_regla_proveedor
    UNION ALL
    SELECT 'calendario.bloque_facturacion', bloque_facturacion, count(*) FROM calendario_facturacion_postventa
    WHERE bloque_facturacion IS NOT NULL AND bloque_facturacion NOT IN ('MISMO_MES', 'MES_SIGUIENTE', 'DIA_INSTALACION', 'PERSONALIZADO')
    GROUP BY bloque_facturacion
    UNION ALL
    SELECT 'periodo.estado', estado, count(*) FROM periodo_facturacion_postventa
    WHERE estado IS NOT NULL AND estado NOT IN ('ABIERTO', 'CERRADO_PAGO_CLIENTE', 'CERRADO_PAGO_EMPRESA', 'CERRADO_BAJA', 'CERRADO_BAJA_ADEUDO')
    GROUP BY estado
    UNION ALL
    SELECT 'pago.aportante', aportante, count(*) FROM pago_postventa
    WHERE aportante IS NOT NULL AND aportante NOT IN ('CLIENTE', 'EMPRESA')
    GROUP BY aportante
    UNION ALL
    SELECT 'pago.estado', estado, count(*) FROM pago_postventa
    WHERE estado IS NOT NULL AND estado NOT IN ('COMPROMETIDO', 'PAGADO_CLIENTE', 'PAGADO_EMPRESA')
    GROUP BY estado
    UNION ALL
    SELECT 'pago.condicion', condicion, count(*) FROM pago_postventa
    WHERE condicion IS NOT NULL AND condicion NOT IN ('NORMAL', 'REINTEGRO', 'CASHBACK_ASESOR_VENTAS', 'CASHBACK_POSTVENTA')
    GROUP BY condicion
    UNION ALL
    SELECT 'encuesta.tipo_contacto', tipo_contacto, count(*) FROM encuesta_postventa
    WHERE tipo_contacto IS NOT NULL AND tipo_contacto NOT IN ('LLAMADA', 'CHAT')
    GROUP BY tipo_contacto
    UNION ALL
    SELECT 'encuesta.tipo_encuesta', tipo_encuesta, count(*) FROM encuesta_postventa
    WHERE tipo_encuesta IS NOT NULL AND tipo_encuesta NOT IN ('SATISFACCION_ASESOR', 'SATISFACCION_SERVICIO')
    GROUP BY tipo_encuesta
    UNION ALL
    SELECT 'encuesta.estado', estado, count(*) FROM encuesta_postventa
    WHERE estado IS NOT NULL AND estado NOT IN ('PENDIENTE', 'REALIZADA', 'VENCIDA', 'OMITIDA', 'ANULADA')
    GROUP BY estado
    UNION ALL
    SELECT 'encuesta.status', status, count(*) FROM encuesta_postventa
    WHERE status IS NOT NULL AND status NOT IN ('MALO', 'REGULAR', 'BUENO', 'EXCELENTE')
    GROUP BY status
    UNION ALL
    SELECT 'encuesta.prioridad', prioridad, count(*) FROM encuesta_postventa
    WHERE prioridad IS NOT NULL AND prioridad NOT IN ('NORMAL', 'PROXIMA', 'URGENTE', 'VENCIDA')
    GROUP BY prioridad
    UNION ALL
    SELECT 'lead.nombre_plan_snapshot_con_??', nombre_plan_snapshot, count(*) FROM lead
    WHERE nombre_plan_snapshot LIKE '%??%'
    GROUP BY nombre_plan_snapshot
    UNION ALL
    SELECT 'lead.direccion_snapshot_con_??', direccion_snapshot, count(*) FROM lead
    WHERE direccion_snapshot LIKE '%??%'
    GROUP BY direccion_snapshot
    UNION ALL
    SELECT 'lead.nombre_asesor_asignado_con_??', nombre_asesor_asignado, count(*) FROM lead
    WHERE nombre_asesor_asignado LIKE '%??%'
    GROUP BY nombre_asesor_asignado
    UNION ALL
    SELECT 'datos_preventa.nombre_titular_servicio_con_??', nombre_titular_servicio, count(*) FROM datos_preventa
    WHERE nombre_titular_servicio LIKE '%??%'
    GROUP BY nombre_titular_servicio
    UNION ALL
    SELECT 'contacto.nombre_conocido_con_??', nombre_conocido, count(*) FROM contacto
    WHERE nombre_conocido LIKE '%??%'
    GROUP BY nombre_conocido
)
SELECT * FROM invalidos ORDER BY campo, valor;

SELECT 'lead.etapa' AS campo, etapa AS valor, count(*) AS cantidad FROM lead
WHERE etapa IN ('POSTVENTA', 'COBRANZA')
GROUP BY etapa
UNION ALL
SELECT 'lead.estado_cliente_postventa', estado_cliente_postventa, count(*) FROM lead
WHERE estado_cliente_postventa IS NOT NULL
GROUP BY estado_cliente_postventa
UNION ALL
SELECT 'datos_preventa.tipo_documento', tipo_documento, count(*) FROM datos_preventa
WHERE tipo_documento IS NOT NULL
GROUP BY tipo_documento
UNION ALL
SELECT 'periodo.estado', estado, count(*) FROM periodo_facturacion_postventa
GROUP BY estado
UNION ALL
SELECT 'pago.aportante', aportante, count(*) FROM pago_postventa
GROUP BY aportante
UNION ALL
SELECT 'pago.estado', estado, count(*) FROM pago_postventa
GROUP BY estado
UNION ALL
SELECT 'pago.condicion', condicion, count(*) FROM pago_postventa
GROUP BY condicion
UNION ALL
SELECT 'encuesta.tipo_contacto', coalesce(tipo_contacto, '<NULL>'), count(*) FROM encuesta_postventa
GROUP BY tipo_contacto
UNION ALL
SELECT 'encuesta.tipo_encuesta', tipo_encuesta, count(*) FROM encuesta_postventa
GROUP BY tipo_encuesta
UNION ALL
SELECT 'encuesta.estado', estado, count(*) FROM encuesta_postventa
GROUP BY estado
UNION ALL
SELECT 'encuesta.status', coalesce(status, '<NULL>'), count(*) FROM encuesta_postventa
GROUP BY status
UNION ALL
SELECT 'encuesta.prioridad', prioridad, count(*) FROM encuesta_postventa
GROUP BY prioridad
ORDER BY campo, valor;
