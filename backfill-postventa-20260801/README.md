# Backfill POSTVENTA 2026-08-01

Paquete operativo para regularizar leads de POSTVENTA y reconstruir periodos, pagos y encuestas desde la fuente validada `POSTVENTA_ALBRU2.xlsx`.

## Alcance

- Fuente final: `POSTVENTA_ALBRU2.xlsx`.
- Registros considerados para backfill: 710.
- Cortes incluidos:
  - Abril 2
  - Mayo 1
  - Mayo 2
  - Junio 1
  - Junio 2
  - Julio 1
- Julio 2 no se ejecuta en este backfill. Los 14 registros detectados quedan solo como lista de revision.

## Orden

Ejecutar en este orden:

1. `01_registrar_19_faltantes_postventa.sql`
2. `02_regularizar_7_multiservicio_preventa_postventa.sql`
3. `03_regularizar_358_preventa_simples_postventa.sql`
4. `04_regularizar_60_venta_postventa.sql`
5. `05_backfill_periodos_pagos_encuestas_postventa.sql`
6. `08_reparar_calendarios_periodos_postventa.sql`
7. `06_validar_backfill_postventa.sql`
8. `07_validar_coherencia_backfill_postventa.sql`

Los scripts 1 al 5 modifican datos. El script 8 corrige calendarios, periodos, pagos y encuestas que hayan quedado incompletos para que los conteos por corte coincidan con el Excel. Los scripts 6 y 7 son de validacion.

Si ya se ejecutaron los scripts 1 al 7 antes de esta correccion, ejecutar solo:

```powershell
.\backfill-postventa-20260801\run-local.ps1 -Only 08
```

Luego ejecutar las validaciones:

```powershell
.\backfill-postventa-20260801\run-local.ps1 -From 06
```

## Ejecucion local

Ejecutar todo el paquete:

```powershell
.\backfill-postventa-20260801\run-local.ps1
```

Ejecutar un script puntual:

```powershell
.\backfill-postventa-20260801\run-local.ps1 -Only 08
```

Ejecutar desde un script especifico:

```powershell
.\backfill-postventa-20260801\run-local.ps1 -From 05
```

Por defecto usa el contenedor local `albrugroup-postgres-lead-1`, usuario `postgres` y base `lead_db`.

Si el contenedor, usuario o base son distintos:

```powershell
.\backfill-postventa-20260801\run-local.ps1 -Container albrugroup-postgres-lead-1 -User postgres -Database lead_db
```

## Ejecucion individual segura

No ejecutar estos archivos con `Get-Content ... | docker exec -i psql`, porque PowerShell puede degradar UTF-8 y convertir tildes en `??`.

Para ejecutar un script individual, copiarlo al contenedor y luego usar `psql -f`:

```powershell
docker cp .\backfill-postventa-20260801\01_registrar_19_faltantes_postventa.sql albrugroup-postgres-lead-1:/tmp/01_registrar_19_faltantes_postventa.sql
docker exec albrugroup-postgres-lead-1 psql -U postgres -d lead_db -v ON_ERROR_STOP=1 -f /tmp/01_registrar_19_faltantes_postventa.sql
```

## Reglas importantes

- No revertir leads `SUSPENDIDO` a `ACTIVO` solo porque el Excel actualizado figure como `ACTIVO`.
- Los pagos nuevos del Excel actualizado si deben cerrar sus periodos correspondientes.
- No incluir Julio 2 hasta validar organicamente por que esos leads no llegaron al sistema o a POSTVENTA.
- El script 8 valida que todos los leads del Excel queden cubiertos por corte: Abril 2 = 65, Mayo 1 = 163, Mayo 2 = 68, Junio 1 = 223, Junio 2 = 65 y Julio 1 = 126.
- Los conteos vivos del sistema pueden ser mayores al Excel si existen leads nativos que no pasaron por la gestion manual del archivo.
- Solo Abril 2 y Mayo 1 pueden pasar a COBRANZA al cerrar su tercer periodo. Los demas cortes permanecen en POSTVENTA aunque tengan pagos registrados, porque aun tienen periodos pendientes dentro de permanencia.
- En bandeja POSTVENTA, Abril 2 y Mayo 1 pueden mostrar menos leads que el Excel si una parte ya paso a COBRANZA. Para los demas cortes, el sistema deberia mostrar una cantidad igual o mayor al Excel, salvo filtros propios de la vista.
- Si un script falla, detener la ejecucion y revisar antes de continuar.
