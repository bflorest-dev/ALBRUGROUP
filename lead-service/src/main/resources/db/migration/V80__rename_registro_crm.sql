-- V80: Renombra el hito "ingreso venta" a "registro CRM" para que el nombre sea explícito.
-- El campo NO era el ingreso a la etapa VENTA (eso vive en lead_etapa_resumen.fecha_ingreso_etapa),
-- sino el momento en que se usa la tipificación INGRESADO de la matriz. Se renombra en 3 lugares:
--   1) columna lead_seguimiento.fecha_ingreso_venta   -> fecha_registro_crm
--   2) valor del comportamiento en subtipificacion_comportamiento: REGISTRA_INGRESO_VENTA -> REGISTRA_CRM
--   3) (en código) enum TipoFechaRelevanteVenta.INGRESO_VENTA -> REGISTRO_CRM (sin dato en BD)
--
-- NOTA DE DESPLIEGUE: el comportamiento vive en la matriz de tipificaciones cacheada en Redis.
-- Tras aplicar esta migración hay que FLUSHear la caché con el servicio abajo (ver CLAUDE.md).

-- 1) Rename de columna (preserva datos).
ALTER TABLE lead_seguimiento RENAME COLUMN fecha_ingreso_venta TO fecha_registro_crm;

-- 2) Rename del valor del comportamiento almacenado (lo insertó V74).
UPDATE subtipificacion_comportamiento
SET comportamiento = 'REGISTRA_CRM'
WHERE comportamiento = 'REGISTRA_INGRESO_VENTA';
