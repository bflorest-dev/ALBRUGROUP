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

### 0a. Entidad JPA + tabla

```
lead_seguimiento
├── id (BIGSERIAL PK)
├── id_lead (BIGINT FK → lead, UNIQUE)
│
│  ── PREVENTA ──
├── fecha_agendamiento_preventa (TIMESTAMPTZ)
├── fecha_conversion_preventa (TIMESTAMPTZ)
│
│  ── VENTA ──
├── fecha_ingreso_venta (TIMESTAMPTZ)
├── fecha_grabacion (TIMESTAMPTZ)
├── fecha_programacion (DATE)
├── hora_programada (VARCHAR)
├── fecha_rechazo (DATE)
├── fecha_instalacion (DATE)
│
│  ── POSTVENTA ──
├── fecha_agendamiento_postventa (TIMESTAMPTZ)
├── fecha_suspension (DATE)
├── fecha_baja (DATE)
│
├── updated_at (TIMESTAMPTZ)
```

> Las columnas crecerán conforme se identifiquen nuevas fechas de negocio. Postgres
> no penaliza columnas NULL (bitmap de nulls).

### 0b. Migración Flyway: poblar desde Eventos existentes

```sql
-- V65: Crear tabla + poblar con datos históricos
INSERT INTO lead_seguimiento (id_lead, fecha_programacion, hora_programada, ...)
SELECT l.id,
       (SELECT e.fecha_programacion FROM evento e WHERE e.id_lead = l.id
        AND e.accion = 'TIPIFICACION' AND e.etapa = 'VENTA'
        AND e.fecha_programacion IS NOT NULL ORDER BY e.id DESC LIMIT 1),
       ...
FROM lead l;
```

### 0c. Escritura dual: Evento + LeadSeguimiento

Actualizar el flujo de tipificación para que, al aplicar una tipificación con comportamiento
REQUIERE_FECHA_PROGRAMACION/RECHAZO/INSTALACION, además de escribir en Evento, escriba
(upsert) en LeadSeguimiento. Esto es transitorio — eventualmente Evento dejará de guardar
estas fechas.

**Archivos a tocar:**
- `entity/LeadSeguimiento.java` (nueva)
- `repository/LeadSeguimientoRepository.java` (nuevo)
- `service/LeadService.java` → método de tipificación (escritura dual)
- `resources/db/migration/V65__create_lead_seguimiento.sql`

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

| Paso | Fase | Riesgo | Bloquea a |
|------|------|--------|-----------|
| 1 | 0a-0b | Medio | Fase 1 (query necesita LeadSeguimiento) |
| 2 | 0c | Bajo | — (escritura dual, sin romper nada) |
| 3 | 1a-1c | Alto | Fase 3, 4, 5 (toda la bandeja depende de la query) |
| 4 | 2a | Bajo | Fase 3a (la bandeja consume tree-select) |
| 5 | 2b-2c | Medio | — |
| 6 | 3a | Medio | — (endpoints geo nuevos) |
| 7 | 3b-3c | Bajo | — |
| 8 | 4a-4b | Bajo | — |
| 9 | 5a-5c | Bajo | — |
| 10 | 6 | Bajo | — (limpieza final) |

---

## Preguntas abiertas

1. **LeadSeguimiento — fechas adicionales por definir**: ¿hay más fechas de POSTVENTA o futuras
   etapas que debamos considerar desde ya para el schema?
2. **Proveedor en tree select**: ¿mostrar todas las matrices de proveedor o solo la del proveedor
   seleccionado en el filtro? (Recomiendo: solo la del proveedor filtrado, o todas si no hay filtro.)
3. **Replicar a otras etapas**: una vez validada en VENTA, ¿la bandeja de PREVENTA y POSTVENTA
   usarían exactamente el mismo componente con diferente `etapaBandeja`?
