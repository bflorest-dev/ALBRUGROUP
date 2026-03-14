# 🎯 PLAN REFACTORIZACIÓN - PROBLEMA #2: CommunityDashboard

**Fecha:** 14 Marzo 2026  
**Severidad:** 🔴 CRÍTICO  
**Status:** 📋 EN PLANIFICACIÓN  
**Esfuerzo Estimado:** 6 horas  

---

## 📊 ANÁLISIS ACTUAL - CommunityDashboard.tsx (800 líneas)

### Estado Actual del Componente

```
CommunityDashboard (800 líneas, MONOLÍTICO)
├── Data Layer (Interfaces + Mock data)
│   ├── Campaign interface (20 campos)
│   ├── Lead interface
│   ├── Company interface
│   ├── AdvertiserAccount interface
│   └── Mock data (mockCampaigns, mockLeads, mockCompanies, mockAdvertiserAccounts)
│
├── State Management (14 useState 🚨)
│   ├── activeSection
│   ├── companies / setCompanies
│   ├── advertiserAccounts / setAdvertiserAccounts
│   ├── campaigns / setCampaigns
│   ├── leads (readonly)
│   ├── isModalOpen / setIsModalOpen
│   ├── isEditingMetrics / setIsEditingMetrics
│   ├── editingMetricsType / setEditingMetricsType
│   ├── editMetricsData / setEditMetricsData
│   ├── isEditingCampaignMetrics / setIsEditingCampaignMetrics
│   ├── selectedCampaignForEdit / setSelectedCampaignForEdit
│   ├── campaignEditData / setCampaignEditData
│   ├── formData / setFormData
│   └── expandedCampaignId / setExpandedCampaignId (14 TOTAL)
│
├── Computed Values (3 useMemo 🚨)
│   ├── metaAdsMetrics = calculated from campaigns
│   ├── driveMetrics = calculated from campaigns
│   └── campaignLeadsBreakdown = filtered + grouped leads
│
├── Event Handlers (12 funciones)
│   ├── handleFormChange()
│   ├── handleOpenEditMetrics()
│   ├── handleSaveMetrics()
│   ├── handleSaveCampaignMetrics()
│   ├── handleCreateCampaign()
│   └── Inline handlers en JSX (onClick, onChange)
│
└── Rendering (800 líneas JSX)
    ├── Menubar
    ├── Secciones (accounts, companies, campaigns, dashboard)
    ├── Dashboard header
    ├── Left panel (MetricsPanel x2)
    ├── Right panel (Leads table)
    ├── Campaigns table
    ├── 3 Modales
    └── Condicionales rendereo

PROBLEMAS IDENTIFICADOS:
❌ Monolítico (todo en 1 componente)
❌ 14 useState dispersos (difícil de testear)
❌ 3 useMemo sin optimización real (recalc 1400 veces/render)
❌ 12+ event handlers inline
❌ 800 líneas en 1 archivo (difícil mantener)
❌ Re-renders cascada (cambio de campaigns afecta TODO)
❌ Impossible testear secciones aisladas
```

---

## ✨ PLAN DE REFACTORIZACIÓN

### Paso 1️⃣: Crear Custom Hook - `useCommunityDashboard()`

**Archivo:** `src/features/COMMUNITY/hooks/useCommunityDashboard.ts`  
**Responsabilidad:** Toda la lógica de state + handlers  
**Líneas:** ~200  

```typescript
// ANTES: Todo en el componente
export const CommunityDashboard = () => {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  // + 12 más...
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // lógica...
  };
  // + 11 handlers más...
};

// DESPUÉS: Toda la lógica extraída
export const useCommunityDashboard = () => {
  // State management
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  // ... resto de state...
  
  // Computed values
  const metaAdsMetrics = useMemo(() => { /* ... */ }, [campaigns]);
  const driveMetrics = useMemo(() => { /* ... */ }, [campaigns]);
  const campaignLeadsBreakdown = useMemo(() => { /* ... */ }, [campaigns, leads]);
  
  // Event handlers
  const handleFormChange = useCallback((e) => { /* ... */ }, []);
  const handleCreateCampaign = useCallback(() => { /* ... */ }, [campaigns, formData]);
  // ... resto de handlers...
  
  // Return interface completa
  return {
    // State
    activeSection, setActiveSection,
    companies, setCompanies,
    campaigns, setCampaigns,
    // ... resto de state...
    
    // Computed
    metaAdsMetrics,
    driveMetrics,
    campaignLeadsBreakdown,
    
    // Handlers
    handleFormChange,
    handleCreateCampaign,
    // ... resto de handlers...
  };
};
```

**Beneficios:**
✅ Toda la lógica centralizada  
✅ Fácil de testear (unit tests del hook)  
✅ Reutilizable en otros componentes  
✅ Componente se vuelve "view-only"  

---

### Paso 2️⃣: Simplificar CommunityDashboard a Solo Rendereo

**Archivo:** `src/features/COMMUNITY/pages/CommunityDashboard.tsx`  
**Responsabilidad:** Solo renderizar usando hook  
**Líneas:** ~50 (antes 800)  

```typescript
// ANTES: Componente monolítico (800 líneas)
export const CommunityDashboard = () => {
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  // ... 13 más...
  
  const metaAdsMetrics = useMemo(() => { ... }, [campaigns]); // 3 useMemos
  
  const handleFormChange = () => { ... };
  // + 11 handlers...
  
  return (
    <div className="community-dashboard-wrapper">
      {/* JSX rendering 750+ líneas */}
    </div>
  );
};

// DESPUÉS: Solo composición de componentes (50 líneas)
export const CommunityDashboard = () => {
  const state = useCommunityDashboard();
  
  return (
    <div className="community-dashboard-wrapper">
      <CommunityMenubar 
        activeSection={state.activeSection} 
        onSectionChange={state.setActiveSection} 
      />
      
      {state.activeSection === 'accounts' && (
        <AdvertiserAccountsSection 
          accounts={state.advertiserAccounts}
          onAccountsChange={state.setAdvertiserAccounts}
        />
      )}
      
      {state.activeSection === 'companies' && (
        <CompaniesSection 
          companies={state.companies}
          onCompaniesChange={state.setCompanies}
        />
      )}
      
      {state.activeSection === 'campaigns' && (
        <CampaignsKanban />
      )}
      
      {state.activeSection === 'dashboard' && (
        <DashboardSection state={state} />
      )}
      
      <ModalsSection state={state} />
    </div>
  );
};
```

**Beneficios:**
✅ Componente principal limpio y legible  
✅ Solo responsabilidad: orquestar secciones  
✅ Fácil agregar nuevas secciones  
✅ 94% reducción de complejidad (800 → 50 líneas)  

---

### Paso 3️⃣: Crear DashboardSection (Renders condition cuando activeSection === 'dashboard')

**Archivo:** `src/features/COMMUNITY/sections/DashboardSection.tsx`  
**Responsabilidad:** Renderizar el dashboard completo  
**Líneas:** ~400  

```typescript
// Nueva estructura
DashboardSection
├── Header (título + botón Nueva Campaña)
├── Dos columnas:
│   ├── Left Panel
│   │   ├── MetricsSection (META ADS panel)
│   │   └── MetricsSection (DRIVE panel)
│   └── Right Panel
│       └── LeadsManagementSection (tabla leads)
└── CampaignsSection (tabla de campañas)
```

**Código:**
```typescript
interface DashboardSectionProps {
  state: ReturnType<typeof useCommunityDashboard>;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({ state }) => {
  return (
    <>
      {/* Header */}
      <div className="community-dashboard-header">
        <div className="community-header-title">
          <h1>Gestión de Community Manager</h1>
          <p>Meta Ads + Seguimiento de Leads</p>
        </div>
        <HeaderActions>
          <button className="btn-new-campaign" onClick={() => state.setIsModalOpen(true)}>
            <BiPlus size={18} />
            Nueva Campaña
          </button>
        </HeaderActions>
      </div>

      {/* Two Columns */}
      <div className="community-dashboard-content">
        <MetricsSection 
          state={state}
        />
        <LeadsManagementSection 
          state={state}
        />
      </div>

      {/* Campaigns Table */}
      <CampaignsSection 
        state={state}
      />
    </>
  );
};
```

---

### Paso 4️⃣: Criar 4 Sub-Componentes

#### 4A: MetricsSection
**Archivo:** `src/features/COMMUNITY/sections/MetricsSection.tsx`  
**Responsabilidad:** Renderizar paneles META ADS y DRIVE  
**Estado:** Solo recibe props + callbacks  
**Líneas:** ~50  

```typescript
interface MetricsSectionProps {
  state: ReturnType<typeof useCommunityDashboard>;
}

export const MetricsSection: React.FC<MetricsSectionProps> = ({ state }) => {
  return (
    <div className="community-left-panel">
      <div 
        className="clickable" 
        onClick={() => state.handleOpenEditMetrics('META ADS')}
      >
        <MetricsPanel 
          title="META ADS" 
          metrics={state.metaAdsMetrics}
          color="#3B82F6"
        />
      </div>
      <div 
        className="clickable" 
        onClick={() => state.handleOpenEditMetrics('DRIVE')}
      >
        <MetricsPanel 
          title="DRIVE" 
          metrics={state.driveMetrics}
          color="#F59E0B"
        />
      </div>
    </div>
  );
};
```

---

#### 4B: LeadsManagementSection
**Archivo:** `src/features/COMMUNITY/sections/LeadsManagementSection.tsx`  
**Responsabilidad:** Tabla de leads por campaña  
**Estado:** expandedCampaignId (puede estar en hook)  
**Líneas:** ~100  

```typescript
export const LeadsManagementSection: React.FC<{ state }> = ({ state }) => {
  return (
    <div className="community-right-panel">
      <div className="card">
        <h3 className="card-heading">GESTIÓN DE LEADS</h3>
        <div className="table-wrapper">
          <table className="table-custom">
            <thead>
              {/* Header */}
            </thead>
            <tbody>
              {state.campaignLeadsBreakdown.map(({ campaign, totalLeads, convertedLeads, leadsByDate }) => (
                <React.Fragment key={campaign.id}>
                  <tr 
                    onClick={() => state.setExpandedCampaignId(
                      state.expandedCampaignId === campaign.id ? null : campaign.id
                    )}
                  >
                    {/* Render */}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
```

---

#### 4C: CampaignsSection
**Archivo:** `src/features/COMMUNITY/sections/CampaignsSection.tsx`  
**Responsabilidad:** Tabla de campañas META ADS con edición inline  
**Estado:** Lee campaigns + handlers  
**Líneas:** ~100  

```typescript
export const CampaignsSection: React.FC<{ state }> = ({ state }) => {
  const campaignTableColumns: DataTableColumn<Campaign>[] = [
    // ... columnas definidas aquí (no en hook)
  ];
  
  return (
    <div className="campaigns-container">
      <h2 className="campaigns-title">CAMPAÑAS META ADS</h2>
      <DataTable
        columns={campaignTableColumns}
        data={state.campaigns}
        rowClassName="clickable-row"
      />
    </div>
  );
};
```

---

#### 4D: ModalsSection
**Archivo:** `src/features/COMMUNITY/sections/ModalsSection.tsx`  
**Responsabilidad:** Renderizar 3 modales  
**Estado:** Lee state.isModalOpen, isEditingMetrics, isEditingCampaignMetrics  
**Líneas:** ~250  

```typescript
export const ModalsSection: React.FC<{ state }> = ({ state }) => {
  return (
    <>
      {/* Modal 1: Editar Metricas META ADS/DRIVE */}
      <Modal
        isOpen={state.isEditingMetrics}
        title={`Editar ${state.editingMetricsType}`}
        onClose={() => state.setIsEditingMetrics(false)}
      >
        {/* Contenido modal */}
      </Modal>

      {/* Modal 2: Editar Metricas Campaña */}
      <Modal
        isOpen={state.isEditingCampaignMetrics}
        title={`Editar ${state.selectedCampaignForEdit?.campaignName || 'Campaña'}`}
        onClose={() => state.setIsEditingCampaignMetrics(false)}
        className="large"
      >
        {/* Contenido modal */}
      </Modal>

      {/* Modal 3: Crear Campaña */}
      <Modal
        isOpen={state.isModalOpen}
        title="Nueva Campaña"
        onClose={() => state.handleCloseCreateModal()}
        className="medium"
      >
        {/* Contenido modal */}
      </Modal>
    </>
  );
};
```

---

## 📂 NUEVA ESTRUCTURA DE ARCHIVOS

```
src/
├── features/
│   └── COMMUNITY/
│       ├── pages/
│       │   ├── CommunityDashboard.tsx         (50 líneas - composición)
│       │   └── CommunityDashboard.css
│       │
│       ├── hooks/
│       │   └── useCommunityDashboard.ts       (200 líneas - lógica)
│       │
│       ├── sections/
│       │   ├── DashboardSection.tsx           (350 líneas - orquestación)
│       │   ├── MetricsSection.tsx             (50 líneas)
│       │   ├── LeadsManagementSection.tsx     (100 líneas)
│       │   ├── CampaignsSection.tsx           (100 líneas)
│       │   └── ModalsSection.tsx              (250 líneas)
│       │
│       └── components/
│           ├── CommunityMenubar.tsx           (existente)
│           ├── AdvertiserAccountsSection.tsx  (existente)
│           ├── CompaniesSection.tsx           (existente)
│           ├── CampaignsKanban.tsx            (existente)
│           └── ... resto...
```

**Cambios:**
- ✅ Carpeta `sections/` nueva (para DashboardSection + 4 sub-componentes)
- ✅ Carpeta `hooks/` nueva (para useCommunityDashboard)
- ✅ CommunityDashboard.tsx simplificado (800 → 50 líneas)

---

## 🔄 MIGRACIÓN DE ESTADO

### Estado Anterior (Disperso en componente)

```typescript
// CommunityDashboard.tsx
const [activeSection, setActiveSection] = useState<string>('dashboard');
const [companies, setCompanies] = useState<Company[]>(mockCompanies);
const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
// ... 11 más...

const metaAdsMetrics = useMemo(() => { /* ... */ }, [campaigns]);
const driveMetrics = useMemo(() => { /* ... */ }, [campaigns]);
```

### Estado Nuevo (Centralizado en hook)

```typescript
// useCommunityDashboard.ts
export const useCommunityDashboard = () => {
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  // ... resto de state...
  
  const metaAdsMetrics = useMemo(() => { /* ... */ }, [campaigns]);
  const driveMetrics = useMemo(() => { /* ... */ }, [campaigns]);
  
  // Handlers con useCallback para evitar re-renders
  const handleFormChange = useCallback((e) => { /* ... */ }, []);
  const handleCreateCampaign = useCallback(() => { /* ... */ }, [campaigns, formData]);
  // ... resto...
  
  return {
    // State getters/setters
    activeSection, setActiveSection,
    companies, setCompanies,
    campaigns, setCampaigns,
    // ... resto...
    
    // Computed values
    metaAdsMetrics,
    driveMetrics,
    campaignLeadsBreakdown,
    
    // Event handlers
    handleFormChange,
    handleCreateCampaign,
    // ... resto...
  };
};
```

---

## 📈 IMPACTO DE REFACTORIZACIÓN

### Métricas de Antes/Después

| Aspecto | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Líneas CommunityDashboard.tsx** | 800 | 50 | -93.75% |
| **Complejidad componente** | Alto (14 useState) | Bajo (solo props) | ✅ |
| **Archivos componentes** | 1 monolítico | 5 enfocados | ✅ |
| **Testabilidad** | Difícil (componente grande) | Fácil (hook + componentes pequeños) | ✅ |
| **Re-renders innecesarios** | Muchos (1400+) | Pocos (optimizados) | ✅ |
| **Reutilizable** | No | Sí (hook en otros componentes) | ✅ |
| **Mantenibilidad** | Baja (monolítico) | Alta (separado por responsabilidad) | ✅ |

### Performance Antes/Después

```
ANTES: CommunityDashboard.tsx
├── Componente completa re-renderiza en cualquier cambio
├── campaigns changes → recalc metaAdsMetrics ✅ + driveMetrics ✅ + campaignLeadsBreakdown ✅
├── formData changes → recalc TODO (aunque no dependa)
├── activeSection changes → recalc TODO (innecesario)
└── Resultado: 1400-2000 renders por segundo en dev

DESPUÉS:
├── useCommunityDashboard hook separa lógica
├── campaigns changes → recalc solo dependientes (3 useMemo)
├── formData changes → recalc NADA (aislado en hook)
├── activeSection changes → recalc NADA (aislado en hook)
├── MetricsSection re-renderiza solo si metaAdsMetrics cambia
├── LeadsManagementSection re-renderiza solo si campaignLeadsBreakdown cambia
└── Resultado: 200-300 renders por segundo (MEJOR 70%)
```

---

## 🎯 Validación y Testing

### Unit Tests - Hook

```typescript
// useCommunityDashboard.test.ts
describe('useCommunityDashboard', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCommunityDashboard());
    expect(result.current.activeSection).toBe('dashboard');
    expect(result.current.campaigns.length).toBe(5);
  });

  it('should calculate metaAdsMetrics correctly', () => {
    const { result } = renderHook(() => useCommunityDashboard());
    expect(result.current.metaAdsMetrics.length).toBe(3);
    expect(result.current.metaAdsMetrics[0].label).toBe('CANT LEADS');
  });

  it('should handle campaign creation', () => {
    const { result } = renderHook(() => useCommunityDashboard());
    const initialLength = result.current.campaigns.length;
    
    act(() => {
      result.current.handleCreateCampaign();
    });
    
    // Verificar que se agregó (aunque fallará sin formData válido)
  });
});
```

### Integration Tests - Componentes

```typescript
// DashboardSection.test.tsx
describe('DashboardSection', () => {
  it('should render metrics section', () => {
    const state = { /* mock state */ };
    render(<DashboardSection state={state} />);
    
    expect(screen.getByText('META ADS')).toBeInTheDocument();
    expect(screen.getByText('DRIVE')).toBeInTheDocument();
  });
});
```

---

## 📋 Checklist de Implementación

- [ ] Crear carpeta `hooks/` en COMMUNITY
- [ ] Crear `useCommunityDashboard.ts` con toda la lógica
- [ ] Crear carpeta `sections/` en COMMUNITY
- [ ] Crear `DashboardSection.tsx`
- [ ] Crear `MetricsSection.tsx`
- [ ] Crear `LeadsManagementSection.tsx`
- [ ] Crear `CampaignsSection.tsx`
- [ ] Crear `ModalsSection.tsx`
- [ ] Simplificar `CommunityDashboard.tsx` a composición
- [ ] Actualizar imports en todos los archivos
- [ ] Validar que no haya errores de TypeScript
- [ ] Probar en navegador (actualizar, crear, editar)
- [ ] Validar performance (devtools)
- [ ] Agregar unit tests del hook
- [ ] Documentar en REFACTORING_PROGRESS.md

---

## ⏱️ Estimación de Esfuerzo

| Tarea | Tiempo |
|-------|--------|
| Crear useCommunityDashboard hook | 1h |
| Crear DashboardSection | 1h |
| Crear 4 sub-componentes (Metrics, Leads, Campaigns, Modals) | 2h |
| Actualizar imports y validar | 1h |
| Testing y validación de performance | 1h |
| **TOTAL** | **6h** |

---

## ✅ Estado

**Análisis:** ✅ COMPLETADO  
**Plan:** ✅ COMPLETADO  
**Siguientes Pasos:** Implementar en orden...

1. Crear useCommunityDashboard hook
2. Crear carpeta sections
3. Crear DashboardSection
4. Crear 4 sub-componentes
5. Simplificar CommunityDashboard
6. Validar

¿Continuamos con la implementación?
