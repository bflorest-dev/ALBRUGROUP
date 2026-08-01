from __future__ import annotations

import math
import numbers
import re
from datetime import date, datetime
from pathlib import Path

import pandas as pd

BASE_DIR = Path("backfill-postventa-20260801")
POSTVENTA_XLSX = Path("OLD") / "POSTVENTA_ALBRU2.xlsx"
VENTAS_XLSX = Path("OLD") / "RevisionPOSTVENTA_20260731" / "VENTAS_BD.xlsx"
OUTPUT = BASE_DIR / "08_reparar_calendarios_periodos_postventa.sql"


def clean(value) -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    if isinstance(value, numbers.Number) and not isinstance(value, bool):
        numeric = float(value)
        if numeric.is_integer():
            return str(int(numeric))
        return str(value)
    if isinstance(value, pd.Timestamp):
        return value.date().isoformat()
    value = str(value).replace("'", "''")
    return re.sub(r"\s+", " ", value).strip()


def digits(value) -> str:
    return re.sub(r"\D", "", clean(value))


def normalize_document(value) -> str:
    document = digits(value).lstrip("0")
    return document or digits(value)


def normalize_client_name(value, document=None) -> str:
    text = clean(value)
    if not text:
        return ""

    document_norm = normalize_document(document)
    match = re.match(r"^\s*([0-9]{6,11})(?:\s*[-/]\s*|\s+)(.+)$", text)
    if match and normalize_document(match.group(1)) == document_norm:
        text = match.group(2)

    # Excel sometimes uses zero as the letter O inside names.
    text = re.sub(r"(?<=[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])0(?=\b|[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])", "O", text)
    text = re.sub(r"\s+", " ", text).strip(" -/")
    return text


def sql_text(value) -> str:
    value = clean(value)
    return "NULL" if value == "" or value.lower() == "nan" else f"'{value}'"


def sql_date(value) -> str:
    if value is None or pd.isna(value):
        return "NULL"
    if isinstance(value, pd.Timestamp):
        return f"'{value.date().isoformat()}'"
    if isinstance(value, datetime):
        return f"'{value.date().isoformat()}'"
    if isinstance(value, date):
        return f"'{value.isoformat()}'"
    text = clean(value)
    if not re.match(r"^\d{4}-\d{2}-\d{2}", text):
        return "NULL"
    return f"'{text[:10]}'"


def sql_num(value) -> str:
    if value is None or pd.isna(value) or str(value).strip() == "":
        return "NULL"
    return f"{float(str(value).replace(',', '.')):.2f}"


def sql_int(value) -> str:
    if value is None or pd.isna(value) or str(value).strip() == "":
        return "NULL"
    return str(int(float(str(value).replace(",", "."))))


def normalize_tipo_documento(value) -> str:
    text = clean(value).upper().replace(" ", "")
    if text.startswith("RUC"):
        return "RUC"
    if text in {"DNI", "CE", "RUC"}:
        return text
    return "DNI"


def tipo_contacto_enum(value) -> str:
    text = clean(value).upper()
    if "CHAT" in text:
        return "CHAT"
    if "LLAMADA" in text:
        return "LLAMADA"
    return ""


def score(value):
    if value is None or pd.isna(value) or str(value).strip() == "":
        return None
    return int(float(str(value).replace(",", ".")))


def is_numeric_non_date(value) -> bool:
    if value is None or pd.isna(value):
        return False
    if isinstance(value, (pd.Timestamp, datetime, date)):
        return False
    try:
        float(str(value).replace(",", "."))
        return True
    except ValueError:
        return False


def expected_max(sheet: str) -> int:
    if sheet in {"26ABR", "26MAY"}:
        return 3
    if sheet == "26JUN":
        return 2
    return 1


ventas = pd.read_excel(VENTAS_XLSX, sheet_name="BASE", engine="openpyxl")
ventas["_lead_norm"] = ventas["LEAD"].map(digits)
ventas["_doc_norm"] = ventas["N° DOCUMENTO"].map(digits)
ventas_by_key = {
    (row["_lead_norm"], row["_doc_norm"]): row
    for _, row in ventas.iterrows()
    if row["_lead_norm"] and row["_doc_norm"]
}

rows = []
lead_values = []
period_values = []
survey_values = []
cols = "C:M,Q:R,W:Y,BH:BV"
for sheet in ["26ABR", "26MAY", "26JUN", "26JUL"]:
    df = pd.read_excel(POSTVENTA_XLSX, sheet_name=sheet, header=4, usecols=cols, engine="openpyxl")
    df.columns = [str(c).strip() for c in df.columns]
    for _, row in df.iterrows():
        if clean(row.iloc[0]).upper() != "WIN":
            continue
        try:
            corte = int(row.iloc[9])
        except Exception:
            continue
        if sheet == "26ABR" and corte != 2:
            continue
        if sheet == "26JUL" and corte != 1:
            continue
        if sheet in {"26MAY", "26JUN"} and corte not in {1, 2}:
            continue

        fila_excel = int(row.name + 6)
        lead = digits(row.iloc[2])
        documento = digits(row.iloc[4])
        venta = ventas_by_key.get((lead, documento))

        tipo_documento = normalize_tipo_documento(row.iloc[3])
        cliente = normalize_client_name(row.iloc[5], documento)
        fecha_instalacion = row.iloc[7]
        celular_registro = lead
        celular_referencia = lead
        direccion = ""
        plan_snapshot = None
        precio_final = None
        plataforma = clean(row.iloc[12])
        id_plataforma = "1" if "IPTV" in plataforma.upper() else "NULL"
        if venta is not None:
            tipo_documento = normalize_tipo_documento(venta.get("TIPO DOCUMENTO"))
            cliente = normalize_client_name(venta.get("NOMBRES Y APELLIDOS"), documento) or cliente
            celular_registro = digits(venta.get("TELEFONO REGISTRO")) or lead
            celular_referencia = digits(venta.get("TELEFONO REFERENCIA")) or celular_registro
            direccion = clean(venta.get("DIRECCION"))
            fecha_instalacion = venta.get("FECHA INSTALACION") if pd.notna(venta.get("FECHA INSTALACION")) else fecha_instalacion
            plan_snapshot = " - ".join(
                part
                for part in [
                    clean(venta.get("TIPO PLAN")),
                    clean(venta.get("SERVICIO CONTRATADO")),
                    clean(venta.get("VELOCIDAD CONTRATADA")),
                ]
                if part
            )
            precio_final = venta.get("PRECIO PLAN")
            plataforma = clean(venta.get("PLATAFORMA DIGITAL")) or plataforma
            id_plataforma = "1" if "IPTV" in plataforma.upper() else "NULL"

        contact_type = tipo_contacto_enum(row.iloc[13])
        advisor_score = score(row.iloc[14])
        service_score = score(row.iloc[15])
        payers = [row.iloc[16], row.iloc[21], row.iloc[26]]
        amounts = [row.iloc[17], row.iloc[22], row.iloc[27]]
        emissions = [row.iloc[18], row.iloc[23], row.iloc[28]]
        dues = [row.iloc[19], row.iloc[24], row.iloc[29]]
        paydates = [row.iloc[20], row.iloc[25], row.iloc[30]]

        first_amount = None
        for amount in amounts:
            if amount is not None and not pd.isna(amount) and str(amount).strip() != "":
                first_amount = amount
                break
        if precio_final is None or pd.isna(precio_final) or str(precio_final).strip() == "":
            precio_final = first_amount

        max_period = expected_max(sheet)
        rows.append((sheet, corte, lead, documento))
        lead_values.append(
            "        ("
            + ", ".join(
                [
                    sql_text(lead),
                    sql_text(tipo_documento),
                    sql_text(documento),
                    sql_text(cliente),
                    sql_text(celular_registro),
                    sql_text(celular_referencia),
                    sql_text(direccion),
                    sql_date(fecha_instalacion),
                    sql_text(plan_snapshot),
                    sql_num(precio_final),
                    id_plataforma,
                    sql_text(sheet),
                    sql_int(fila_excel),
                    sql_int(corte),
                    sql_int(max_period),
                ]
            )
            + ")"
        )

        baja_period = None
        for payer in payers:
            match = re.search(r"BAJA\s*R\s*(\d)", clean(payer).upper())
            if match:
                baja_period = int(match.group(1))
                break

        previous_closed_paid = True
        for numero in [1, 2, 3]:
            amount_value = amounts[numero - 1]
            emission_value = emissions[numero - 1]
            if (amount_value is None or pd.isna(amount_value) or str(amount_value).strip() == "") and is_numeric_non_date(emission_value):
                amount_value = emission_value
                emission_value = None
            payer_text = clean(payers[numero - 1]).upper()
            has_payment = paydates[numero - 1] is not None and not pd.isna(paydates[numero - 1])
            is_baja = baja_period == numero
            should_exist = numero == 1 or (previous_closed_paid and numero <= max_period) or has_payment or is_baja
            if not should_exist:
                previous_closed_paid = False
                continue

            aportante = None
            estado_pago = None
            estado_periodo = "ABIERTO"
            condicion = "NORMAL"
            if is_baja:
                estado_periodo = "CERRADO_BAJA"
                previous_closed_paid = False
            elif has_payment:
                if payer_text == "ALBRU":
                    aportante = "EMPRESA"
                    estado_pago = "PAGADO_EMPRESA"
                    estado_periodo = "CERRADO_PAGO_EMPRESA"
                else:
                    aportante = "CLIENTE"
                    estado_pago = "PAGADO_CLIENTE"
                    estado_periodo = "CERRADO_PAGO_CLIENTE"
                previous_closed_paid = True
            else:
                previous_closed_paid = False

            period_values.append(
                "        ("
                + ", ".join(
                    [
                        sql_text(lead),
                        sql_text(documento),
                        str(numero),
                        sql_text(estado_periodo),
                        sql_num(amount_value),
                        sql_date(emission_value),
                        sql_date(dues[numero - 1]),
                        sql_text(aportante),
                        sql_text(estado_pago),
                        sql_num(amount_value),
                        sql_date(paydates[numero - 1]),
                        sql_text(condicion if estado_pago else None),
                        sql_text(contact_type),
                        sql_int(advisor_score),
                        sql_int(service_score),
                        sql_text(sheet),
                        sql_int(fila_excel),
                    ]
                )
                + ")"
            )

            if estado_periodo != "ABIERTO":
                for tipo, val in [("SATISFACCION_ASESOR", advisor_score), ("SATISFACCION_SERVICIO", service_score)]:
                    survey_values.append(
                        "        ("
                        + ", ".join(
                            [
                                sql_text(lead),
                                sql_text(documento),
                                str(numero),
                                sql_text(tipo),
                                sql_int(val),
                                sql_text(contact_type),
                            ]
                        )
                        + ")"
                    )

if len(rows) != 710:
    raise SystemExit(f"Expected 710 rows, got {len(rows)}")


sql = f"""\\set ON_ERROR_STOP on

-- Backfill POSTVENTA 2026-08-01 / Script 08
-- Objetivo: reparar leads WIN del Excel POSTVENTA_ALBRU2 que quedaron en POSTVENTA
-- sin calendario/periodos por el script 05 original.

BEGIN;

CREATE TEMP TABLE tmp_postventa_repair_metrics(metric text PRIMARY KEY, value integer NOT NULL) ON COMMIT DROP;

CREATE TEMP TABLE tmp_postventa_repair_src (
    lead text NOT NULL,
    tipo_documento text NOT NULL,
    documento text NOT NULL,
    cliente text,
    celular_registro text,
    celular_referencia text,
    direccion text,
    fecha_instalacion date NOT NULL,
    plan_snapshot text,
    precio_final numeric(38,2),
    id_plataforma bigint,
    hoja_postventa text NOT NULL,
    fila_postventa integer NOT NULL,
    corte_postventa integer NOT NULL,
    max_periodo_esperado integer NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_postventa_repair_src (
    lead, tipo_documento, documento, cliente, celular_registro, celular_referencia,
    direccion, fecha_instalacion, plan_snapshot, precio_final, id_plataforma,
    hoja_postventa, fila_postventa, corte_postventa, max_periodo_esperado
)
VALUES
{",\n".join(lead_values)};

INSERT INTO tmp_postventa_repair_metrics(metric, value)
SELECT 'fuente_excel_710', count(*) FROM tmp_postventa_repair_src;

WITH contacto_upsert AS (
    INSERT INTO contacto (prefijo, lead, nombre_conocido, created_at, updated_at)
    SELECT DISTINCT '+51', s.lead, s.cliente, now(), now()
    FROM tmp_postventa_repair_src s
    WHERE NOT EXISTS (
        SELECT 1
        FROM lead l
        LEFT JOIN contacto ct_existing ON ct_existing.id = l.id_contacto
        LEFT JOIN datos_preventa dp ON dp.id = l.id_datos_preventa
        WHERE regexp_replace(coalesce(l.lead, ct_existing.lead, ''), '\\D', '', 'g') = s.lead
          AND (
              ltrim(regexp_replace(coalesce(l.numero_documento_titular_servicio_snapshot, ''), '\\D', '', 'g'), '0') = ltrim(s.documento, '0')
              OR ltrim(regexp_replace(coalesce(dp.numero_documento_titular_servicio, ''), '\\D', '', 'g'), '0') = ltrim(s.documento, '0')
          )
    )
    ON CONFLICT (prefijo, lead) DO UPDATE
    SET nombre_conocido = COALESCE(NULLIF(contacto.nombre_conocido, ''), EXCLUDED.nombre_conocido),
        updated_at = now()
    RETURNING id, lead
), missing_src AS (
    SELECT s.*, c.id AS id_contacto
    FROM tmp_postventa_repair_src s
    JOIN contacto_upsert c ON c.lead = s.lead
    WHERE NOT EXISTS (
        SELECT 1
        FROM lead l
        LEFT JOIN contacto ct_existing ON ct_existing.id = l.id_contacto
        LEFT JOIN datos_preventa dp ON dp.id = l.id_datos_preventa
        WHERE regexp_replace(coalesce(l.lead, ct_existing.lead, ''), '\\D', '', 'g') = s.lead
          AND (
              ltrim(regexp_replace(coalesce(l.numero_documento_titular_servicio_snapshot, ''), '\\D', '', 'g'), '0') = ltrim(s.documento, '0')
              OR ltrim(regexp_replace(coalesce(dp.numero_documento_titular_servicio, ''), '\\D', '', 'g'), '0') = ltrim(s.documento, '0')
          )
    )
), datos_insert AS (
    INSERT INTO datos_preventa (
        tipo_documento, numero_documento_titular_servicio, nombre_titular_servicio,
        celular_registro, celular_referencia
    )
    SELECT tipo_documento, documento, cliente, NULLIF(celular_registro, ''), NULLIF(celular_referencia, '')
    FROM missing_src
    RETURNING id, numero_documento_titular_servicio
), direccion_insert AS (
    INSERT INTO direccion (tipo_domicilio, direccion, referencia)
    SELECT 'HOGAR', NULLIF(direccion, ''), concat('BACKFILL_POSTVENTA_20260801_REPAIR | ', hoja_postventa, ' fila ', fila_postventa, ' doc ', documento)
    FROM missing_src
    RETURNING id, referencia
), missing_prepared AS (
    SELECT s.*, dp.id AS id_datos_preventa, di.id AS id_direccion
    FROM missing_src s
    JOIN datos_insert dp ON dp.numero_documento_titular_servicio = s.documento
    JOIN direccion_insert di ON di.referencia = concat('BACKFILL_POSTVENTA_20260801_REPAIR | ', s.hoja_postventa, ' fila ', s.fila_postventa, ' doc ', s.documento)
), lead_insert AS (
    INSERT INTO lead (
        prefijo, lead, id_contacto, id_equipo, etapa, estado, base, id_campana,
        numero_documento_titular_servicio_snapshot, direccion_snapshot,
        id_datos_preventa, id_direccion, id_plan, nombre_plan_snapshot,
        nombre_proveedor_snapshot, precio_plan_snapshot, precio_adicionales_snapshot,
        precio_final, dia_corte_facturacion, meses_permanencia_snapshot,
        id_plataforma_digital_ofrecida, estado_cliente_postventa,
        created_at, last_entry_at, updated_at
    )
    SELECT
        '+51', lead, id_contacto, 1, 'POSTVENTA', 'GESTIONADO', 'MASIVO', NULL,
        documento, NULLIF(direccion, ''), id_datos_preventa, id_direccion, NULL,
        COALESCE(NULLIF(plan_snapshot, ''), 'WIN'), 'WIN', precio_final, NULL, precio_final,
        23, 3, id_plataforma, 'ACTIVO',
        fecha_instalacion::timestamp AT TIME ZONE 'America/Lima',
        fecha_instalacion::timestamp AT TIME ZONE 'America/Lima',
        now()
    FROM missing_prepared
    RETURNING id
)
INSERT INTO tmp_postventa_repair_metrics(metric, value)
SELECT 'leads_creados', count(*) FROM lead_insert;

CREATE TEMP TABLE tmp_postventa_repair_lead_match AS
SELECT
    s.*,
    m.id_lead,
    m.match_count,
    m.match_strategy
FROM tmp_postventa_repair_src s
LEFT JOIN LATERAL (
    WITH candidates AS (
        SELECT
            l.id AS id_lead,
            l.etapa,
            c.id AS id_calendario,
            c.mes_corte_base,
            c.numero_corte_base,
            CASE
                WHEN c.mes_corte_base = date_trunc('month', s.fecha_instalacion)::date
                 AND c.numero_corte_base = s.corte_postventa THEN 0
                WHEN l.etapa IN ('POSTVENTA', 'COBRANZA') THEN 1
                WHEN c.id IS NOT NULL THEN 2
                ELSE 3
            END AS priority
        FROM lead l
        LEFT JOIN contacto ct ON ct.id = l.id_contacto
        LEFT JOIN datos_preventa dp ON dp.id = l.id_datos_preventa
        LEFT JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
        WHERE regexp_replace(coalesce(l.lead, ct.lead, ''), '\\D', '', 'g') = s.lead
          AND (
              ltrim(regexp_replace(coalesce(l.numero_documento_titular_servicio_snapshot, ''), '\\D', '', 'g'), '0') = ltrim(s.documento, '0')
              OR ltrim(regexp_replace(coalesce(dp.numero_documento_titular_servicio, ''), '\\D', '', 'g'), '0') = ltrim(s.documento, '0')
          )
    ), ranked AS (
        SELECT
            candidates.*,
            count(*) OVER () AS match_count,
            row_number() OVER (ORDER BY priority, id_lead) AS rn
        FROM candidates
    )
    SELECT
        id_lead,
        match_count,
        CASE priority
            WHEN 0 THEN 'CALENDARIO_EXACTO'
            WHEN 1 THEN 'ETAPA_POSTVENTA_COBRANZA'
            WHEN 2 THEN 'CALENDARIO_EXISTENTE'
            ELSE 'PRIMER_ID'
        END AS match_strategy
    FROM ranked
    WHERE rn = 1
) m ON true;

CREATE INDEX idx_tmp_postventa_repair_match_id ON tmp_postventa_repair_lead_match(id_lead);
CREATE INDEX idx_tmp_postventa_repair_match_key ON tmp_postventa_repair_lead_match(lead, documento);

DO $$
DECLARE
    v_no_match integer;
BEGIN
    SELECT count(*) INTO v_no_match
    FROM tmp_postventa_repair_lead_match
    WHERE id_lead IS NULL;

    IF v_no_match > 0 THEN
        RAISE EXCEPTION 'Repair POSTVENTA abortado: filas sin lead=%', v_no_match;
    END IF;
END $$;

INSERT INTO tmp_postventa_repair_metrics(metric, value)
SELECT 'filas_con_multiples_candidatos_resueltas', count(*)
FROM tmp_postventa_repair_lead_match
WHERE match_count > 1
ON CONFLICT (metric) DO UPDATE SET value = excluded.value;

WITH duplicate_calendar_deactivate AS (
    UPDATE calendario_facturacion_postventa c
    SET
        activo = false,
        corte_corregido = true,
        observacion = concat(
            COALESCE(NULLIF(c.observacion, ''), 'SIN_OBSERVACION'),
            ' | BACKFILL_POSTVENTA_20260801_REPAIR: calendario duplicado desactivado por mismo lead/fecha/corte con documento distinto al Excel'
        ),
        updated_at = now()
    FROM lead l
    LEFT JOIN contacto ct ON ct.id = l.id_contacto
    LEFT JOIN datos_preventa dp ON dp.id = l.id_datos_preventa
    JOIN tmp_postventa_repair_src s
      ON regexp_replace(coalesce(l.lead, ct.lead, ''), '\\D', '', 'g') = s.lead
    WHERE c.id_lead = l.id
      AND c.activo = true
      AND c.proveedor_snapshot = 'WIN'
      AND c.fecha_instalacion = s.fecha_instalacion
      AND c.mes_corte_base = date_trunc('month', s.fecha_instalacion)::date
      AND c.numero_corte_base = s.corte_postventa
      AND NOT EXISTS (
          SELECT 1
          FROM tmp_postventa_repair_lead_match lm
          WHERE lm.id_lead = l.id
      )
      AND ltrim(regexp_replace(coalesce(l.numero_documento_titular_servicio_snapshot, dp.numero_documento_titular_servicio, ''), '\\D', '', 'g'), '0') <> ltrim(s.documento, '0')
    RETURNING c.id
)
INSERT INTO tmp_postventa_repair_metrics(metric, value)
SELECT 'calendarios_duplicados_mismo_lead_desactivados', count(*) FROM duplicate_calendar_deactivate
ON CONFLICT (metric) DO UPDATE SET value = excluded.value;

WITH lead_normalize AS (
    UPDATE lead l
    SET
        etapa = CASE WHEN l.etapa = 'COBRANZA' THEN l.etapa ELSE 'POSTVENTA' END,
        estado = CASE WHEN l.etapa = 'COBRANZA' THEN l.estado ELSE 'GESTIONADO' END,
        numero_documento_titular_servicio_snapshot = COALESCE(NULLIF(l.numero_documento_titular_servicio_snapshot, ''), lm.documento),
        nombre_proveedor_snapshot = 'WIN',
        nombre_plan_snapshot = COALESCE(NULLIF(l.nombre_plan_snapshot, ''), NULLIF(lm.plan_snapshot, ''), 'WIN'),
        precio_plan_snapshot = COALESCE(l.precio_plan_snapshot, lm.precio_final),
        precio_final = COALESCE(l.precio_final, lm.precio_final),
        dia_corte_facturacion = 23,
        meses_permanencia_snapshot = 3,
        id_plataforma_digital_ofrecida = COALESCE(l.id_plataforma_digital_ofrecida, lm.id_plataforma),
        estado_cliente_postventa = COALESCE(l.estado_cliente_postventa, 'ACTIVO'),
        updated_at = now()
    FROM tmp_postventa_repair_lead_match lm
    WHERE l.id = lm.id_lead
    RETURNING l.id
)
INSERT INTO tmp_postventa_repair_metrics(metric, value)
SELECT 'leads_normalizados', count(*) FROM lead_normalize;

WITH datos_update AS (
    UPDATE datos_preventa dp
    SET
        nombre_titular_servicio = lm.cliente
    FROM lead l
    JOIN tmp_postventa_repair_lead_match lm ON lm.id_lead = l.id
    WHERE dp.id = l.id_datos_preventa
      AND NULLIF(lm.cliente, '') IS NOT NULL
      AND dp.nombre_titular_servicio IS DISTINCT FROM lm.cliente
    RETURNING dp.id
), contacto_update AS (
    UPDATE contacto ct
    SET
        nombre_conocido = lm.cliente,
        updated_at = now()
    FROM lead l
    JOIN tmp_postventa_repair_lead_match lm ON lm.id_lead = l.id
    WHERE ct.id = l.id_contacto
      AND NULLIF(lm.cliente, '') IS NOT NULL
      AND ct.nombre_conocido IS DISTINCT FROM lm.cliente
    RETURNING ct.id
), nombre_metrics AS (
    SELECT 'datos_preventa_nombres_actualizados' AS metric, count(*) AS value FROM datos_update
    UNION ALL
    SELECT 'contacto_nombres_actualizados', count(*) FROM contacto_update
)
INSERT INTO tmp_postventa_repair_metrics(metric, value)
SELECT metric, value FROM nombre_metrics
ON CONFLICT (metric) DO UPDATE SET value = excluded.value;

WITH existing_calendar AS (
    SELECT lm.*, c.id AS id_calendario
    FROM tmp_postventa_repair_lead_match lm
    JOIN calendario_facturacion_postventa c ON c.id_lead = lm.id_lead AND c.activo = true
), calendar_update AS (
    UPDATE calendario_facturacion_postventa c
    SET
        fecha_instalacion = lm.fecha_instalacion,
        proveedor_snapshot = 'WIN',
        plan_snapshot = COALESCE(NULLIF(c.plan_snapshot, ''), NULLIF(lm.plan_snapshot, ''), 'WIN'),
        meses_permanencia_snapshot = 3,
        monto_plan_snapshot = COALESCE(c.monto_plan_snapshot, lm.precio_final),
        tipo_regla_proveedor = 'WIN',
        dia_corte = 23,
        dia_vencimiento = 28,
        mes_corte_base = date_trunc('month', lm.fecha_instalacion)::date,
        numero_corte_base = lm.corte_postventa,
        bloque_facturacion = CASE WHEN lm.corte_postventa = 2 THEN 'MES_SIGUIENTE' ELSE 'MISMO_MES' END,
        requiere_prorrateo_inicial = true,
        observacion = concat('BACKFILL_POSTVENTA_20260801_REPAIR | calendario reparado desde ', lm.hoja_postventa, ' fila ', lm.fila_postventa),
        updated_at = now()
    FROM existing_calendar lm
    WHERE c.id = lm.id_calendario
      AND (
          c.mes_corte_base IS DISTINCT FROM date_trunc('month', lm.fecha_instalacion)::date
          OR c.numero_corte_base IS DISTINCT FROM lm.corte_postventa
          OR c.proveedor_snapshot IS DISTINCT FROM 'WIN'
      )
    RETURNING c.id
), calendar_insert AS (
    INSERT INTO calendario_facturacion_postventa (
        id_lead, fecha_instalacion, proveedor_snapshot, plan_snapshot,
        meses_permanencia_snapshot, monto_plan_snapshot, tipo_regla_proveedor,
        dia_corte, dia_vencimiento, mes_corte_base, numero_corte_base,
        bloque_facturacion, requiere_prorrateo_inicial, activo, corte_corregido,
        observacion, created_at, updated_at
    )
    SELECT
        lm.id_lead,
        lm.fecha_instalacion,
        'WIN',
        COALESCE(NULLIF(lm.plan_snapshot, ''), l.nombre_plan_snapshot, 'WIN'),
        3,
        COALESCE(lm.precio_final, l.precio_final),
        'WIN',
        23,
        28,
        date_trunc('month', lm.fecha_instalacion)::date,
        lm.corte_postventa,
        CASE WHEN lm.corte_postventa = 2 THEN 'MES_SIGUIENTE' ELSE 'MISMO_MES' END,
        true,
        true,
        false,
        concat('BACKFILL_POSTVENTA_20260801_REPAIR | calendario creado desde ', lm.hoja_postventa, ' fila ', lm.fila_postventa),
        now(),
        now()
    FROM tmp_postventa_repair_lead_match lm
    JOIN lead l ON l.id = lm.id_lead
    WHERE NOT EXISTS (
        SELECT 1
        FROM calendario_facturacion_postventa c
        WHERE c.id_lead = lm.id_lead AND c.activo = true
    )
    RETURNING id
), calendar_metrics AS (
    SELECT 'calendarios_actualizados' AS metric, count(*) AS value FROM calendar_update
    UNION ALL
    SELECT 'calendarios_insertados', count(*) FROM calendar_insert
)
INSERT INTO tmp_postventa_repair_metrics(metric, value)
SELECT metric, value FROM calendar_metrics
ON CONFLICT (metric) DO UPDATE SET value = excluded.value;

CREATE TEMP TABLE tmp_postventa_repair_period_src (
    lead text NOT NULL,
    documento text NOT NULL,
    numero_periodo integer NOT NULL,
    estado_periodo text NOT NULL,
    monto_facturado numeric(38, 2),
    fecha_emision_confirmada date,
    fecha_vencimiento_confirmado date,
    aportante text,
    estado_pago text,
    monto_pago numeric(38, 2),
    fecha_pago date,
    condicion_pago text,
    tipo_contacto text,
    encuesta_asesor integer,
    encuesta_servicio integer,
    hoja_postventa text NOT NULL,
    fila_postventa integer NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_postventa_repair_period_src (
    lead, documento, numero_periodo, estado_periodo, monto_facturado,
    fecha_emision_confirmada, fecha_vencimiento_confirmado, aportante, estado_pago,
    monto_pago, fecha_pago, condicion_pago, tipo_contacto, encuesta_asesor,
    encuesta_servicio, hoja_postventa, fila_postventa
)
VALUES
{",\n".join(period_values)};

INSERT INTO tmp_postventa_repair_metrics(metric, value)
SELECT 'periodos_fuente', count(*) FROM tmp_postventa_repair_period_src;

CREATE TEMP TABLE tmp_postventa_repair_period_match AS
SELECT
    ps.*,
    lm.id_lead,
    c.id AS id_calendario,
    c.mes_corte_base,
    c.numero_corte_base,
    c.monto_plan_snapshot
FROM tmp_postventa_repair_period_src ps
JOIN tmp_postventa_repair_lead_match lm
    ON lm.lead = ps.lead AND lm.documento = ps.documento
JOIN calendario_facturacion_postventa c
    ON c.id_lead = lm.id_lead
   AND c.activo = true
   AND c.mes_corte_base = date_trunc('month', lm.fecha_instalacion)::date
   AND c.numero_corte_base = lm.corte_postventa;

CREATE INDEX idx_tmp_postventa_repair_period_match ON tmp_postventa_repair_period_match(id_lead, numero_periodo);

WITH period_insert AS (
    INSERT INTO periodo_facturacion_postventa (
        id_calendario_facturacion, id_lead, numero_periodo,
        fecha_inicio_periodo, fecha_fin_periodo, fecha_corte_estimada,
        fecha_vencimiento_estimado, monto_esperado, estado,
        observacion, created_at, updated_at
    )
    SELECT
        p.id_calendario,
        p.id_lead,
        p.numero_periodo,
        CASE
            WHEN p.numero_periodo = 1 AND p.numero_corte_base = 2 THEN p.mes_corte_base + interval '22 days'
            WHEN p.numero_periodo = 1 THEN p.mes_corte_base
            ELSE (
                CASE WHEN p.numero_corte_base = 2 THEN p.mes_corte_base + interval '1 month' + interval '27 days'
                     ELSE p.mes_corte_base + interval '27 days' END
                + ((p.numero_periodo - 2) || ' months')::interval + interval '1 day'
            )
        END::date,
        (
            CASE WHEN p.numero_corte_base = 2 THEN p.mes_corte_base + interval '1 month' + interval '27 days'
                 ELSE p.mes_corte_base + interval '27 days' END
            + ((p.numero_periodo - 1) || ' months')::interval
        )::date,
        (date_trunc('month', (
            CASE WHEN p.numero_corte_base = 2 THEN p.mes_corte_base + interval '1 month' + interval '27 days'
                 ELSE p.mes_corte_base + interval '27 days' END
            + ((p.numero_periodo - 1) || ' months')::interval
        )) + interval '22 days')::date,
        (
            CASE WHEN p.numero_corte_base = 2 THEN p.mes_corte_base + interval '1 month' + interval '27 days'
                 ELSE p.mes_corte_base + interval '27 days' END
            + ((p.numero_periodo - 1) || ' months')::interval
        )::date,
        COALESCE(p.monto_plan_snapshot, p.monto_facturado),
        'ABIERTO',
        concat('BACKFILL_POSTVENTA_20260801_REPAIR | periodo ', p.numero_periodo, ' desde ', p.hoja_postventa, ' fila ', p.fila_postventa),
        now(),
        now()
    FROM tmp_postventa_repair_period_match p
    WHERE NOT EXISTS (
        SELECT 1
        FROM periodo_facturacion_postventa px
        WHERE px.id_lead = p.id_lead AND px.numero_periodo = p.numero_periodo
    )
    RETURNING id
)
INSERT INTO tmp_postventa_repair_metrics(metric, value)
SELECT 'periodos_insertados', count(*) FROM period_insert
ON CONFLICT (metric) DO UPDATE SET value = excluded.value;

CREATE TEMP TABLE tmp_postventa_repair_period_resolved AS
SELECT p.*, pf.id AS id_periodo
FROM tmp_postventa_repair_period_match p
JOIN periodo_facturacion_postventa pf
    ON pf.id_lead = p.id_lead AND pf.numero_periodo = p.numero_periodo;

WITH period_update AS (
    UPDATE periodo_facturacion_postventa pf
    SET
        id_calendario_facturacion = pr.id_calendario,
        fecha_emision_confirmada = pr.fecha_emision_confirmada,
        fecha_vencimiento_confirmado = pr.fecha_vencimiento_confirmado,
        monto_facturado = pr.monto_facturado,
        estado = CASE
            WHEN pr.estado_periodo = 'ABIERTO'
              AND (
                  pf.estado IN ('CERRADO_PAGO_CLIENTE', 'CERRADO_PAGO_EMPRESA')
                  OR EXISTS (
                      SELECT 1
                      FROM pago_postventa pp
                      WHERE pp.id_periodo_facturacion = pf.id
                        AND pp.estado IN ('PAGADO_CLIENTE', 'PAGADO_EMPRESA')
                  )
              )
            THEN pf.estado
            ELSE pr.estado_periodo
        END,
        observacion = concat('BACKFILL_POSTVENTA_20260801_REPAIR | ', pr.hoja_postventa, ' fila ', pr.fila_postventa),
        updated_at = now()
    FROM tmp_postventa_repair_period_resolved pr
    WHERE pf.id = pr.id_periodo
    RETURNING pf.id
)
INSERT INTO tmp_postventa_repair_metrics(metric, value)
SELECT 'periodos_actualizados', count(*) FROM period_update
ON CONFLICT (metric) DO UPDATE SET value = excluded.value;

WITH pago_insert AS (
    INSERT INTO pago_postventa (
        id_lead, id_periodo_facturacion, aportante, estado, monto,
        fecha_pago, condicion, observacion, created_at, updated_at
    )
    SELECT
        pr.id_lead,
        pr.id_periodo,
        pr.aportante,
        pr.estado_pago,
        COALESCE(pr.monto_pago, pr.monto_facturado),
        pr.fecha_pago,
        pr.condicion_pago,
        concat('BACKFILL_POSTVENTA_20260801_REPAIR | pago Excel ', pr.hoja_postventa, ' fila ', pr.fila_postventa),
        now(),
        now()
    FROM tmp_postventa_repair_period_resolved pr
    WHERE pr.estado_pago IS NOT NULL
      AND NOT EXISTS (
          SELECT 1
          FROM pago_postventa pp
          WHERE pp.id_periodo_facturacion = pr.id_periodo
            AND pp.estado = pr.estado_pago
            AND pp.fecha_pago = pr.fecha_pago
      )
    RETURNING id
)
INSERT INTO tmp_postventa_repair_metrics(metric, value)
SELECT 'pagos_insertados', count(*) FROM pago_insert
ON CONFLICT (metric) DO UPDATE SET value = excluded.value;

CREATE TEMP TABLE tmp_postventa_repair_survey_src (
    lead text NOT NULL,
    documento text NOT NULL,
    numero_periodo integer NOT NULL,
    tipo_encuesta text NOT NULL,
    calificacion integer,
    tipo_contacto text
) ON COMMIT DROP;

INSERT INTO tmp_postventa_repair_survey_src (
    lead, documento, numero_periodo, tipo_encuesta, calificacion, tipo_contacto
)
VALUES
{",\n".join(survey_values) if survey_values else "        ('__NOOP__', '__NOOP__', 0, 'SATISFACCION_ASESOR', NULL, NULL)"};

CREATE TEMP TABLE tmp_postventa_repair_survey_resolved AS
SELECT
    ss.*,
    lm.id_lead,
    pf.id AS id_periodo,
    CASE WHEN ss.calificacion IS NULL THEN 'OMITIDA' ELSE 'REALIZADA' END AS estado_encuesta,
    CASE WHEN ss.calificacion IS NULL THEN NULL
         WHEN ss.calificacion <= 4 THEN 'MALO'
         WHEN ss.calificacion <= 6 THEN 'REGULAR'
         WHEN ss.calificacion <= 8 THEN 'BUENO'
         ELSE 'EXCELENTE' END AS status_encuesta
FROM tmp_postventa_repair_survey_src ss
JOIN tmp_postventa_repair_lead_match lm ON lm.lead = ss.lead AND lm.documento = ss.documento
JOIN periodo_facturacion_postventa pf ON pf.id_lead = lm.id_lead AND pf.numero_periodo = ss.numero_periodo
WHERE ss.lead <> '__NOOP__';

WITH encuesta_update AS (
    UPDATE encuesta_postventa e
    SET
        id_periodo_facturacion = sr.id_periodo,
        tipo_contacto = NULLIF(sr.tipo_contacto, ''),
        calificacion = sr.calificacion,
        status = sr.status_encuesta,
        estado = sr.estado_encuesta,
        prioridad = 'NORMAL',
        fecha_realizada = CASE WHEN sr.calificacion IS NULL THEN NULL ELSE now() AT TIME ZONE 'America/Lima' END,
        updated_at = now()
    FROM tmp_postventa_repair_survey_resolved sr
    WHERE e.id_lead = sr.id_lead
      AND e.numero_encuesta = sr.numero_periodo
      AND e.tipo_encuesta = sr.tipo_encuesta
    RETURNING e.id
), encuesta_insert AS (
    INSERT INTO encuesta_postventa (
        id_lead, id_periodo_facturacion, tipo_encuesta, tipo_contacto,
        calificacion, status, estado, prioridad, fecha_programada,
        fecha_limite, fecha_realizada, numero_encuesta, created_at, updated_at
    )
    SELECT
        sr.id_lead,
        sr.id_periodo,
        sr.tipo_encuesta,
        NULLIF(sr.tipo_contacto, ''),
        sr.calificacion,
        sr.status_encuesta,
        sr.estado_encuesta,
        'NORMAL',
        now() AT TIME ZONE 'America/Lima',
        (now() AT TIME ZONE 'America/Lima') + interval '48 hours',
        CASE WHEN sr.calificacion IS NULL THEN NULL ELSE now() AT TIME ZONE 'America/Lima' END,
        sr.numero_periodo,
        now(),
        now()
    FROM tmp_postventa_repair_survey_resolved sr
    WHERE NOT EXISTS (
        SELECT 1
        FROM encuesta_postventa e
        WHERE e.id_lead = sr.id_lead
          AND e.numero_encuesta = sr.numero_periodo
          AND e.tipo_encuesta = sr.tipo_encuesta
    )
    RETURNING id
), encuesta_metrics AS (
    SELECT 'encuestas_actualizadas' AS metric, count(*) AS value FROM encuesta_update
    UNION ALL
    SELECT 'encuestas_insertadas', count(*) FROM encuesta_insert
)
INSERT INTO tmp_postventa_repair_metrics(metric, value)
SELECT metric, value FROM encuesta_metrics
ON CONFLICT (metric) DO UPDATE SET value = excluded.value;

CREATE TEMP TABLE tmp_postventa_repair_lead_final AS
SELECT
    lm.id_lead,
    bool_or(p.estado IN ('CERRADO_BAJA', 'CERRADO_BAJA_ADEUDO')) AS tiene_baja,
    bool_or(p.numero_periodo = 3 AND p.estado IN ('CERRADO_PAGO_CLIENTE', 'CERRADO_PAGO_EMPRESA'))
        AND bool_or(
            (date_trunc('month', lm.fecha_instalacion)::date = date '2026-04-01' AND lm.corte_postventa = 2)
            OR (date_trunc('month', lm.fecha_instalacion)::date = date '2026-05-01' AND lm.corte_postventa = 1)
        ) AS completo_para_cobranza,
    max(p.numero_periodo) FILTER (WHERE p.estado IN ('CERRADO_PAGO_EMPRESA')) AS ultimo_pago_empresa
FROM tmp_postventa_repair_lead_match lm
JOIN periodo_facturacion_postventa p ON p.id_lead = lm.id_lead
GROUP BY lm.id_lead;

WITH lead_update AS (
    UPDATE lead l
    SET
        etapa = CASE WHEN lf.completo_para_cobranza AND NOT lf.tiene_baja THEN 'COBRANZA' ELSE 'POSTVENTA' END,
        estado = CASE WHEN lf.completo_para_cobranza AND NOT lf.tiene_baja THEN 'NUEVO' ELSE l.estado END,
        id_asesor_asignado = NULL,
        nombre_asesor_asignado = NULL,
        id_tipificacion = CASE WHEN lf.completo_para_cobranza AND NOT lf.tiene_baja THEN NULL ELSE l.id_tipificacion END,
        codigo_tipificacion = CASE WHEN lf.completo_para_cobranza AND NOT lf.tiene_baja THEN NULL ELSE l.codigo_tipificacion END,
        id_subtipificacion = CASE WHEN lf.completo_para_cobranza AND NOT lf.tiene_baja THEN NULL ELSE l.id_subtipificacion END,
        codigo_subtipificacion = CASE WHEN lf.completo_para_cobranza AND NOT lf.tiene_baja THEN NULL ELSE l.codigo_subtipificacion END,
        estado_cliente_postventa = CASE
            WHEN lf.tiene_baja THEN 'BAJA'
            WHEN l.estado_cliente_postventa = 'SUSPENDIDO' THEN 'SUSPENDIDO'
            WHEN lf.completo_para_cobranza THEN 'ACTIVO'
            WHEN lf.ultimo_pago_empresa IS NOT NULL THEN 'SUSPENDIDO'
            ELSE 'ACTIVO'
        END,
        updated_at = now()
    FROM tmp_postventa_repair_lead_final lf
    WHERE l.id = lf.id_lead
    RETURNING l.id
)
INSERT INTO tmp_postventa_repair_metrics(metric, value)
SELECT 'leads_estado_actualizado', count(*) FROM lead_update
ON CONFLICT (metric) DO UPDATE SET value = excluded.value;

DO $$
DECLARE
    v_sin_calendario integer;
    v_sin_periodo integer;
    v_multi_abierto integer;
    v_pago_abierto integer;
BEGIN
    SELECT count(*) INTO v_sin_calendario
    FROM tmp_postventa_repair_lead_match lm
    WHERE NOT EXISTS (
        SELECT 1
        FROM calendario_facturacion_postventa c
        WHERE c.id_lead = lm.id_lead
          AND c.activo = true
          AND c.proveedor_snapshot = 'WIN'
          AND c.mes_corte_base = date_trunc('month', lm.fecha_instalacion)::date
          AND c.numero_corte_base = lm.corte_postventa
    );

    SELECT count(*) INTO v_sin_periodo
    FROM tmp_postventa_repair_period_match pm
    WHERE NOT EXISTS (
        SELECT 1
        FROM periodo_facturacion_postventa p
        WHERE p.id_lead = pm.id_lead
          AND p.numero_periodo = pm.numero_periodo
    );

    SELECT count(*) INTO v_multi_abierto
    FROM (
        SELECT p.id_lead
        FROM periodo_facturacion_postventa p
        JOIN tmp_postventa_repair_lead_match lm ON lm.id_lead = p.id_lead
        WHERE p.estado = 'ABIERTO'
        GROUP BY p.id_lead
        HAVING count(*) > 1
    ) x;

    SELECT count(*) INTO v_pago_abierto
    FROM periodo_facturacion_postventa p
    JOIN tmp_postventa_repair_lead_match lm ON lm.id_lead = p.id_lead
    JOIN pago_postventa pp ON pp.id_periodo_facturacion = p.id
    WHERE p.estado = 'ABIERTO';

    IF v_sin_calendario > 0 OR v_sin_periodo > 0 OR v_multi_abierto > 0 OR v_pago_abierto > 0 THEN
        RAISE EXCEPTION 'Repair POSTVENTA incoherente: sin_calendario=%, sin_periodo=%, multi_abierto=%, pago_abierto=%',
            v_sin_calendario, v_sin_periodo, v_multi_abierto, v_pago_abierto;
    END IF;
END $$;

WITH cortes(label, mes, corte, esperado) AS (
    VALUES
        ('JUL 1', date '2026-07-01', 1, 126),
        ('JUN 2', date '2026-06-01', 2, 65),
        ('JUN 1', date '2026-06-01', 1, 223),
        ('MAY 2', date '2026-05-01', 2, 68),
        ('MAY 1', date '2026-05-01', 1, 163),
        ('ABR 2', date '2026-04-01', 2, 65)
), conteos AS (
    SELECT
        co.label,
        co.esperado,
        count(DISTINCT lm.id_lead) AS excel_cubiertos,
        count(DISTINCT c.id_lead) AS sistema_win_activos
    FROM cortes co
    LEFT JOIN tmp_postventa_repair_lead_match lm
        ON date_trunc('month', lm.fecha_instalacion)::date = co.mes
       AND lm.corte_postventa = co.corte
    LEFT JOIN calendario_facturacion_postventa c
        ON c.mes_corte_base = co.mes
       AND c.numero_corte_base = co.corte
       AND c.activo = true
       AND c.proveedor_snapshot = 'WIN'
    GROUP BY co.label, co.esperado
)
SELECT * FROM conteos ORDER BY label;

DO $$
DECLARE
    v_invalidos integer;
BEGIN
    WITH cortes(label, mes, corte, esperado) AS (
        VALUES
            ('JUL 1', date '2026-07-01', 1, 126),
            ('JUN 2', date '2026-06-01', 2, 65),
            ('JUN 1', date '2026-06-01', 1, 223),
            ('MAY 2', date '2026-05-01', 2, 68),
            ('MAY 1', date '2026-05-01', 1, 163),
            ('ABR 2', date '2026-04-01', 2, 65)
    )
    SELECT count(*) INTO v_invalidos
    FROM cortes co
    LEFT JOIN tmp_postventa_repair_lead_match lm
        ON date_trunc('month', lm.fecha_instalacion)::date = co.mes
       AND lm.corte_postventa = co.corte
    GROUP BY co.label, co.esperado
    HAVING count(DISTINCT lm.id_lead) <> co.esperado
    LIMIT 1;

    IF coalesce(v_invalidos, 0) > 0 THEN
        RAISE EXCEPTION 'Repair POSTVENTA abortado: no todos los leads del Excel quedaron cubiertos por corte';
    END IF;
END $$;

SELECT * FROM tmp_postventa_repair_metrics ORDER BY metric;

COMMIT;
"""

OUTPUT.write_text(sql, encoding="utf-8", newline="\n")
print(f"Wrote {OUTPUT}")
print(f"leads={len(lead_values)} periods={len(period_values)} surveys={len(survey_values)}")
