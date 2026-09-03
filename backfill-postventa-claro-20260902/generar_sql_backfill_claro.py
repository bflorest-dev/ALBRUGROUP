import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA = ROOT / "PREBACKFILL" / "prebackfill_data.json"
OUT = ROOT / "03_backfill_completo_leads_claro.sql"


COLS = [
    "lead_numero",
    "sec",
    "sot",
    "documento",
    "tipo_documento",
    "nombre_cliente",
    "telefono_referencia",
    "correo",
    "ubigeo_nacimiento_raw",
    "direccion",
    "referencia",
    "latitud",
    "longitud",
    "plano",
    "piso",
    "interior",
    "fecha_eventos_at",
    "fecha_programacion",
    "fecha_instalacion",
    "id_equipo_final",
    "id_campana_final",
    "base_final_si_nuevo",
    "actor_id",
    "actor_nombre",
    "cliente_estado_final",
    "precio_regular",
    "plan_id",
    "plan_nombre",
    "p1_emision",
    "p1_vencimiento",
    "p1_monto",
    "p1_marcador_pago",
    "p1_estado_periodo",
    "p1_aportante",
    "p1_estado_pago",
    "p1_fecha_pago",
    "p2_emision",
    "p2_vencimiento",
    "p2_monto",
    "p2_marcador_pago",
    "p2_estado_periodo",
    "p2_aportante",
    "p2_estado_pago",
    "p2_fecha_pago",
]


def sql(value):
    if value is None or value == "":
        return "NULL"
    text = str(value)
    return "'" + text.replace("'", "''") + "'"


def row_values(row):
    values = {
        "lead_numero": row["lead"],
        "sec": row["sec"],
        "sot": row["sot"],
        "documento": row["documento"],
        "tipo_documento": row["tipo_documento"],
        "nombre_cliente": row["nombre_cliente"],
        "telefono_referencia": row["telefono_referencia"] or row["lead"],
        "correo": row["correo"],
        "ubigeo_nacimiento_raw": row["ubigeo_nacimiento_raw"],
        "direccion": row["direccion"],
        "referencia": row["referencia"],
        "latitud": row["latitud"],
        "longitud": row["longitud"],
        "plano": row["plano"],
        "piso": row["piso"],
        "interior": row["interior"],
        "fecha_eventos_at": row["fecha_eventos_preventa"],
        "fecha_programacion": row["fecha_programacion"],
        "fecha_instalacion": row["fecha_instalacion"],
        "id_equipo_final": row["equipo_final"],
        "id_campana_final": row["campana_final"],
        "base_final_si_nuevo": row["base_final_si_nuevo"],
        "actor_id": row["actor_id"],
        "actor_nombre": row["actor_nombre"],
        "cliente_estado_final": row["cliente_estado_final"] or "ACTIVO",
        "precio_regular": row["precio_regular_excel"],
        "plan_id": row["plan_id_resuelto"],
        "plan_nombre": row["plan_nombre_resuelto"],
        "p1_emision": row["p1_emision"],
        "p1_vencimiento": row["p1_vencimiento"],
        "p1_monto": row["p1_monto"],
        "p1_marcador_pago": row["p1_marcador_pago"],
        "p1_estado_periodo": row["p1_estado_periodo"],
        "p1_aportante": row["p1_aportante"],
        "p1_estado_pago": row["p1_estado_pago"],
        "p1_fecha_pago": row["p1_fecha_pago"],
        "p2_emision": row["p2_emision"],
        "p2_vencimiento": row["p2_vencimiento"],
        "p2_monto": row["p2_monto"],
        "p2_marcador_pago": row["p2_marcador_pago"],
        "p2_estado_periodo": row["p2_estado_periodo"],
        "p2_aportante": row["p2_aportante"],
        "p2_estado_pago": row["p2_estado_pago"],
        "p2_fecha_pago": row["p2_fecha_pago"],
    }
    return "(" + ", ".join(sql(values[c]) for c in COLS) + ")"


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    rows = data["details"]
    values_sql = ",\n".join(row_values(r) for r in rows)
    col_defs = ",\n    ".join(f"{c} text" for c in COLS)
    insert_cols = ", ".join(COLS)

    content = f"""-- Backfill operativo CLARO postventa.
-- Ejecutar primero como dry-run: este archivo termina con ROLLBACK.
-- Si las metricas son correctas, cambiar la ultima linea a COMMIT.

BEGIN;
SET LOCAL TIME ZONE 'America/Lima';

CREATE TEMP TABLE tmp_claro_backfill_data (
    {col_defs}
) ON COMMIT DROP;

INSERT INTO tmp_claro_backfill_data ({insert_cols})
VALUES
{values_sql};

CREATE TEMP TABLE tmp_claro_backfill_metricas (
    metric text PRIMARY KEY,
    value integer NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_claro_backfill_metricas(metric, value)
SELECT 'filas_fuente', count(*) FROM tmp_claro_backfill_data;

DO $$
DECLARE
    v_count integer;
BEGIN
    SELECT count(*) INTO v_count FROM tmp_claro_backfill_data;
    IF v_count <> 58 THEN
        RAISE EXCEPTION 'Se esperaban 58 filas fuente y llegaron %', v_count;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM tmp_claro_backfill_data
        GROUP BY lead_numero
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Hay leads duplicados en tmp_claro_backfill_data';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM tmp_claro_backfill_data d
        LEFT JOIN plan p ON p.id = d.plan_id::bigint
        LEFT JOIN proveedor pr ON pr.id = p.id_proveedor
        WHERE p.id IS NULL OR upper(trim(pr.nombre)) <> 'CLARO'
    ) THEN
        RAISE EXCEPTION 'Hay filas con plan_id inexistente o proveedor distinto de CLARO';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM tmp_claro_backfill_data
        WHERE fecha_instalacion IS NULL
           OR fecha_instalacion !~ '^\\d{{4}}-\\d{{2}}-\\d{{2}}$'
    ) THEN
        RAISE EXCEPTION 'Hay filas sin fecha_instalacion valida';
    END IF;
END $$;

CREATE TEMP TABLE tmp_claro_backfill_resolved AS
SELECT
    d.*,
    l.id AS id_lead_existente,
    l.id_contacto AS id_contacto_existente,
    l.id_datos_preventa AS id_datos_preventa_existente,
    l.id_direccion AS id_direccion_existente,
    l.id_equipo AS id_equipo_existente,
    l.id_campana AS id_campana_existente,
    CASE
        WHEN length(regexp_replace(coalesce(d.ubigeo_nacimiento_raw, ''), '\\D', '', 'g')) = 6
            THEN regexp_replace(d.ubigeo_nacimiento_raw, '\\D', '', 'g')
        WHEN length(regexp_replace(coalesce(d.ubigeo_nacimiento_raw, ''), '\\D', '', 'g')) = 4
            THEN regexp_replace(d.ubigeo_nacimiento_raw, '\\D', '', 'g') || '01'
        WHEN length(regexp_replace(coalesce(d.ubigeo_nacimiento_raw, ''), '\\D', '', 'g')) = 2
            THEN regexp_replace(d.ubigeo_nacimiento_raw, '\\D', '', 'g') || '0101'
        ELSE NULL
    END AS ubigeo_nacimiento_final,
    (d.fecha_eventos_at::timestamp AT TIME ZONE 'America/Lima') AS eventos_at,
    d.fecha_programacion::date AS fecha_programacion_final,
    d.fecha_instalacion::date AS fecha_instalacion_final,
    d.precio_regular::numeric AS precio_regular_final,
    d.plan_id::bigint AS plan_id_final,
    d.actor_id::bigint AS actor_id_final,
    COALESCE(l.id_equipo, NULLIF(d.id_equipo_final, '')::bigint, 2) AS id_equipo_resuelto,
    COALESCE(l.id_campana, NULLIF(d.id_campana_final, '')::bigint) AS id_campana_resuelta,
    CASE WHEN l.id IS NULL THEN nextval('lead_id_seq') END AS id_lead_nuevo,
    CASE WHEN l.id IS NULL OR l.id_datos_preventa IS NULL THEN nextval('datos_preventa_id_seq') END AS id_datos_preventa_nuevo,
    CASE WHEN l.id IS NULL OR l.id_direccion IS NULL THEN nextval('direccion_id_seq') END AS id_direccion_nuevo
FROM tmp_claro_backfill_data d
LEFT JOIN LATERAL (
    SELECT l.*
    FROM lead l
    WHERE l.lead = d.lead_numero
       OR l.sot = d.sot
       OR l.numero_documento_titular_servicio_snapshot = d.documento
    ORDER BY
        CASE WHEN l.lead = d.lead_numero THEN 100 ELSE 0 END
      + CASE WHEN l.sot = d.sot THEN 50 ELSE 0 END
      + CASE WHEN l.numero_documento_titular_servicio_snapshot = d.documento THEN 40 ELSE 0 END DESC,
        l.id DESC
    LIMIT 1
) l ON true;

ALTER TABLE tmp_claro_backfill_resolved
ADD COLUMN id_lead_final bigint,
ADD COLUMN id_contacto_final bigint,
ADD COLUMN id_datos_preventa_final bigint,
ADD COLUMN id_direccion_final bigint;

UPDATE tmp_claro_backfill_resolved
SET
    id_lead_final = COALESCE(id_lead_existente, id_lead_nuevo),
    id_datos_preventa_final = COALESCE(id_datos_preventa_existente, id_datos_preventa_nuevo),
    id_direccion_final = COALESCE(id_direccion_existente, id_direccion_nuevo);

WITH ins AS (
    INSERT INTO contacto (prefijo, lead, nombre_conocido, created_at, updated_at)
    SELECT '+51', r.lead_numero, r.nombre_cliente, r.eventos_at, now()
    FROM tmp_claro_backfill_resolved r
    WHERE NOT EXISTS (
        SELECT 1 FROM contacto c WHERE c.prefijo = '+51' AND c.lead = r.lead_numero
    )
    RETURNING id, lead
)
UPDATE tmp_claro_backfill_resolved r
SET id_contacto_final = c.id
FROM contacto c
WHERE c.prefijo = '+51'
  AND c.lead = r.lead_numero;

UPDATE contacto c
SET
    nombre_conocido = r.nombre_cliente,
    updated_at = now()
FROM tmp_claro_backfill_resolved r
WHERE c.id = r.id_contacto_final
  AND c.nombre_conocido IS DISTINCT FROM r.nombre_cliente;

WITH inserted AS (
    INSERT INTO datos_preventa (
        id,
        tipo_documento,
        numero_documento_titular_servicio,
        ubigeo_nacimiento,
        nombre_titular_servicio,
        celular_registro,
        celular_referencia,
        correo,
        nombre_madre,
        nombre_padre
    )
    SELECT
        r.id_datos_preventa_nuevo,
        r.tipo_documento,
        r.documento,
        r.ubigeo_nacimiento_final,
        r.nombre_cliente,
        r.lead_numero,
        r.telefono_referencia,
        r.correo,
        NULL,
        NULL
    FROM tmp_claro_backfill_resolved r
    WHERE r.id_datos_preventa_nuevo IS NOT NULL
    RETURNING id
)
INSERT INTO tmp_claro_backfill_metricas(metric, value)
SELECT 'datos_preventa_insertados', count(*) FROM inserted
ON CONFLICT (metric) DO UPDATE SET value = EXCLUDED.value;

UPDATE datos_preventa dp
SET
    tipo_documento = r.tipo_documento,
    numero_documento_titular_servicio = r.documento,
    ubigeo_nacimiento = r.ubigeo_nacimiento_final,
    nombre_titular_servicio = r.nombre_cliente,
    celular_registro = r.lead_numero,
    celular_referencia = r.telefono_referencia,
    correo = r.correo
FROM tmp_claro_backfill_resolved r
WHERE dp.id = r.id_datos_preventa_final;

WITH inserted AS (
    INSERT INTO direccion (
        id,
        ubigeo_domicilio,
        direccion,
        referencia,
        latitud,
        longitud,
        plano,
        piso,
        interior
    )
    SELECT
        r.id_direccion_nuevo,
        r.ubigeo_nacimiento_final,
        r.direccion,
        r.referencia,
        r.latitud,
        r.longitud,
        r.plano,
        r.piso,
        r.interior
    FROM tmp_claro_backfill_resolved r
    WHERE r.id_direccion_nuevo IS NOT NULL
    RETURNING id
)
INSERT INTO tmp_claro_backfill_metricas(metric, value)
SELECT 'direcciones_insertadas', count(*) FROM inserted
ON CONFLICT (metric) DO UPDATE SET value = EXCLUDED.value;

UPDATE direccion dir
SET
    ubigeo_domicilio = r.ubigeo_nacimiento_final,
    direccion = r.direccion,
    referencia = r.referencia,
    latitud = r.latitud,
    longitud = r.longitud,
    plano = r.plano,
    piso = r.piso,
    interior = r.interior
FROM tmp_claro_backfill_resolved r
WHERE dir.id = r.id_direccion_final;

WITH inserted AS (
    INSERT INTO lead (
        id,
        prefijo,
        lead,
        numero_para_llamar,
        etapa,
        estado,
        id_asesor_asignado,
        nombre_asesor_asignado,
        id_campana,
        base,
        numero_documento_titular_servicio_snapshot,
        direccion_snapshot,
        id_datos_preventa,
        id_direccion,
        id_contacto,
        id_equipo,
        id_plan,
        nombre_plan_snapshot,
        nombre_proveedor_snapshot,
        precio_plan_snapshot,
        precio_final,
        dia_corte_facturacion,
        meses_permanencia_snapshot,
        estado_cliente_postventa,
        sec,
        sot,
        created_at,
        last_entry_at,
        updated_at,
        requiere_atencion_gtr
    )
    SELECT
        r.id_lead_nuevo,
        '+51',
        r.lead_numero,
        r.telefono_referencia,
        'POSTVENTA',
        'NUEVO',
        r.actor_id_final,
        r.actor_nombre,
        r.id_campana_resuelta,
        'REFERIDO',
        r.documento,
        r.direccion,
        r.id_datos_preventa_final,
        r.id_direccion_final,
        r.id_contacto_final,
        r.id_equipo_resuelto,
        r.plan_id_final,
        r.plan_nombre,
        'CLARO',
        r.precio_regular_final,
        r.precio_regular_final,
        CASE WHEN EXTRACT(DAY FROM r.fecha_instalacion_final) >= 12 THEN 12 ELSE 1 END,
        5,
        r.cliente_estado_final,
        r.sec,
        r.sot,
        r.eventos_at,
        r.fecha_instalacion_final::timestamp AT TIME ZONE 'America/Lima',
        now(),
        false
    FROM tmp_claro_backfill_resolved r
    WHERE r.id_lead_existente IS NULL
    RETURNING id
)
INSERT INTO tmp_claro_backfill_metricas(metric, value)
SELECT 'leads_insertados', count(*) FROM inserted
ON CONFLICT (metric) DO UPDATE SET value = EXCLUDED.value;

UPDATE lead l
SET
    prefijo = '+51',
    lead = r.lead_numero,
    numero_para_llamar = r.telefono_referencia,
    etapa = 'POSTVENTA',
    estado = 'NUEVO',
    id_asesor_asignado = r.actor_id_final,
    nombre_asesor_asignado = r.actor_nombre,
    numero_documento_titular_servicio_snapshot = r.documento,
    direccion_snapshot = r.direccion,
    id_datos_preventa = r.id_datos_preventa_final,
    id_direccion = r.id_direccion_final,
    id_contacto = r.id_contacto_final,
    id_equipo = COALESCE(l.id_equipo, r.id_equipo_resuelto),
    id_campana = l.id_campana,
    base = COALESCE(l.base, 'REFERIDO'),
    id_plan = r.plan_id_final,
    nombre_plan_snapshot = r.plan_nombre,
    nombre_proveedor_snapshot = 'CLARO',
    precio_plan_snapshot = r.precio_regular_final,
    precio_final = r.precio_regular_final,
    dia_corte_facturacion = CASE WHEN EXTRACT(DAY FROM r.fecha_instalacion_final) >= 12 THEN 12 ELSE 1 END,
    meses_permanencia_snapshot = 5,
    estado_cliente_postventa = r.cliente_estado_final,
    sec = r.sec,
    sot = r.sot,
    last_entry_at = r.fecha_instalacion_final::timestamp AT TIME ZONE 'America/Lima',
    updated_at = now(),
    requiere_atencion_gtr = false
FROM tmp_claro_backfill_resolved r
WHERE l.id = r.id_lead_final;

INSERT INTO tmp_claro_backfill_metricas(metric, value)
SELECT 'leads_actualizados', count(*)
FROM tmp_claro_backfill_resolved
WHERE id_lead_existente IS NOT NULL
ON CONFLICT (metric) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO evento (
    id_lead, id_campana, id_actor, nombre_actor, rol_actor, id_asesor_asignado,
    nombre_asesor_asignado, accion, etapa, tipificacion, subtipificacion,
    comentario, created_at
)
SELECT r.id_lead_final, r.id_campana_resuelta, r.actor_id_final, r.actor_nombre, 'ADMIN',
       r.actor_id_final, r.actor_nombre, e.accion, e.etapa, e.tipificacion, e.subtipificacion,
       e.comentario, r.eventos_at
FROM tmp_claro_backfill_resolved r
CROSS JOIN (
    VALUES
        ('REGISTRO', 'PREVENTA', NULL, NULL, NULL),
        ('ASIGNACION', 'PREVENTA', NULL, NULL, NULL),
        ('TIPIFICACION', 'PREVENTA', 'PREVENTA', 'COMPLETA', NULL),
        ('TIPIFICACION', 'VENTA', 'INGRESADO', NULL, NULL),
        ('TIPIFICACION', 'VENTA', 'PROGRAMADO', 'PROGRAMADA', NULL)
) AS e(accion, etapa, tipificacion, subtipificacion, comentario)
WHERE NOT EXISTS (
    SELECT 1
    FROM evento ev
    WHERE ev.id_lead = r.id_lead_final
      AND ev.accion = e.accion
      AND ev.etapa = e.etapa
      AND ev.tipificacion IS NOT DISTINCT FROM e.tipificacion
);

INSERT INTO evento (
    id_lead, id_campana, id_actor, nombre_actor, rol_actor, id_asesor_asignado,
    nombre_asesor_asignado, id_plan_ofrecido, accion, etapa, tipificacion,
    subtipificacion, fecha_instalacion, fecha_programacion, created_at
)
SELECT r.id_lead_final, r.id_campana_resuelta, r.actor_id_final, r.actor_nombre, 'ADMIN',
       r.actor_id_final, r.actor_nombre, r.plan_id_final, 'TIPIFICACION', 'VENTA',
       'INSTALADO', 'SERVICIO INSTALADO', r.fecha_instalacion_final,
       r.fecha_programacion_final, r.fecha_instalacion_final::timestamp AT TIME ZONE 'America/Lima'
FROM tmp_claro_backfill_resolved r
WHERE NOT EXISTS (
    SELECT 1
    FROM evento ev
    WHERE ev.id_lead = r.id_lead_final
      AND ev.accion = 'TIPIFICACION'
      AND ev.etapa = 'VENTA'
      AND ev.tipificacion = 'INSTALADO'
);

INSERT INTO lead_etapa_resumen (
    id_lead, etapa, fecha_ingreso_etapa, fecha_salida_etapa, numero_pasadas,
    total_tipificaciones, total_asignaciones, primera_codigo_tipificacion,
    primera_codigo_subtipificacion, primera_tipificacion_orden, primera_tipificacion_at,
    ultima_codigo_tipificacion, ultima_codigo_subtipificacion, ultima_tipificacion_orden,
    ultima_tipificacion_at, mayor_rango_codigo_tipificacion, mayor_rango_codigo_subtipificacion,
    mayor_rango_orden, mayor_rango_at, id_asesor_merito, nombre_asesor_merito,
    fecha_merito, id_asesor_ultima_gestion, nombre_asesor_ultima_gestion,
    fecha_ultima_gestion, created_at, updated_at
)
SELECT r.id_lead_final, x.etapa, x.ingreso_at, x.salida_at, 1,
       x.total_tipificaciones, x.total_asignaciones, x.tip, x.subtip, x.orden,
       x.tip_at, x.tip, x.subtip, x.orden, x.tip_at, x.tip, x.subtip,
       x.orden, x.tip_at, r.actor_id_final, r.actor_nombre, x.tip_at,
       r.actor_id_final, r.actor_nombre, x.tip_at, x.ingreso_at, now()
FROM tmp_claro_backfill_resolved r
CROSS JOIN LATERAL (
    VALUES
        ('PREVENTA', r.eventos_at, r.eventos_at, 1, 1, 'PREVENTA', 'COMPLETA', 6, r.eventos_at),
        ('VENTA', r.eventos_at, r.fecha_instalacion_final::timestamp AT TIME ZONE 'America/Lima', 3, 0, 'INSTALADO', 'SERVICIO INSTALADO', 6, r.fecha_instalacion_final::timestamp AT TIME ZONE 'America/Lima'),
        ('POSTVENTA', r.fecha_instalacion_final::timestamp AT TIME ZONE 'America/Lima', NULL::timestamp with time zone, 0, 0, NULL, NULL, NULL, NULL::timestamp with time zone)
) AS x(etapa, ingreso_at, salida_at, total_tipificaciones, total_asignaciones, tip, subtip, orden, tip_at)
ON CONFLICT (id_lead, etapa) DO UPDATE SET
    fecha_ingreso_etapa = EXCLUDED.fecha_ingreso_etapa,
    fecha_salida_etapa = EXCLUDED.fecha_salida_etapa,
    total_tipificaciones = EXCLUDED.total_tipificaciones,
    total_asignaciones = EXCLUDED.total_asignaciones,
    primera_codigo_tipificacion = EXCLUDED.primera_codigo_tipificacion,
    primera_codigo_subtipificacion = EXCLUDED.primera_codigo_subtipificacion,
    primera_tipificacion_orden = EXCLUDED.primera_tipificacion_orden,
    primera_tipificacion_at = EXCLUDED.primera_tipificacion_at,
    ultima_codigo_tipificacion = EXCLUDED.ultima_codigo_tipificacion,
    ultima_codigo_subtipificacion = EXCLUDED.ultima_codigo_subtipificacion,
    ultima_tipificacion_orden = EXCLUDED.ultima_tipificacion_orden,
    ultima_tipificacion_at = EXCLUDED.ultima_tipificacion_at,
    mayor_rango_codigo_tipificacion = EXCLUDED.mayor_rango_codigo_tipificacion,
    mayor_rango_codigo_subtipificacion = EXCLUDED.mayor_rango_codigo_subtipificacion,
    mayor_rango_orden = EXCLUDED.mayor_rango_orden,
    mayor_rango_at = EXCLUDED.mayor_rango_at,
    id_asesor_merito = EXCLUDED.id_asesor_merito,
    nombre_asesor_merito = EXCLUDED.nombre_asesor_merito,
    fecha_merito = EXCLUDED.fecha_merito,
    id_asesor_ultima_gestion = EXCLUDED.id_asesor_ultima_gestion,
    nombre_asesor_ultima_gestion = EXCLUDED.nombre_asesor_ultima_gestion,
    fecha_ultima_gestion = EXCLUDED.fecha_ultima_gestion,
    updated_at = now();

INSERT INTO calendario_facturacion_postventa (
    id_lead, fecha_instalacion, proveedor_snapshot, plan_snapshot,
    meses_permanencia_snapshot, monto_plan_snapshot, tipo_regla_proveedor,
    dia_corte, dia_emision_estimado, dia_vencimiento, mes_corte_base,
    numero_corte_base, bloque_facturacion, requiere_prorrateo_inicial,
    activo, corte_corregido, created_at, updated_at
)
SELECT
    r.id_lead_final,
    r.fecha_instalacion_final,
    'CLARO',
    r.plan_nombre,
    5,
    r.precio_regular_final,
    'CLARO',
    CASE WHEN EXTRACT(DAY FROM r.fecha_instalacion_final) >= 12 THEN 12 ELSE 1 END,
    EXTRACT(DAY FROM r.fecha_instalacion_final)::integer,
    EXTRACT(DAY FROM (r.fecha_instalacion_final + interval '15 days'))::integer,
    date_trunc('month', r.fecha_instalacion_final)::date,
    CASE WHEN EXTRACT(DAY FROM r.fecha_instalacion_final) >= 12 THEN 2 ELSE 1 END,
    CASE WHEN EXTRACT(DAY FROM r.fecha_instalacion_final) >= 12 THEN 'MES_SIGUIENTE' ELSE 'MISMO_MES' END,
    false,
    true,
    false,
    r.fecha_instalacion_final::timestamp AT TIME ZONE 'America/Lima',
    now()
FROM tmp_claro_backfill_resolved r
ON CONFLICT (id_lead) DO UPDATE SET
    fecha_instalacion = EXCLUDED.fecha_instalacion,
    proveedor_snapshot = EXCLUDED.proveedor_snapshot,
    plan_snapshot = EXCLUDED.plan_snapshot,
    meses_permanencia_snapshot = EXCLUDED.meses_permanencia_snapshot,
    monto_plan_snapshot = EXCLUDED.monto_plan_snapshot,
    tipo_regla_proveedor = EXCLUDED.tipo_regla_proveedor,
    dia_corte = EXCLUDED.dia_corte,
    dia_emision_estimado = EXCLUDED.dia_emision_estimado,
    dia_vencimiento = EXCLUDED.dia_vencimiento,
    mes_corte_base = EXCLUDED.mes_corte_base,
    numero_corte_base = EXCLUDED.numero_corte_base,
    bloque_facturacion = EXCLUDED.bloque_facturacion,
    activo = true,
    updated_at = now();

WITH recalculados AS (
    UPDATE calendario_facturacion_postventa c
    SET
        mes_corte_base = date_trunc('month', c.fecha_instalacion)::date,
        numero_corte_base = CASE WHEN EXTRACT(DAY FROM c.fecha_instalacion) >= 12 THEN 2 ELSE 1 END,
        dia_corte = CASE WHEN EXTRACT(DAY FROM c.fecha_instalacion) >= 12 THEN 12 ELSE 1 END,
        dia_emision_estimado = EXTRACT(DAY FROM c.fecha_instalacion)::integer,
        dia_vencimiento = EXTRACT(DAY FROM (c.fecha_instalacion + interval '15 days'))::integer,
        bloque_facturacion = CASE WHEN EXTRACT(DAY FROM c.fecha_instalacion) >= 12 THEN 'MES_SIGUIENTE' ELSE 'MISMO_MES' END,
        tipo_regla_proveedor = 'CLARO',
        updated_at = now()
    FROM lead l
    JOIN plan pl ON pl.id = l.id_plan
    JOIN proveedor pr ON pr.id = pl.id_proveedor
    WHERE c.id_lead = l.id
      AND l.etapa = 'POSTVENTA'
      AND upper(trim(pr.nombre)) = 'CLARO'
      AND c.activo = true
      AND c.fecha_instalacion IS NOT NULL
      AND (
          c.mes_corte_base IS DISTINCT FROM date_trunc('month', c.fecha_instalacion)::date
          OR c.numero_corte_base IS DISTINCT FROM CASE WHEN EXTRACT(DAY FROM c.fecha_instalacion) >= 12 THEN 2 ELSE 1 END
          OR c.dia_corte IS DISTINCT FROM CASE WHEN EXTRACT(DAY FROM c.fecha_instalacion) >= 12 THEN 12 ELSE 1 END
          OR c.bloque_facturacion IS DISTINCT FROM CASE WHEN EXTRACT(DAY FROM c.fecha_instalacion) >= 12 THEN 'MES_SIGUIENTE' ELSE 'MISMO_MES' END
          OR c.tipo_regla_proveedor IS DISTINCT FROM 'CLARO'
      )
    RETURNING c.id
)
INSERT INTO tmp_claro_backfill_metricas(metric, value)
SELECT 'calendarios_claro_recalculados', count(*) FROM recalculados
ON CONFLICT (metric) DO UPDATE SET value = EXCLUDED.value;

CREATE TEMP TABLE tmp_claro_periodos AS
SELECT
    r.*,
    c.id AS id_calendario,
    p.numero_periodo,
    (r.fecha_instalacion_final + ((p.numero_periodo - 1) || ' month')::interval)::date AS fecha_inicio_periodo,
    (r.fecha_instalacion_final + ((p.numero_periodo - 1) || ' month')::interval + interval '15 days')::date AS fecha_vencimiento_estimado,
    CASE WHEN p.numero_periodo = 1 THEN NULLIF(r.p1_emision, '')::date ELSE NULLIF(r.p2_emision, '')::date END AS fecha_emision_confirmada,
    CASE WHEN p.numero_periodo = 1 THEN NULLIF(r.p1_vencimiento, '')::date ELSE NULLIF(r.p2_vencimiento, '')::date END AS fecha_vencimiento_confirmado,
    CASE WHEN p.numero_periodo = 1 THEN NULLIF(r.p1_monto, '')::numeric ELSE NULLIF(r.p2_monto, '')::numeric END AS monto_facturado,
    CASE WHEN p.numero_periodo = 1 THEN r.p1_estado_periodo ELSE r.p2_estado_periodo END AS estado_periodo,
    CASE WHEN p.numero_periodo = 1 THEN r.p1_aportante ELSE r.p2_aportante END AS aportante,
    CASE WHEN p.numero_periodo = 1 THEN r.p1_estado_pago ELSE r.p2_estado_pago END AS estado_pago,
    CASE WHEN p.numero_periodo = 1 THEN NULLIF(r.p1_fecha_pago, '')::date ELSE NULLIF(r.p2_fecha_pago, '')::date END AS fecha_pago
FROM tmp_claro_backfill_resolved r
JOIN calendario_facturacion_postventa c ON c.id_lead = r.id_lead_final
CROSS JOIN (VALUES (1), (2)) AS p(numero_periodo)
WHERE p.numero_periodo = 1
   OR NULLIF(r.p2_emision, '') IS NOT NULL
   OR NULLIF(r.p2_vencimiento, '') IS NOT NULL
   OR NULLIF(r.p2_monto, '') IS NOT NULL
   OR NULLIF(r.p2_marcador_pago, '') IS NOT NULL
   OR (r.p1_estado_periodo LIKE 'CERRADO_PAGO%' AND r.cliente_estado_final <> 'BAJA');

INSERT INTO periodo_facturacion_postventa (
    id_calendario_facturacion, id_lead, numero_periodo, fecha_inicio_periodo,
    fecha_fin_periodo, fecha_corte_estimada, fecha_emision_estimada,
    fecha_emision_confirmada, fecha_vencimiento_estimado,
    fecha_vencimiento_confirmado, monto_esperado, monto_facturado,
    estado, created_at, updated_at
)
SELECT
    p.id_calendario,
    p.id_lead_final,
    p.numero_periodo,
    p.fecha_inicio_periodo,
    p.fecha_vencimiento_estimado,
    p.fecha_inicio_periodo,
    p.fecha_inicio_periodo,
    p.fecha_emision_confirmada,
    p.fecha_vencimiento_estimado,
    p.fecha_vencimiento_confirmado,
    p.precio_regular_final,
    p.monto_facturado,
    p.estado_periodo,
    p.fecha_inicio_periodo::timestamp AT TIME ZONE 'America/Lima',
    now()
FROM tmp_claro_periodos p
ON CONFLICT (id_lead, numero_periodo) WHERE numero_periodo IS NOT NULL DO UPDATE SET
    id_calendario_facturacion = EXCLUDED.id_calendario_facturacion,
    fecha_inicio_periodo = EXCLUDED.fecha_inicio_periodo,
    fecha_fin_periodo = EXCLUDED.fecha_fin_periodo,
    fecha_corte_estimada = EXCLUDED.fecha_corte_estimada,
    fecha_emision_estimada = EXCLUDED.fecha_emision_estimada,
    fecha_emision_confirmada = EXCLUDED.fecha_emision_confirmada,
    fecha_vencimiento_estimado = EXCLUDED.fecha_vencimiento_estimado,
    fecha_vencimiento_confirmado = EXCLUDED.fecha_vencimiento_confirmado,
    monto_esperado = EXCLUDED.monto_esperado,
    monto_facturado = EXCLUDED.monto_facturado,
    estado = EXCLUDED.estado,
    updated_at = now();

WITH pagos AS (
    SELECT p.*, pf.id AS id_periodo
    FROM tmp_claro_periodos p
    JOIN periodo_facturacion_postventa pf
      ON pf.id_lead = p.id_lead_final
     AND pf.numero_periodo = p.numero_periodo
    WHERE p.estado_pago IN ('PAGADO_CLIENTE', 'PAGADO_EMPRESA')
      AND p.aportante IN ('CLIENTE', 'EMPRESA')
      AND p.fecha_pago IS NOT NULL
), inserted AS (
    INSERT INTO pago_postventa (
        id_lead, id_periodo_facturacion, aportante, estado, condicion,
        monto, fecha_pago, created_at, updated_at
    )
    SELECT
        p.id_lead_final,
        p.id_periodo,
        p.aportante,
        p.estado_pago,
        'NORMAL',
        COALESCE(p.monto_facturado, p.precio_regular_final),
        p.fecha_pago,
        p.fecha_pago::timestamp AT TIME ZONE 'America/Lima',
        now()
    FROM pagos p
    WHERE NOT EXISTS (
        SELECT 1
        FROM pago_postventa pp
        WHERE pp.id_periodo_facturacion = p.id_periodo
          AND pp.estado IN ('PAGADO_CLIENTE', 'PAGADO_EMPRESA')
    )
    RETURNING id
)
INSERT INTO tmp_claro_backfill_metricas(metric, value)
SELECT 'pagos_insertados', count(*) FROM inserted
ON CONFLICT (metric) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO encuesta_postventa (
    id_lead, tipo_encuesta, estado, prioridad, fecha_programada,
    fecha_limite, numero_encuesta, created_at, updated_at
)
SELECT
    r.id_lead_final,
    'SATISFACCION_ASESOR',
    'PENDIENTE',
    'NORMAL',
    r.fecha_instalacion_final::timestamp,
    r.fecha_instalacion_final::timestamp + interval '48 hours',
    1,
    r.fecha_instalacion_final::timestamp AT TIME ZONE 'America/Lima',
    now()
FROM tmp_claro_backfill_resolved r
WHERE NOT EXISTS (
    SELECT 1
    FROM encuesta_postventa e
    WHERE e.id_lead = r.id_lead_final
      AND e.tipo_encuesta = 'SATISFACCION_ASESOR'
      AND e.numero_encuesta = 1
);

INSERT INTO tmp_claro_backfill_metricas(metric, value)
SELECT 'calendarios_scope', count(*) FROM calendario_facturacion_postventa c
JOIN tmp_claro_backfill_resolved r ON r.id_lead_final = c.id_lead
ON CONFLICT (metric) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO tmp_claro_backfill_metricas(metric, value)
SELECT 'periodos_scope', count(*) FROM periodo_facturacion_postventa p
JOIN tmp_claro_backfill_resolved r ON r.id_lead_final = p.id_lead
WHERE p.numero_periodo IN (1, 2)
ON CONFLICT (metric) DO UPDATE SET value = EXCLUDED.value;

SELECT metric, value
FROM tmp_claro_backfill_metricas
ORDER BY metric;

SELECT
    c.mes_corte_base,
    c.numero_corte_base,
    count(*) AS calendarios_postventa_claro
FROM lead l
JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
WHERE l.etapa = 'POSTVENTA'
  AND upper(trim(l.nombre_proveedor_snapshot)) = 'CLARO'
GROUP BY c.mes_corte_base, c.numero_corte_base
ORDER BY c.mes_corte_base, c.numero_corte_base;

SELECT
    d.lead_numero,
    d.sot,
    d.documento,
    l.id AS id_lead,
    l.etapa,
    l.estado,
    l.nombre_proveedor_snapshot,
    c.mes_corte_base,
    c.numero_corte_base,
    count(p.id) FILTER (WHERE p.numero_periodo IN (1, 2)) AS periodos_1_2,
    count(pg.id) AS pagos
FROM tmp_claro_backfill_data d
JOIN lead l ON l.lead = d.lead_numero
JOIN calendario_facturacion_postventa c ON c.id_lead = l.id
LEFT JOIN periodo_facturacion_postventa p ON p.id_lead = l.id AND p.numero_periodo IN (1, 2)
LEFT JOIN pago_postventa pg ON pg.id_periodo_facturacion = p.id
GROUP BY d.lead_numero, d.sot, d.documento, l.id, l.etapa, l.estado,
         l.nombre_proveedor_snapshot, c.mes_corte_base, c.numero_corte_base
ORDER BY c.mes_corte_base, c.numero_corte_base, d.lead_numero;

-- Ejecucion real. Cambiar a ROLLBACK si se desea solo dry-run.
COMMIT;
"""

    OUT.write_text(content, encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
