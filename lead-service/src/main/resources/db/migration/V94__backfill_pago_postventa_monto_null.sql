-- V94: Cambio de semántica de monto en pago_postventa.
-- monto pasa a representar exclusivamente la inversión de la empresa.
-- Todos los montos existentes reflejaban el valor de la factura, no inversión real.
-- El postventa los re-ingresará manualmente cuando corresponda.
UPDATE pago_postventa SET monto = NULL;

-- Corregir aportante de CASHBACK_ASESOR_VENTAS: pasa de CLIENTE a EMPRESA
UPDATE pago_postventa SET aportante = 'EMPRESA'
WHERE condicion = 'CASHBACK_ASESOR_VENTAS' AND aportante = 'CLIENTE';
