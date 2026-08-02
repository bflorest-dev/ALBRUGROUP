param(
    [string]$Container = "albrugroup-postgres-lead-1",
    [string]$User = "postgres",
    [string]$Database = "lead_db",
    [ValidateSet("01", "02", "03", "04", "05", "06", "07", "08", "09", "10")]
    [string]$Only,
    [ValidateSet("01", "02", "03", "04", "05", "06", "07", "08", "09", "10")]
    [string]$From
)

$ErrorActionPreference = "Stop"

$scripts = @(
    "01_registrar_19_faltantes_postventa.sql",
    "02_regularizar_7_multiservicio_preventa_postventa.sql",
    "03_regularizar_358_preventa_simples_postventa.sql",
    "04_regularizar_60_venta_postventa.sql",
    "05_backfill_periodos_pagos_encuestas_postventa.sql",
    "08_reparar_calendarios_periodos_postventa.sql",
    "09_crear_periodos_siguientes_postventa.sql",
    "10_corregir_referidos_postventa_win.sql",
    "06_validar_backfill_postventa.sql",
    "07_validar_coherencia_backfill_postventa.sql"
)

if ($Only) {
    $scripts = $scripts | Where-Object { $_.StartsWith($Only) }
}
elseif ($From) {
    $startIndex = [array]::FindIndex($scripts, [Predicate[string]]{ param($name) $name.StartsWith($From) })
    if ($startIndex -lt 0) {
        throw "No se encontro script con prefijo $From"
    }
    $scripts = $scripts[$startIndex..($scripts.Count - 1)]
}

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($script in $scripts) {
    $path = Join-Path $baseDir $script
    if (-not (Test-Path $path)) {
        throw "No existe el script: $path"
    }

    Write-Host ""
    Write-Host "Ejecutando $script" -ForegroundColor Cyan
    $containerPath = "/tmp/backfill-postventa-20260801-$script"
    docker cp $path "${Container}:$containerPath"
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo copiar $script al contenedor"
    }

    docker exec $Container psql -U $User -d $Database -v ON_ERROR_STOP=1 -f $containerPath
    if ($LASTEXITCODE -ne 0) {
        throw "Fallo la ejecucion de $script"
    }
}

Write-Host ""
Write-Host "Backfill POSTVENTA finalizado." -ForegroundColor Green
