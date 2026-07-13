-- Comportamientos de tipificación (data-driven) — reemplazan los códigos hardcodeados.
--
-- Cada subtipificación puede tener un conjunto de comportamientos (ver enum ComportamientoTipificacion).
-- El código ya no compara nombres de tipi ('AGENDADO', 'SUBIDO', …): lee este conjunto. Así renombrar
-- una tipi deja de romper la lógica asociada.
--
-- Esta migración crea la tabla del @ElementCollection y la siembra a partir de los códigos ACTUALES de
-- las 4 matrices, para que el comportamiento no cambie al desplegar. Excepciones intencionales (decididas):
--   * Mérito de venta: se unifica en RECIBE_MERITO. En PREVENTA lo recibe quien usa VENTA_CERRADA (se
--     siembra). En VENTA hoy no se atribuía (el viejo 'GRABADO' era subtipi, no tipi) → NO se siembra; se
--     marcará la subtipi VENTA_INSTALADA en la matriz nueva desde el editor.
--   * Score preventa: no tenía comportamiento efectivo → no se crea flag ni se siembra.
--   * Cierre de preventa: solo VENTA_CERRADA (no VC_SIGUIENTE_MES).
--
-- Flyway ejecuta el script dentro de una transacción (no usar BEGIN/COMMIT).

CREATE TABLE IF NOT EXISTS subtipificacion_comportamiento (
    subtipificacion_id BIGINT       NOT NULL REFERENCES subtipificacion(id),
    comportamiento     VARCHAR(255) NOT NULL,
    PRIMARY KEY (subtipificacion_id, comportamiento)
);

-- REQUIERE_HORA_PROGRAMADA: AGENDADO (PREVENTA) y PROGRAMADO (VENTA).
INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT s.id, 'REQUIERE_HORA_PROGRAMADA'
FROM subtipificacion s JOIN tipificacion t ON t.id = s.tipificacion_id
WHERE s.activo AND t.activo
  AND ((t.etapa = 'PREVENTA' AND t.codigo = 'AGENDADO') OR (t.etapa = 'VENTA' AND t.codigo = 'PROGRAMADO'))
ON CONFLICT DO NOTHING;

-- APARECE_EN_AGENDADOS_GTR: AGENDADO (PREVENTA). (Lectura diferida; solo se siembra.)
INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT s.id, 'APARECE_EN_AGENDADOS_GTR'
FROM subtipificacion s JOIN tipificacion t ON t.id = s.tipificacion_id
WHERE s.activo AND t.activo AND t.etapa = 'PREVENTA' AND t.codigo = 'AGENDADO'
ON CONFLICT DO NOTHING;

-- REQUIERE_FECHA_PROGRAMACION: PROGRAMADO (VENTA).
INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT s.id, 'REQUIERE_FECHA_PROGRAMACION'
FROM subtipificacion s JOIN tipificacion t ON t.id = s.tipificacion_id
WHERE s.activo AND t.activo AND t.etapa = 'VENTA' AND t.codigo = 'PROGRAMADO'
ON CONFLICT DO NOTHING;

-- REQUIERE_SEC_SOT: SUBIDO (VENTA).
INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT s.id, 'REQUIERE_SEC_SOT'
FROM subtipificacion s JOIN tipificacion t ON t.id = s.tipificacion_id
WHERE s.activo AND t.activo AND t.etapa = 'VENTA' AND t.codigo = 'SUBIDO'
ON CONFLICT DO NOTHING;

-- REQUIERE_FECHA_INSTALACION: subtipis de VENTA que pasan a POSTVENTA (hoy INSTALADO/INSTALADA).
INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT s.id, 'REQUIERE_FECHA_INSTALACION'
FROM subtipificacion s JOIN tipificacion t ON t.id = s.tipificacion_id
WHERE s.activo AND t.activo AND t.etapa = 'VENTA' AND s.etapa_cambio = 'POSTVENTA'
ON CONFLICT DO NOTHING;

-- ES_CANCELACION_PROGRAMACION: subtip PROGRAMACION_CANCELADA. (Lectura diferida; solo se siembra.)
INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT s.id, 'ES_CANCELACION_PROGRAMACION'
FROM subtipificacion s JOIN tipificacion t ON t.id = s.tipificacion_id
WHERE s.activo AND t.activo AND s.codigo = 'PROGRAMACION_CANCELADA'
ON CONFLICT DO NOTHING;

-- ES_CIERRE_PREVENTA: solo la subtipi VENTA_CERRADA de PREVENTA_COMPLETA.
INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT s.id, 'ES_CIERRE_PREVENTA'
FROM subtipificacion s JOIN tipificacion t ON t.id = s.tipificacion_id
WHERE s.activo AND t.activo AND t.etapa = 'PREVENTA' AND t.codigo = 'PREVENTA_COMPLETA' AND s.codigo = 'VENTA_CERRADA'
ON CONFLICT DO NOTHING;

-- RECIBE_MERITO (PREVENTA): quien usa VENTA_CERRADA. (VENTA se marcará luego sobre VENTA_INSTALADA.)
INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT s.id, 'RECIBE_MERITO'
FROM subtipificacion s JOIN tipificacion t ON t.id = s.tipificacion_id
WHERE s.activo AND t.activo AND t.etapa = 'PREVENTA' AND t.codigo = 'PREVENTA_COMPLETA' AND s.codigo = 'VENTA_CERRADA'
ON CONFLICT DO NOTHING;
