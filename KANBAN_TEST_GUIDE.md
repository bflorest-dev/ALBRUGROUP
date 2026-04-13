# Guía de Test del Kanban de Reclutamiento

## Checklist de Verificación Rápida

### ✅ Antes de Iniciar
```bash
# 1. Verificar que no hay errores de compilación
npx tsc --noEmit

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir navegador a http://localhost:5173
```

### ✅ Test 1: Vista Kanban Carga
**Pasos:**
1. Navegar a `/reclutamiento` en la app
2. En la esquina superior derecha, ver botón que dice "Ver tabla"
3. Header debe mostrar: "Bandeja de Reclutamiento" + subtítulo sobre Kanban

**Resultado esperado:**
- ✅ Sin errores en consola
- ✅ Tarjetas visibles agrupadas por columnas
- ✅ Cada columna tiene un header con nombre de tipificación + contador

### ✅ Test 2: Columnas Se Cargan Correctamente
**Pasos:**
1. Observar las columnas del Kanban
2. Contar número de columnas = número de tipificaciones activas

**Resultado esperado:**
- ✅ Al menos 3-5 columnas visibles
- ✅ Cada columna tiene texto del tipo: "Nombre Tipificación (N postulaciones)"
- ✅ Las columnas están ordenadas (por campo `orden` de la tipificación)

### ✅ Test 3: Tarjetas Se Muestran
**Pasos:**
1. Buscar tarjetas dentro de las columnas
2. Hacer hover sobre una tarjeta

**Elemento esperado en cada tarjeta:**
- Nombre del postulante
- Documento (tipo + número)
- Teléfono (icono + número)
- Código de oferta (icono)
- Badge de origen (si aplica)
- Botones: "Tipificar" (azul) + "Detalles"

### ✅ Test 4: Drag & Drop Básico
**Pasos:**
1. Localizar una tarjeta en una columna
2. Click + hold a la tarjeta (sin soltar)
3. Observar feedback visual (debe oscurecerse = isDragging)
4. Mover cursora otra columna sin soltar
5. Soltar sobre la otra columna

**Resultado esperado:**
- ✅ Durante drag: tarjeta se oscurece (opacity: 0.5)
- ✅ Cursora cambia a "grabbing"
- ✅ POST se realiza (ver pestaña Network en DevTools)
- ✅ Tarjeta se reposiciona o desaparece/reaparece en nueva columna

### ✅ Test 5: Network Request
**Pasos:**
1. Abrir DevTools → Pestaña Network
2. Arrastrar una tarjeta entre columnas
3. Buscar request POST

**Request esperado:**
```
POST /postulaciones/{id}/tipificacion
Headers:
  Content-Type: application/json
  Authorization: Bearer {token}

Body:
{
  "idTipificacion": 123,
  "idSubtipificacion": 456,
  "modalidadContacto": "NO_ESPECIFICADA",
  "observacion": "Movido en kanban"
}

Response: 200 OK
```

### ✅ Test 6: Refetch Automático
**Pasos:**
1. Arrastrar tarjeta a nuevo estado
2. Esperar a que se complete el POST
3. Observar que la data se actualiza

**Resultado esperado:**
- ✅ Tarjeta permanece en su nueva columna después del POST
- ✅ Los contadores de postulación por columna se actualizan
- ✅ Sin mensajes de error en consola

### ✅ Test 7: Botón Tipificar
**Pasos:**
1. Click en botón "Tipificar" en una tarjeta
2. Modal debe aparecer

**Resultado esperado:**
- ✅ Modal abre con título "Tipificar Postulación"
- ✅ Se cargan los campos: Tipificación, Subtipificación, etc.
- ✅ Los campos opcionales (Modalidad, Observación) no tienen asterisco

### ✅ Test 8: Toggle Vista Tabla
**Pasos:**
1. Click en botón "Ver tabla" (arriba a la derecha)
2. Debe cambiar a vista tabla (o placeholder)
3. Click nuevamente "Ver Kanban" para volver

**Resultado esperado:**
- ✅ UI cambia entre Kanban y tabla sin errores
- ✅ Estados se preservan (postulaciones mantienen los mismos datos)

## Troubleshooting

### Problema: "No hay postulaciones" en todas las columnas
**Solución:**
1. Ir a `/gestion-leads` o `/preventa` y tipificar algunos candidatos a "RECLUTAMIENTO"
2. Volver a `/reclutamiento`
3. Refrescar página (F5)

### Problema: Columns no se actualizan tras drag
**Solución:**
1. Abrir DevTools → Network
2. Ver si POST fue 200 OK
3. Si fue 200: problema de refetch (revisar `onSuccess` callback)
4. Si fue error: revisar body del request en Network

### Problema: Errores de TypeScript en la consola
**Solución:**
```bash
# Limpiar e reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Problema: Componentes no se cargan / módulos no encontrados
**Mirar:**
1. Verificar que `@dnd-kit/*` está en `package.json`
   ```bash
   npm list @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```
2. Si falta algo: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

## Performance Checks

### Test de Carga Inicial
```
Métricas esperadas (DevTools → Performance):
- Time to Interactive (TTI): < 3s
- Largest Contentful Paint (LCP): < 2.5s
- Columns render: < 500ms
```

### Test de Drag Performance
```
Métricas esperadas:
- Frame rate durante drag: 60 FPS (suave)
- Lag = 0ms (sin stutter)
```

## Caso de Éxito Completo

✅ Aplicación inicia sin errores
✅ Página /reclutamiento carga Kanban
✅ Tarjetas se agrupan en columnas por estado
✅ Drag & drop funciona (tarjeta se mueve)
✅ POST se realiza correctamente
✅ Data se actualiza tras respuesta
✅ Toggle tabla/Kanban funciona
✅ Modal Tipificar abre correctamente
✅ Sin errores en consola del navegador

## Notas Importantes

- El Kanban es **drag BETWEEN columns** (no reorder dentro de columna)
- Cada DROP = 1 POST al endpoint
- El refetch es completo (no partial updates)
- Si el POST falla, la tarjeta NO se mueve (sin optimistic update)
- Los sensores usaron PointerSensor con threshold 8px (evita accidentes)

---

**Fecha de creación:** 2024-Mar-27
**Componentes:** KanbanBoard, KanbanColumn, KanbanCard, useKanbanLogic
**Dependencias:** @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
