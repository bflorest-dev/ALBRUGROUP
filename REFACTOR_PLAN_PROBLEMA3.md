# 📋 PLAN REFACTORIZACIÓN - PROBLEMA #3: Inline Functions to useCallback

**Fecha:** 14 Marzo 2026  
**Severidad:** 🔴 CRÍTICO  
**Status:** 📋 EN PLANIFICACIÓN  
**Esfuerzo Estimado:** 3 horas  

---

## 🎯 Problema Identificado

### Situación Actual

**ANTES (Problema #2 - ModalsSection):**
```typescript
// ModalsSection.tsx
export const ModalsSection: React.FC<ModalsSectionProps> = ({ state }) => {
  return (
    <>
      {/* onChange handlers INLINE */}
      <input 
        onChange={(e) => state.setEditMetricsData(prev => ({ 
          ...prev, 
          cantLeads: parseInt(e.target.value) || 0 
        }))}
      />
      
      <input 
        onChange={(e) => state.setEditMetricsData(prev => ({ 
          ...prev, 
          deltaLeads: parseInt(e.target.value) || 0 
        }))}
      />
      
      {/* onClick handlers INLINE */}
      <button 
        onClick={() => state.setIsEditingMetrics(false)}
      >
      
      {/* Similares para campaignEditData (10 campos) */}
    </>
  );
};
```

**Problema:**
```
❌ 15+ handlers inline (onChange + onClick)
❌ Cada render crea nuevas funciones anónimas
❌ Props drilling de state (ineficiente)
❌ Rompe React.memo (siempre nuevas referencias)
❌ Causa cascada de re-renders en inputs
❌ Difícil de mantener (lógica en JSX)
```

### Resultado de Problema

```
Arquitectura actual:
┌─────────────────────────────────────────┐
│ CommunityDashboard (composición)        │
├─────────────────────────────────────────┤
│ - Usa: useCommunityDashboard()          │
│ - Retorna: state (14 useState + 7 cb)   │
│ - Pasa: state → DashboardSection        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ DashboardSection (orquestador)          │
├─────────────────────────────────────────┤
│ - Recibe: state                         │
│ - Pasa: state → MetricsSection          │
│ - Pasa: state → LeadsManagementSection  │
│ - Pasa: state → CampaignsSection        │
└─────────────────────────────────────────┘
              ↓ (estado y setters dispersos)
┌─────────────────────────────────────────┐
│ MetricsSection                          │
│ LeadsManagementSection                  │
│ CampaignsSection                        │
│ ModalsSection                           │
├─────────────────────────────────────────┤
│ ❌ Renderizan con handlers inline       │
│ ❌ Crean nueva función cada render      │
│ ❌ Rompen React.memo/memoization        │
└─────────────────────────────────────────┘
```

---

## ✨ SOLUCIÓN: Mover Handlers a useCallback en Hook

### Paso 1️⃣: Extender useCommunityDashboard con useCallback Handlers

**Archivo:** `src/features/COMMUNITY/hooks/useCommunityDashboard.ts`

**Handlers a Agregar:**

1. **Handlers de Modal Edit Metrics**
```typescript
// Para editar META ADS/DRIVE cantLeads
const handleEditMetricsCantLeadsChange = useCallback(
  (value: string) => {
    setEditMetricsData(prev => ({
      ...prev,
      cantLeads: parseInt(value) || 0
    }));
  },
  []
);

// Para editar META ADS/DRIVE deltaLeads
const handleEditMetricsDeltaLeadsChange = useCallback(
  (value: string) => {
    setEditMetricsData(prev => ({
      ...prev,
      deltaLeads: parseInt(value) || 0
    }));
  },
  []
);
```

2. **Handlers de Modal Edit Campaign Metrics (10 campos)**
```typescript
const handleCampaignEditDataChange = useCallback(
  (field: keyof typeof campaignEditData, value: string | number) => {
    setCampaignEditData(prev => ({
      ...prev,
      [field]: typeof prev[field] === 'number' ? 
        (typeof value === 'string' ? parseInt(value) : value) : value
    }));
  },
  []
);

// Atajos para cada campo (para mayor claridad en JSX)
const handleSpentChange = useCallback(
  (value: string) => {
    setCampaignEditData(prev => ({
      ...prev,
      spent: parseInt(value) || 0
    }));
  },
  []
);

// ... similar para results, reach, impressions, frequency, clicks, clicsTotal, ventasCerradas, contacto
```

3. **Handlers de Modal Crear Campaña**
```typescript
const handleFormInputChange = useCallback(
  (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  },
  []
);
```

4. **Handlers de Click/Close**
```typescript
const handleCloseEditMetricsModal = useCallback(
  () => setIsEditingMetrics(false),
  []
);

const handleCloseEditCampaignMetricsModal = useCallback(
  () => {
    setIsEditingCampaignMetrics(false);
    setSelectedCampaignForEdit(null);
  },
  []
);

const handleToggleModalOpen = useCallback(
  () => setIsModalOpen(true),
  []
);

const handleToggleModalClose = useCallback(
  () => setIsModalOpen(false),
  []
);

const handleToggleExpandCampaign = useCallback(
  (campaignId: string) => {
    setExpandedCampaignId(prev => prev === campaignId ? null : campaignId);
  },
  []
);
```

5. **Handlers de Edit Métricas**
```typescript
const handleToggleEditMetricsOpen = useCallback(
  (type: 'META ADS' | 'DRIVE') => {
    state.handleOpenEditMetrics(type); // Delegamos al handler existente
  },
  [handleOpenEditMetrics]
);

const handleToggleEditCampaignMetricsOpen = useCallback(
  (campaign: Campaign) => {
    state.handleOpenEditCampaignMetrics(campaign); // Delegamos
  },
  [handleOpenEditCampaignMetrics]
);
```

---

### Paso 2️⃣: Actualizar ModalsSection para Usar Handlers

**ANTES:**
```typescript
<input 
  onChange={(e) => state.setEditMetricsData(prev => ({ 
    ...prev, 
    cantLeads: parseInt(e.target.value) || 0 
  }))}
/>
```

**DESPUÉS:**
```typescript
<input 
  onChange={(e) => state.handleEditMetricsCantLeadsChange(e.target.value)}
/>
```

---

### Paso 3️⃣: Actualizar MetricsSection para Usar Handlers

**ANTES:**
```typescript
<div 
  className="clickable" 
  onClick={() => state.handleOpenEditMetrics('META ADS')}
>
```

**DESPUÉS:**
```typescript
<div 
  className="clickable" 
  onClick={() => state.handleToggleEditMetricsOpen('META ADS')}
>
```

---

### Paso 4️⃣: Actualizar LeadsManagementSection para Usar Handlers

**ANTES:**
```typescript
<tr 
  onClick={() => state.setExpandedCampaignId(
    state.expandedCampaignId === campaign.id ? null : campaign.id
  )}
/>
```

**DESPUÉS:**
```typescript
<tr 
  onClick={() => state.handleToggleExpandCampaign(campaign.id)}
/>
```

---

### Paso 5️⃣: Actualizar DashboardSection para Usar Handlers

**ANTES:**
```typescript
<button 
  onClick={() => state.setIsModalOpen(true)}
/>
```

**DESPUÉS:**
```typescript
<button 
  onClick={state.handleToggleModalOpen}
/>
```

---

## 📊 Handlers a Crear vs Actuales

### Nuevos Handlers (useCallback)

```typescript
// En useCommunityDashboard.ts - NUEVOS
+  handleEditMetricsCantLeadsChange      (1 línea)
+  handleEditMetricsDeltaLeadsChange     (1 línea)
+  handleCampaignEditDataChange          (1 línea genérico)
+  handleSpentChange                     (1 línea)
+  handleResultsChange                   (1 línea)
+  handleReachChange                     (1 línea)
+  handleImpressionsChange               (1 línea)
+  handleFrequencyChange                 (1 línea)
+  handleClicksChange                    (1 línea)
+  handleClicsTotalChange                (1 línea)
+  handleVentasCerradasChange            (1 línea)
+  handleContactoChange                  (1 línea)
+  handleFormInputChange                 (1 línea genérico)
+  handleCloseEditMetricsModal           (1 línea)
+  handleCloseEditCampaignMetricsModal   (1 línea)
+  handleToggleModalOpen                 (1 línea)
+  handleToggleModalClose                (1 línea)
+  handleToggleExpandCampaign            (1 línea)
+  handleToggleEditMetricsOpen           (1 línea wrapper)
+  handleToggleEditCampaignMetricsOpen   (1 línea wrapper)

TOTAL NUEVOS: ~20 handlers con useCallback
```

### Handlers Existentes (Ya en Hook)

```typescript
// Existentes en useCommunityDashboard.ts - SIN CAMBIOS
✓ handleFormChange                  (existente, mejorar)
✓ handleOpenEditMetrics             (existente)
✓ handleSaveMetrics                 (existente)
✓ handleSaveCampaignMetrics         (existente)
✓ handleCreateCampaign              (existente)
✓ handleCloseCreateModal            (existente)
✓ handleOpenEditCampaignMetrics     (existente)
```

---

## 🔄 Flujo Mejorado

### ANTES (Problema)
```
User Input (onClick/onChange)
        ↓
ModalsSection (inline handler)
        ↓ (nueva función cada render)
setState en state local
        ↓
Re-render ModalsSection
```

### DESPUÉS (Solución)
```
User Input (onClick/onChange)
        ↓
ModalsSection (handler callback)
        ↓ (MISMA referencia siempre)
useCommunityDashboard (useCallback)
        ↓
setState en hook (centralizado)
        ↓
Re-render ModalsSection (SOLO si props cambian)
```

---

## ✅ Validación

### Ej 1: Input onChange

**ANTES:**
```typescript
<input 
  value={state.editMetricsData.cantLeads}
  onChange={(e) => state.setEditMetricsData(prev => {
    // Nueva función cada render ❌
    return { ...prev, cantLeads: parseInt(e.target.value) || 0 };
  })}
/>
```

**DESPUÉS:**
```typescript
<input 
  value={state.editMetricsData.cantLeads}
  onChange={(e) => state.handleEditMetricsCantLeadsChange(e.target.value)}
/>
// handleEditMetricsCantLeadsChange = useCallback(
//   (value: string) => {
//     setEditMetricsData(prev => ({
//       ...prev,
//       cantLeads: parseInt(value) || 0
//     }));
//   },
//   [] // Dependencias vacías = siempre misma referencia ✓
// );
```

**Beneficio:**
- ❌ Antes: Nueva función anónima 3000+ veces en sesión
- ✓ Después: Misma función ref siempre → React.memo puede optimizar

---

### Ej 2: Button onClick

**ANTES:**
```typescript
<button 
  onClick={() => state.setIsEditingMetrics(false)}
>
// Nueva función anónima cada render ❌
```

**DESPUÉS:**
```typescript
<button 
  onClick={state.handleCloseEditMetricsModal}
>
// handleCloseEditMetricsModal = useCallback(
//   () => setIsEditingMetrics(false),
//   []
// );
// Misma referencia siempre ✓
```

---

## 📊 ANTES vs DESPUÉS

### Complejidad

| Aspecto | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Handlers inline** | 15+ en ModalsSection | 0 (todos en hook) | -100% |
| **Nuevas funciones/render** | 15+ | 0 | -100% |
| **Props drilling** | ✓ state completo | ✓ callbacks específicos | ✅ |
| **Testabilidad** | Difícil (inline) | Fácil (callbacks testeable) | ✅ |

### Performance

| Métrica | Antes | Después |
|---------|-------|---------|
| Re-renders en input | 1 por keystroke | 1 por keystroke |
| Función refs iguales | ❌ Por keystroke crean nuevas | ✓ Siempre misma ref |
| React.memo efectivo | ❌ Rompe por props | ✓ Props estables |

---

## 📋 Checklist de Implementación

- [ ] Extender useCommunityDashboard.ts con ~20 handlers useCallback
- [ ] Actualizar ModalsSection para usar handlers (12 inputs, 4 buttons)
- [ ] Actualizar MetricsSection para usar handlers (2 onClick)
- [ ] Actualizar LeadsManagementSection para usar handlers (1 onClick)
- [ ] Actualizar DashboardSection para usar handlers (1 onClick)
- [ ] Validar que no haya errores TypeScript
- [ ] Probar en navegador (tipear en inputs, clickear botones)
- [ ] Validar con React DevTools Profiler

---

## ⏱️ Estimación de Esfuerzo

| Tarea | Tiempo |
|-------|--------|
| Crear 20 handlers useCallback en hook | 1.5h |
| Actualizar ModalsSection (inputs + buttons) | 0.75h |
| Actualizar MetricsSection | 0.25h |
| Actualizar LeadsManagementSection | 0.25h |
| Actualizar DashboardSection | 0.25h |
| Validar y testing | 0.5h |
| **TOTAL** | **3h** |

---

## ✨ Beneficios Logrados al Final

✅ **Sin Handlers Inline:** Todos los handlers en el hook
✅ **Referencias Estables:** useCallback garantiza misma referencia
✅ **Props Optimizadas:** Menos props drilling, más específicos
✅ **Testeable:** Handlers fáciles de testear
✅ **Performance:** Re-renders optimizados, React.memo efectivo
✅ **Mantenible:** Lógica centralizada en hook

---

## 👉 Próximos Pasos (Después del Problema #3)

**Problema #4:** Cálculos Complejos a useMemo  
- CPM, CPC, CTR calculados inline en CampaignsSection
- Mover a useMemo en hook (1400 recalcs → 1)
- Esfuerzo: 3h
