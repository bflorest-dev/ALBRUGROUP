Add-Type -AssemblyName System.IO.Compression.FileSystem

$ErrorActionPreference = 'Stop'
$WorkbookPath = 'backfill-postventa-claro-20260902\DOCUMENTORAIZ\02. POSTVENTA CLARO.xlsx'
$OutputDir = 'backfill-postventa-claro-20260902\AUDITORIA'

function Read-ZipXml($zip, $name) {
    $entry = $zip.GetEntry($name)
    $reader = New-Object IO.StreamReader($entry.Open())
    [xml]$xml = $reader.ReadToEnd()
    $reader.Close()
    return $xml
}

function Get-SharedText($si) {
    return (($si.SelectNodes('.//*[local-name()="t"]') | ForEach-Object { $_.InnerText }) -join '')
}

function Get-CellText($cell, $shared) {
    $value = $cell.SelectSingleNode('./*[local-name()="v"]')
    if ($null -eq $value) {
        return $null
    }
    $raw = $value.InnerText
    if ($cell.GetAttribute('t') -eq 's') {
        return $shared[[int]$raw]
    }
    return $raw
}

function Convert-ExcelSerialDate($serial) {
    return ([datetime]'1899-12-30').AddDays([double]$serial).ToString('yyyy-MM-dd')
}

function Quote-Sql($value) {
    if ($null -eq $value -or $value -eq '') {
        return 'NULL'
    }
    return "'" + ($value -replace "'", "''") + "'"
}

function Invoke-LeadDbCsv($sql, $outputPath) {
    $csv = $sql | docker exec -i albrugroup-postgres-lead-1 psql -U postgres -d lead_db -q -t -A
    $csv | Set-Content -LiteralPath $outputPath -Encoding UTF8
}

$zip = [IO.Compression.ZipFile]::OpenRead((Resolve-Path $WorkbookPath))
$sharedStrings = Read-ZipXml $zip 'xl/sharedStrings.xml'
$shared = @()
foreach ($item in $sharedStrings.SelectNodes('//*[local-name()="si"]')) {
    $shared += Get-SharedText $item
}

$sheetSpecs = @(
    @{ Name = 'JUN26'; Path = 'xl/worksheets/sheet1.xml'; Month = '2026-06-01' },
    @{ Name = 'JUL26'; Path = 'xl/worksheets/sheet2.xml'; Month = '2026-07-01' },
    @{ Name = 'AGO26'; Path = 'xl/worksheets/sheet3.xml'; Month = '2026-08-01' }
)

$values = @()
foreach ($spec in $sheetSpecs) {
    $sheet = Read-ZipXml $zip $spec.Path
    foreach ($row in $sheet.SelectNodes('//*[local-name()="sheetData"]/*[local-name()="row"]')) {
        $rowNumber = [int]$row.GetAttribute('r')
        $cells = @{}
        foreach ($cell in $row.SelectNodes('./*[local-name()="c"]')) {
            $column = ([regex]::Match($cell.GetAttribute('r'), '^[A-Z]+')).Value
            if (@('C', 'E', 'G', 'K', 'M') -contains $column) {
                $cells[$column] = Get-CellText $cell $shared
            }
        }
        if ($rowNumber -ge 6 -and $cells['C']) {
            $fecha = Convert-ExcelSerialDate $cells['K']
            $corteExcel = if ($cells['M']) { [int][double]$cells['M'] } else { $null }
            $values += "($(Quote-Sql $spec.Name), $rowNumber, $(Quote-Sql $cells['C']), $(Quote-Sql $cells['E']), $(Quote-Sql $cells['G']), date $(Quote-Sql $fecha), $(Quote-Sql $corteExcel), date $(Quote-Sql $spec.Month))"
        }
    }
}
$zip.Dispose()

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$valuesSql = $values -join ",`n"
$baseSql = @"
CREATE TEMP TABLE tmp_excel_claro_revision (
    hoja text,
    row_excel integer,
    lead_excel text,
    sot_excel text,
    documento_excel text,
    fecha_instalacion_excel date,
    corte_excel_m integer,
    mes_hoja date
) ON COMMIT DROP;

INSERT INTO tmp_excel_claro_revision VALUES
$valuesSql;

CREATE TEMP TABLE tmp_excel_claro_match AS
SELECT
    e.*,
    CASE WHEN EXTRACT(DAY FROM e.fecha_instalacion_excel) >= 12 THEN 2 ELSE 1 END AS corte_calculado_regla_claro,
    bm.id_lead,
    bm.lead_bd,
    bm.etapa,
    bm.sot_bd,
    bm.documento_bd,
    bm.proveedor_plan,
    bm.nombre_plan_snapshot,
    bm.precio_final,
    bm.fecha_instalacion_evento,
    bm.id_calendario,
    bm.fecha_instalacion_calendario,
    bm.mes_corte_base,
    bm.numero_corte_base,
    bm.id_periodo_uno,
    bm.match_score,
    CASE
        WHEN bm.id_lead IS NULL THEN 'NO_EXISTE_LEAD_SOT_DOC'
        WHEN bm.sot_bd IS DISTINCT FROM e.sot_excel THEN 'SOT_NO_COINCIDE'
        WHEN bm.documento_bd IS DISTINCT FROM e.documento_excel THEN 'DOCUMENTO_NO_COINCIDE'
        WHEN UPPER(TRIM(COALESCE(bm.proveedor_plan, ''))) <> 'CLARO' THEN 'EXISTE_PERO_NO_PLAN_CLARO'
        WHEN bm.etapa <> 'POSTVENTA' THEN 'PLAN_CLARO_NO_POSTVENTA'
        WHEN bm.id_calendario IS NULL THEN 'POSTVENTA_CLARO_SIN_CALENDARIO'
        WHEN bm.mes_corte_base <> e.mes_hoja OR bm.numero_corte_base <> CASE WHEN EXTRACT(DAY FROM e.fecha_instalacion_excel) >= 12 THEN 2 ELSE 1 END THEN 'CALENDARIO_EN_OTRO_CORTE'
        ELSE 'OK_CORTE_CALCULADO'
    END AS estado_revision
FROM tmp_excel_claro_revision e
LEFT JOIN LATERAL (
    SELECT
        l.id AS id_lead,
        l.lead AS lead_bd,
        l.etapa,
        l.sot AS sot_bd,
        COALESCE(dp.numero_documento_titular_servicio, l.numero_documento_titular_servicio_snapshot) AS documento_bd,
        pr.nombre AS proveedor_plan,
        l.nombre_plan_snapshot,
        l.precio_final,
        ev.fecha_instalacion AS fecha_instalacion_evento,
        c.id AS id_calendario,
        c.fecha_instalacion AS fecha_instalacion_calendario,
        c.mes_corte_base,
        c.numero_corte_base,
        p1.id AS id_periodo_uno,
        ((CASE WHEN l.lead = e.lead_excel THEN 10 ELSE 0 END)
         + (CASE WHEN l.sot = e.sot_excel THEN 50 ELSE 0 END)
         + (CASE WHEN COALESCE(dp.numero_documento_titular_servicio, l.numero_documento_titular_servicio_snapshot) = e.documento_excel THEN 40 ELSE 0 END)
         + (CASE WHEN UPPER(TRIM(COALESCE(pr.nombre, ''))) = 'CLARO' THEN 5 ELSE 0 END)
         + (CASE WHEN l.etapa = 'POSTVENTA' THEN 3 ELSE 0 END)) AS match_score
    FROM lead l
    LEFT JOIN datos_preventa dp ON dp.id = l.id_datos_preventa
    LEFT JOIN plan pl ON pl.id = l.id_plan
    LEFT JOIN proveedor pr ON pr.id = pl.id_proveedor
    LEFT JOIN LATERAL (
        SELECT ev.fecha_instalacion
        FROM evento ev
        WHERE ev.id_lead = l.id
          AND ev.accion = 'TIPIFICACION'
          AND ev.etapa = 'VENTA'
          AND ev.tipificacion = 'INSTALADO'
          AND ev.fecha_instalacion IS NOT NULL
        ORDER BY ev.created_at DESC NULLS LAST, ev.id DESC
        LIMIT 1
    ) ev ON true
    LEFT JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
    LEFT JOIN periodo_facturacion_postventa p1 ON p1.id_lead = l.id AND p1.numero_periodo = 1
    WHERE l.lead = e.lead_excel
       OR l.sot = e.sot_excel
       OR COALESCE(dp.numero_documento_titular_servicio, l.numero_documento_titular_servicio_snapshot) = e.documento_excel
    ORDER BY match_score DESC, l.id DESC
    LIMIT 1
) bm ON true;

CREATE TEMP TABLE tmp_bd_claro_cortes AS
SELECT
    l.id,
    l.lead,
    l.sot,
    COALESCE(dp.numero_documento_titular_servicio, l.numero_documento_titular_servicio_snapshot) AS documento,
    c.fecha_instalacion,
    c.mes_corte_base,
    c.numero_corte_base
FROM lead l
JOIN plan pl ON pl.id = l.id_plan
JOIN proveedor pr ON pr.id = pl.id_proveedor
JOIN calendario_facturacion_postventa c ON c.id_lead = l.id AND c.activo = true
LEFT JOIN datos_preventa dp ON dp.id = l.id_datos_preventa
WHERE l.etapa = 'POSTVENTA'
  AND UPPER(TRIM(pr.nombre)) = 'CLARO'
  AND EXISTS (
      SELECT 1
      FROM tmp_excel_claro_revision e
      WHERE e.mes_hoja = c.mes_corte_base
        AND CASE WHEN EXTRACT(DAY FROM e.fecha_instalacion_excel) >= 12 THEN 2 ELSE 1 END = c.numero_corte_base
  );
"@

$detalleSql = @"
BEGIN;
$baseSql
COPY (
    SELECT hoja, row_excel, lead_excel, sot_excel, documento_excel, fecha_instalacion_excel,
           corte_excel_m, corte_calculado_regla_claro, id_lead, etapa, proveedor_plan,
           lead_bd, sot_bd, documento_bd, nombre_plan_snapshot, precio_final,
           fecha_instalacion_evento, id_calendario, fecha_instalacion_calendario,
           mes_corte_base, numero_corte_base, id_periodo_uno, match_score, estado_revision
    FROM tmp_excel_claro_match
    ORDER BY hoja, row_excel
) TO STDOUT WITH CSV HEADER;
ROLLBACK;
"@

$faltantesSql = @"
BEGIN;
$baseSql
COPY (
    SELECT hoja, row_excel, lead_excel, sot_excel, documento_excel, fecha_instalacion_excel,
           corte_excel_m, corte_calculado_regla_claro, id_lead, etapa, proveedor_plan,
           lead_bd, sot_bd, documento_bd, nombre_plan_snapshot, precio_final,
           fecha_instalacion_evento, id_calendario, mes_corte_base, numero_corte_base,
           id_periodo_uno, estado_revision
    FROM tmp_excel_claro_match
    WHERE estado_revision <> 'OK_CORTE_CALCULADO'
    ORDER BY hoja, row_excel
) TO STDOUT WITH CSV HEADER;
ROLLBACK;
"@

$extrasSql = @"
BEGIN;
$baseSql
COPY (
    SELECT b.*
    FROM tmp_bd_claro_cortes b
    WHERE NOT EXISTS (
        SELECT 1
        FROM tmp_excel_claro_revision e
        WHERE e.lead_excel = b.lead
           OR e.sot_excel = b.sot
           OR e.documento_excel = b.documento
    )
    ORDER BY b.mes_corte_base, b.numero_corte_base, b.fecha_instalacion, b.id
) TO STDOUT WITH CSV HEADER;
ROLLBACK;
"@

$resumenSql = @"
BEGIN;
$baseSql
COPY (
    WITH excel_resumen AS (
        SELECT hoja, mes_hoja, corte_calculado_regla_claro, count(*) AS filas_excel,
               count(*) FILTER (WHERE estado_revision = 'OK_CORTE_CALCULADO') AS filas_ok,
               count(*) FILTER (WHERE estado_revision <> 'OK_CORTE_CALCULADO') AS filas_faltantes,
               count(*) FILTER (WHERE corte_excel_m IS DISTINCT FROM corte_calculado_regla_claro) AS diferencias_m_vs_regla
        FROM tmp_excel_claro_match
        GROUP BY hoja, mes_hoja, corte_calculado_regla_claro
    ),
    bd_resumen AS (
        SELECT mes_corte_base, numero_corte_base, count(*) AS filas_bd
        FROM tmp_bd_claro_cortes
        GROUP BY mes_corte_base, numero_corte_base
    ),
    extras_resumen AS (
        SELECT b.mes_corte_base, b.numero_corte_base, count(*) AS extras_bd
        FROM tmp_bd_claro_cortes b
        WHERE NOT EXISTS (
            SELECT 1
            FROM tmp_excel_claro_revision e
            WHERE e.lead_excel = b.lead
               OR e.sot_excel = b.sot
               OR e.documento_excel = b.documento
        )
        GROUP BY b.mes_corte_base, b.numero_corte_base
    )
    SELECT e.hoja, e.mes_hoja AS mes_corte_base, e.corte_calculado_regla_claro AS numero_corte_base,
           e.filas_excel, COALESCE(b.filas_bd, 0) AS filas_bd,
           e.filas_ok, e.filas_faltantes, COALESCE(x.extras_bd, 0) AS extras_bd,
           e.diferencias_m_vs_regla
    FROM excel_resumen e
    LEFT JOIN bd_resumen b ON b.mes_corte_base = e.mes_hoja AND b.numero_corte_base = e.corte_calculado_regla_claro
    LEFT JOIN extras_resumen x ON x.mes_corte_base = e.mes_hoja AND x.numero_corte_base = e.corte_calculado_regla_claro
    ORDER BY e.mes_hoja, e.corte_calculado_regla_claro
) TO STDOUT WITH CSV HEADER;
ROLLBACK;
"@

$corteDiffSql = @"
BEGIN;
$baseSql
COPY (
    SELECT hoja, row_excel, lead_excel, sot_excel, documento_excel, fecha_instalacion_excel,
           corte_excel_m, corte_calculado_regla_claro
    FROM tmp_excel_claro_match
    WHERE corte_excel_m IS DISTINCT FROM corte_calculado_regla_claro
    ORDER BY hoja, row_excel
) TO STDOUT WITH CSV HEADER;
ROLLBACK;
"@

Invoke-LeadDbCsv $detalleSql (Join-Path $OutputDir 'detalle_revision_jun_jul_ago.csv')
Invoke-LeadDbCsv $faltantesSql (Join-Path $OutputDir 'faltantes_excel.csv')
Invoke-LeadDbCsv $extrasSql (Join-Path $OutputDir 'extras_bd_no_excel.csv')
Invoke-LeadDbCsv $resumenSql (Join-Path $OutputDir 'resumen_por_corte.csv')
Invoke-LeadDbCsv $corteDiffSql (Join-Path $OutputDir 'discrepancias_corte_excel_vs_regla.csv')

Get-ChildItem $OutputDir -File | Select-Object Name, Length
