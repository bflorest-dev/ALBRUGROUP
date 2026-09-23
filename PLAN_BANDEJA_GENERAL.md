# Plan: Bandeja General — Solución integral

> Objetivo: dejar el tab "Bandeja General" de BACKOFFICE 100% operativo con una arquitectura
> que se replique a cualquier etapa. Cada fase es desplegable por separado.

---

## Estado actual (problemas detectados)

1. **Lógica dual Origen**: dos queries JPQL (Actual + PorEvento) seleccionadas por un toggle manual. No es intuitivo y no resuelve el caso de "encontrar un lead que ya salió de VENTA por su última tipi en VENTA".
2. **Fechas acopladas a Evento**: fechaProgramacion, fechaRechazo, fechaInstalacion viven en Evento. Para leerlas se hacen 4 subqueries correlacionados (SELECT MAX) que son costosos y frágiles.
3. **Tipificaciones mezclando proveedores**: el tree selector no separa por proveedor; un equipo ve tipis de matrices que no le corresponden.
4. **Tipificaciones históricas invisibles**: leads con tipis desactivadas solo aparecen sin filtro activo.
5. **Filtro geo inexistente**: las opciones DEPARTAMENTO/PROVINCIA/DISTRITO estaban como groupBy, pero no hay un filtro en cascada que permita acotar a una zona geográfica.
6. **Filtro por equipo (obsoleto)**: se está migrando a filtro por proveedor (Lead.proveedor ya existe).

---

## Decisiones de diseño acordadas

### LeadSeguimiento (entidad nueva)
- **Una fila por lead** (no por etapa). Los nombres de columna indican la etapa.
- Fechas son **producto del flujo de tipificaciones**: se setean cuando una subtipificación con cierto ComportamientoTipificacion se aplica.
- **Fechas automáticas** (el sistema las calcula): fechaIngresoVenta (timestamp al entrar a la etapa).
- **Fechas manuales** (el asesor las provee): fechaProgramacion, fechaRechazo, fechaInstalacion — requeridas por REQUIERE_FECHA_PROGRAMACION, REQUIERE_FECHA_RECHAZO, REQUIERE_FECHA_INSTALACION.
- **Descartamos** fechaPrimerRegistro / fechaUltimoRegistro — derivables de lead.createdAt y Evento.
- Los ComportamientoTipificacion actuales ya definen qué fecha se pide; la mecánica de escritura (que hoy escribe en Evento) se actualiza para escribir TAMBIÉN en LeadSeguimiento.

### Query unificada
- **INNER JOIN LeadEtapaResumen** como fuente de tipificación (no Lead.codigoTipificacion).
- **Sin filtro `l.etapa = :etapaVenta`** — el INNER JOIN al resumen acota. Leads vivos y en consulta coexisten.
- **Modo automático**: `CASE WHEN l.etapa = :etapaBandeja THEN VIVO ELSE CONSULTA END`.
- **JOIN LeadSeguimiento** para fechas operativas (reemplaza los 4 subqueries de Evento).
- **Filtro por proveedor** en lugar de equipo (`Lead.proveedor`).

### Tree Select reutilizable
- Componente standalone en `shared/components/tree-select/`.
- Input: nodos con hijos. Output: selecciones (padres completos y/o hijos individuales).
- Tipis separadas por proveedor. Sección "Históricas" opcional.

### Filtro vs Agrupamiento (separados)
- **Filtros** (WHERE): tipificación (tree select), geo en cascada, proveedor, período.
- **Agrupamiento** (ORDER BY + headers): Estado, Plan, Último gestor, Asesor preventa.
- No mezclar — geo y tipi son filtros, no agrupadores.

---

## Fase 0 — LeadSeguimiento (backend, migración)

> **Esta fase es el cimiento de todo el plan.** Si las fechas están mal, las métricas, los
> filtros y el ordenamiento de la bandeja nacen rotos. NO es un paso rápido — requiere
> investigación por campo, fallbacks con coherencia temporal, y verificación exhaustiva.

### 0a. Entidad JPA + tabla

```
lead_seguimiento
├── id (BIGSERIAL PK)
├── id_lead (BIGINT FK → lead, UNIQUE)
│
│  ── PREVENTA ──
├── fecha_agendamiento_preventa (TIMESTAMPTZ)  -- created_at del evento con APARECE_EN_AGENDADOS_GTR
│
│  ── VENTA ──
├── fecha_ingreso_venta (TIMESTAMPTZ)          -- cuando se usó tipi INGRESADO (NO cuando entró a la etapa)
├── fecha_grabacion (TIMESTAMPTZ)              -- created_at del evento con ES_GRABACION (nuevo comportamiento)
├── fecha_programacion (TIMESTAMPTZ)           -- fecha_programacion + hora_programada fusionados
├── fecha_rechazo (DATE)                       -- evento con REQUIERE_FECHA_RECHAZO
├── fecha_instalacion (DATE)                   -- evento con REQUIERE_FECHA_INSTALACION
│
│  ── POSTVENTA ──
├── fecha_ingreso_postventa (TIMESTAMPTZ)      -- fecha_ingreso_etapa del resumen POSTVENTA
├── fecha_suspension (DATE)
├── fecha_baja (DATE)
│
├── updated_at (TIMESTAMPTZ)
```

Cambios vs. versión original:
- `fecha_conversion_preventa` ELIMINADA (redundante)
- `fecha_programacion` (DATE) + `hora_programada` (VARCHAR) → un solo `TIMESTAMPTZ`
  (hora_programada es `LocalTime` en Java / `time` en BD, NO un rango de texto)
- `fecha_agendamiento_postventa` → `fecha_ingreso_postventa` (más claro)

> Postgres no penaliza columnas NULL (bitmap de nulls). Columnas nuevas se agregan
> conforme se identifiquen fechas de negocio adicionales.

### 0b. Nuevo comportamiento: ES_GRABACION

Agregar `ES_GRABACION` a `ComportamientoTipificacion` y marcarlo en la matriz:
- WIN: subtipis de tipi GRABADO
- CLARO: subtipi "CON SEC - GRABADO" bajo SIN INGRESAR
- MIFIBRA/PERUFIBRA: subtipi "GRABADO" bajo SIN INGRESAR

La migración Flyway crea el valor del enum y actualiza `subtipificacion_comportamiento`.
Esto estandariza el concepto — el dual-write y futuras matrices usan el comportamiento
en vez de códigos hardcodeados que varían por proveedor.

Para `fecha_ingreso_venta` (tipi INGRESADO): como es un concepto a nivel de TIPI (no subtipi)
y los comportamientos viven en subtipis, el dual-write usa el código de tipi directamente.
Si algún día renombran INGRESADO, será el momento de crear `ES_INGRESO_VENTA`.

### 0c. Migración Flyway: poblar desde Eventos existentes

**Principio rector: fechas manuales > fechas automáticas.**

Las fechas manuales (fecha_programacion, fecha_rechazo, fecha_instalacion) son la verdad
del negocio. Las automáticas (created_at de eventos) reflejan cuándo se subió al sistema,
que puede ser muy posterior al hecho real. Un lead ingresado manualmente la semana pasada
pero instalado hace 2 meses tendría fecha_ingreso > fecha_instalacion — incoherente.

#### Datos reales investigados (base local, copia de prod):

| Dato | Cobertura |
|------|-----------|
| Leads con resumen VENTA | 5811 |
| Leads con evento INGRESADO en VENTA | 893 (15%) |
| Leads INSTALADOS sin haber pasado por PROGRAMADO | 3523 (80%) |
| Leads con resumen VENTA pero sin ningún evento de tipi | 167 |
| `fecha_ingreso_etapa` poblado en resumen VENTA | 5811/5811 (100%) |

#### Cadena de fallback por campo:

**`fecha_ingreso_venta`** (= timestamp de cuando se usó tipi INGRESADO)
1. `created_at` del ÚLTIMO evento con `tipificacion = 'INGRESADO'` en VENTA
2. **MIN(fechas manuales)** del lead en VENTA: `MIN(fecha_programacion, fecha_rechazo, fecha_instalacion)`
3. `created_at` del PRIMER evento con cualquier tipi en VENTA
4. `fecha_ingreso_etapa` del `lead_etapa_resumen` VENTA (último recurso, 167 leads)

**`fecha_grabacion`** (hardcodeado por proveedor en migración, por comportamiento en dual-write)
1. WIN: `created_at` del evento con `tipificacion = 'GRABADO'` en VENTA
2. CLARO: `created_at` del evento con `subtipificacion = 'CON SEC - GRABADO'` en VENTA
3. MIFIBRA/PERUFIBRA: `created_at` del evento con `subtipificacion = 'GRABADO'` en VENTA
4. Si no existe: NULL (legítimamente opcional; 589 leads totales lo tienen)

**`fecha_programacion`** (fusión fecha + hora → TIMESTAMPTZ)
1. `fecha_programacion + hora_programada` del ÚLTIMO evento con `REQUIERE_FECHA_PROGRAMACION`
2. Si solo tiene fecha sin hora: `fecha_programacion` a medianoche
3. Si nunca fue programado: NULL (legítimo — 80% de INSTALADOS históricos)

**`fecha_rechazo`**
1. `fecha_rechazo` del ÚLTIMO evento con `REQUIERE_FECHA_RECHAZO` en VENTA
2. NULL si nunca fue rechazado

**`fecha_instalacion`**
1. `fecha_instalacion` del ÚLTIMO evento con `REQUIERE_FECHA_INSTALACION` en VENTA
2. NULL si no está instalado

**`fecha_agendamiento_preventa`**
1. `created_at` del ÚLTIMO evento con subtipi que tiene `APARECE_EN_AGENDADOS_GTR` en PREVENTA
2. NULL si nunca fue agendado

**`fecha_ingreso_postventa`**
1. `fecha_ingreso_etapa` del `lead_etapa_resumen` POSTVENTA
2. NULL si nunca llegó a POSTVENTA

#### Paso de coherencia temporal (post-INSERT):

Invariante: `ingreso_venta ≤ grabación ≤ programación ≤ instalación`

```sql
-- Capear fechas automáticas que excedan a manuales posteriores
UPDATE lead_seguimiento seg SET
  fecha_ingreso_venta = LEAST(
    seg.fecha_ingreso_venta,
    COALESCE(seg.fecha_grabacion, seg.fecha_ingreso_venta),
    COALESCE(seg.fecha_programacion, seg.fecha_ingreso_venta),
    COALESCE(seg.fecha_instalacion::timestamptz, seg.fecha_ingreso_venta)
  ),
  fecha_grabacion = CASE
    WHEN seg.fecha_grabacion IS NOT NULL
     AND seg.fecha_grabacion > LEAST(
           COALESCE(seg.fecha_programacion, seg.fecha_grabacion),
           COALESCE(seg.fecha_instalacion::timestamptz, seg.fecha_grabacion))
    THEN LEAST(
           COALESCE(seg.fecha_programacion, seg.fecha_instalacion::timestamptz))
    ELSE seg.fecha_grabacion END
WHERE seg.fecha_ingreso_venta IS NOT NULL;
```

#### Verificación post-migración (obligatoria):

```sql
-- NO debe devolver filas si la coherencia es correcta
SELECT id_lead FROM lead_seguimiento
WHERE fecha_ingreso_venta > COALESCE(fecha_grabacion, fecha_ingreso_venta)
   OR fecha_ingreso_venta > COALESCE(fecha_programacion, fecha_ingreso_venta)
   OR fecha_ingreso_venta > COALESCE(fecha_instalacion::timestamptz, fecha_ingreso_venta)
   OR fecha_grabacion > COALESCE(fecha_programacion, fecha_grabacion)
   OR fecha_grabacion > COALESCE(fecha_instalacion::timestamptz, fecha_grabacion)
   OR fecha_programacion > COALESCE(fecha_instalacion::timestamptz, fecha_programacion);
```

### 0d. Escritura dual: Evento + LeadSeguimiento

Actualizar el flujo de tipificación para que, al aplicar una tipificación:
- Con `REQUIERE_FECHA_PROGRAMACION`: escribir `fecha_programacion` (fusionando fecha+hora) en LeadSeguimiento
- Con `REQUIERE_FECHA_RECHAZO`: escribir `fecha_rechazo` en LeadSeguimiento
- Con `REQUIERE_FECHA_INSTALACION`: escribir `fecha_instalacion` en LeadSeguimiento
- Con `ES_GRABACION` (nuevo): escribir `fecha_grabacion = now()` en LeadSeguimiento
- Con tipi = `INGRESADO`: escribir `fecha_ingreso_venta = now()` en LeadSeguimiento

Además de escribir en Evento (transitorio — eventualmente Evento dejará de guardar estas fechas).

**Archivos a tocar:**
- `entity/LeadSeguimiento.java` (nueva)
- `repository/LeadSeguimientoRepository.java` (nuevo)
- `entity/enums/ComportamientoTipificacion.java` (agregar `ES_GRABACION`)
- `service/LeadService.java` → método de tipificación (escritura dual)
- `resources/db/migration/V__create_lead_seguimiento.sql` (crear tabla + backfill + coherencia)
- `resources/db/migration/V__add_es_grabacion_comportamiento.sql` (nuevo comportamiento + marcar en matriz)

---

## Fase 1 — Query unificada (backend)

### 1a. Nueva query JPQL

Reemplaza `listarBandejaVentaNormalizadaActual` y `listarBandejaVentaNormalizadaPorEvento`
con una sola query:

```sql
FROM Lead l
JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapaBandeja
LEFT JOIN LeadSeguimiento seg ON seg.idLead = l.id
LEFT JOIN l.datosPreventa dp
LEFT JOIN l.direccion dir
LEFT JOIN l.plan pl
LEFT JOIN pl.proveedor pp
LEFT JOIN l.campana c
LEFT JOIN c.proveedor cp
-- Tipificación DESDE RESUMEN
LEFT JOIN Tipificacion tAct
    ON tAct.codigo = r.ultimaCodigoTipificacion
   AND tAct.matriz.etapa = :etapaBandeja
   AND tAct.matriz.proveedor.id = COALESCE(pp.id, l.proveedor.id, cp.id)
LEFT JOIN Subtipificacion sAct
    ON sAct.tipificacion = tAct
   AND sAct.codigo = r.ultimaCodigoSubtipificacion
-- Geo
LEFT JOIN Distrito dist ON dist.codigo = dir.ubigeoDomicilio
LEFT JOIN dist.provincia prov
LEFT JOIN dist.departamento dept
-- Preventa resumen (para asesor mérito preventa)
LEFT JOIN LeadEtapaResumen rp ON rp.idLead = l.id AND rp.etapa = :etapaPreventa
WHERE
    (:searchPattern = '%' OR ...)
    AND (:filtrarTipificaciones = false
         OR r.ultimaCodigoTipificacion IN :codigosTipificacion)
    AND (:filtrarSubtipificaciones = false
         OR r.ultimaCodigoSubtipificacion IN :codigosSubtipificacion ...)
    AND (condiciones de fecha usando seg.* en vez de subqueries de Evento)
    AND (:filtrarProveedores = false OR l.proveedor.id IN :proveedorIds)
    -- Geo filter (opcional)
    AND (:filtrarDepartamento = false OR dept.codigo = :codigoDepartamento)
    AND (:filtrarProvincia = false OR prov.codigo = :codigoProvincia)
    AND (:filtrarDistrito = false OR dist.codigo = :codigoDistrito)
```

### 1b. Ajustar DTO (LeadBandejaVentaResponse)

- Quitar `eventoId` del constructor (ya no se basa en evento)
- `origenFila` se computa en la query (`CASE WHEN l.etapa = :etapaBandeja ...`)
- Fechas vienen de `seg.*` en vez de `e.*` / subqueries

### 1c. Ajustar LeadService

- Eliminar la bifurcación Actual/PorEvento
- Un solo método que invoca la query unificada
- Eliminar parámetro `origenFila` del request — ya no existe
- Filtro por proveedor en vez de equipo

**Archivos a tocar:**
- `repository/LeadRepository.java` (reescribir queries)
- `entity/response/LeadBandejaVentaResponse.java` (ajustar constructor)
- `service/LeadService.java` (simplificar)
- `controller/BackofficeController.java` (si el endpoint cambia firma)

---

## Fase 2 — Tree Select reutilizable (frontend)

### 2a. Extraer componente

Mover la lógica del tree selector de `backoffice-general-board-page` a:
```
shared/components/tree-select/
├── tree-select.component.ts
├── tree-select.component.html
└── tree-select.component.scss
```

**API del componente:**
```typescript
// Inputs
nodes: Signal<TreeNode[]>      // nodos con hijos
searchable: boolean             // mostrar buscador
placeholder: string             // texto del botón

// Outputs
selectionChange: { parents: string[], children: string[] }
```

### 2b. Tipificaciones por proveedor

El catálogo de tipis se carga separado por proveedor. Si la bandeja muestra leads de
múltiples proveedores, el tree selector agrupa: "Proveedor A > tipis..." / "Proveedor B > tipis...".

### 2c. Tipificaciones históricas

Nuevo endpoint (o extensión del existente) que devuelve códigos de tipificación que existen
en `LeadEtapaResumen` para la etapa pero NO están en la matriz activa. Se muestran al final
del tree con un marcador visual "Inactiva" y solo cuando el usuario activa un toggle
"Mostrar históricas".

**Archivos a tocar:**
- `shared/components/tree-select/` (nuevo componente)
- `backoffice-general-board-page.component.*` (consume el nuevo componente)
- Backend: endpoint de tipis históricas (LeadEtapaResumenRepository query DISTINCT)

---

## Fase 3 — Filtros de la bandeja (frontend + backend)

### 3a. Filtro geo en cascada

Tres `p-select` encadenados en la barra de filtros:
- Departamento → carga provincias del depto seleccionado
- Provincia → carga distritos de la provincia seleccionada
- Distrito (final)

Requiere endpoint backend (o pueden reutilizarse datos de ubigeo existentes):
- `GET /ubigeo/departamentos`
- `GET /ubigeo/departamentos/{codigo}/provincias`
- `GET /ubigeo/provincias/{codigo}/distritos`

La query unificada ya tiene los JOINs de geo; los filtros WHERE
se activan con los parámetros `codigoDepartamento`, `codigoProvincia`, `codigoDistrito`.

### 3b. Filtro por proveedor

`p-select` (o `p-multiSelect`) de proveedores en la barra de filtros.
Reemplaza al antiguo filtro de equipos. Backend ya soporta `Lead.proveedor`.

### 3c. Barra de filtros completa

Layout de la barra: `[ Buscar | Proveedor | Tipificación ▼ | Departamento | Provincia | Distrito ]`

Con rail de selección debajo mostrando filtros activos como chips removibles.

---

## Fase 4 — ORGANIZAR (frontend)

### 4a. Controles del popover

1. **Usar fecha de** (campoFecha): Ingreso | Programación | Rechazo | Instalación | Última gestión
2. **Agrupar por**: Sin agrupar | Estado | Plan | Último gestor | Asesor preventa
3. **Ordenar por**: Fecha ingreso | Fecha relevante | Última gestión | Lead | Estado
4. **Mostrar primero**: Labels dinámicos (Más recientes/antiguos para fechas, A-Z/Z-A para texto)
5. **Limpiar**: resetea todo a defaults

> Tipificación y geo FUERA de agrupar — son filtros (Fase 3).

### 4b. Sort 3-click en cabeceras

Clic 1: activar sort con dirección default → Clic 2: invertir → Clic 3: reset a default
(fechaIngresoEtapa DESC). Columnas sorteables: Lead, Estado, Tipificación, Fecha, Gestión.

---

## Fase 5 — Visual y UX (frontend)

### 5a. Tag VIVO / CONSULTA

Chip sutil en esquina superior izquierda de cada fila:
- VIVO: sin chip (default, limpio)
- CONSULTA: chip tenue "En POSTVENTA" (o la etapa actual) que no estorbe

### 5b. Drawer en modo consulta

Cuando el lead está en CONSULTA, el drawer se abre sin opciones de gestión
(sin tipificar, sin asignar). Solo lectura + historial.

### 5c. Click en fila = gestionar

Sin botón GESTIONAR/CONSULTAR separado. Click en la fila abre el drawer.
El drawer detecta si es VIVO o CONSULTA y muestra los controles apropiados.

---

## Fase 6 — Limpieza

- Eliminar queries `listarBandejaVentaNormalizadaActual` y `listarBandejaVentaNormalizadaPorEvento`
- Eliminar enum `OrigenFilaBandejaVenta` (ya no se usa)
- Eliminar filtro de equipos del frontend
- Eliminar `MultiSelectModule` import (reemplazado por tree-select)
- Verificar que otras bandejas (Programados, Rechazados, Instalados) no rompan

---

## Orden de ejecución recomendado

| Paso | Fase | Peso | Bloquea a |
|------|------|------|-----------|
| 1 | 0a (schema) | Bajo | Todo lo demás |
| 2 | 0b (ES_GRABACION) | Bajo | 0c (migración necesita el comportamiento en la matriz) |
| 3 | **0c (migración backfill)** | **ALTO** | Fase 1 (query JOINea LeadSeguimiento) |
| 4 | 0d (dual-write) | Medio | — (sin romper nada, pero necesita la tabla de paso 1) |
| 5 | 1a-1c (query unificada) | Alto | Fase 3, 4, 5 |
| 6 | 2a (tree-select componente) | Bajo | Fase 3 (la bandeja lo consume) |
| 7 | 2b-2c (tipis por proveedor + históricas) | Medio | — |
| 8 | 3a (filtro geo cascada) | Medio | — |
| 9 | 3b-3c (filtro proveedor + barra) | Bajo | — |
| 10 | 4a-4b (ORGANIZAR + sort) | Bajo | — |
| 11 | 5a-5c (visual VIVO/CONSULTA) | Bajo | — |
| 12 | 6 (limpieza) | Bajo | — |

> **El paso 3 (migración backfill) es la pieza más crítica del plan.** Requiere investigar
> campo por campo las fuentes de datos reales, construir cadenas de fallback con coherencia
> temporal, y verificar exhaustivamente. No es un script INSERT trivial.

---

## Preguntas resueltas

1. **Proveedor en tree select**: solo tipis/subtipis ACTIVAS del proveedor del scope actual.
   Si el empleado cambia de proveedor, el tree select se limpia y recarga con la matriz del
   nuevo proveedor. Nunca mezclar tipis de proveedores distintos.
2. **Replicar a otras etapas**: no por ahora. Esta bandeja (VENTA) es la primera con esta
   lógica. La arquitectura lo permite pero la réplica se hará cuando se necesite.
