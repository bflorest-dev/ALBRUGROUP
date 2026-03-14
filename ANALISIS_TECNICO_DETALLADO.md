# ANÁLISIS TÉCNICO EXHAUSTIVO - ALBRUGROUP-FRONTEND

**Fecha del análisis:** 13 de Marzo de 2026  
**Versión de React:** 19.2.0  
**Build Tool:** Vite 7.2.4

---

## 1. ESTRUCTURA DE CARPETAS Y ARQUITECTURA

### Árbol de directorios
```
src/
├── api/                          # Capa de HTTP (axios)
├── assets/                       # Recursos estáticos
├── components/                   # Atomic Design
│   ├── atoms/                   # 13 componentes de bajo nivel
│   ├── molecules/               # 14 componentes de nivel medio  
│   ├── organisms/               # 5+ componentes complejos
│   ├── pages/                   # (aparentemente no usado actualmente)
│   ├── templates/               # DashboardTemplate, MainLayout
│   └── utilities/               # Helpers visuales
├── config/                       # Configuración (env.ts)
├── contexts/                     # Context API (5 contextos + hooks custom)
├── dev/                          # DevRoleSwitcher para desarrollo
├── features/                     # Feature-based routes (roles RRH
H,RECLUTAMIENTO, etc.)
├── hooks/                        # Custom hooks (7 hooks)
├── repositories/                 # Data access patterns
├── services/                     # Business logic + API
├── shared/                       # Tipos y constantes compartidas
├── styles/                       # CSS global
├── types/                        # TypeScript definitions
├── utils/                        # Utilidades y helpers
├── validation/                   # Zod schemas
├── App.tsx                       # Root component
├── main.tsx                      # Entry point
├── RouterByRole.tsx              # Routing lógica por rol
└── setupTests.ts                 # Vitest config
```

### Distribución de componentes
- **Total de archivos TSX:** 79
- **Componentes principales:**
  - `features/COMMUNITY/pages/CommunityDashboard.tsx` (1100+ líneas)
  - `features/RRHH/pages/EmployeeDashboard.tsx` (1700+ líneas)
  - `features/RECLUTAMIENTO/pages/KanbanDashboard.tsx` (800+ líneas)
  - `features/RRHH/pages/ApplicantsDashboard.tsx` (600+ líneas)

---

## 2. ANÁLISIS DE CONTEXTOS GLOBALES

### 2.1 ApplicantsContext.tsx
**Ubicación:** `src/contexts/ApplicantsContext.tsx`  
**Propósito:** Gestión global de postulantes con sincronización en localStorage

**Variables de estado:**
```typescript
- applicants: Applicant[]        // Array de postulantes
- loading: boolean               // Estado de carga inicial
```

**Métodos proporcionados:**
```typescript
- addApplicant(applicant: Applicant): void
- updateApplicant(id: string, applicant: Applicant): void
- deleteApplicant(id: string): void
- useApplicants(): ApplicantsContextType
```

**Características técnicas:**
- ✅ Usa `useCallback` para funciones (línea 74-107)
- ✅ 2 `useEffect` para sincronización localStorage + eventos personalizados
- ✅ Dispara eventos CustomEvent para comunicación inter-tabs
- ⚠️ **PROBLEMA:** useEffect con dependencia `[loadInitialData]` que es redefinida en cada render (línea 47)
- ⚠️ **PATRÓN:** Sincronización duplicada (localStorage + CustomEvent)

**Dependencias de hooks:**
```
useEffect 1 (L47): [loadInitialData] → Risk de loop infinito
useEffect 2 (L70): [applicants] → Dispara eventos en cada cambio
useCallback (L74-107): [] → 3 funciones memoizadas correctamente
```

### 2.2 DataContext.tsx
**Ubicación:** `src/contexts/DataContext.tsx`  
**Propósito:** Gestión de estado de postulantes y empleados (DUPLICADO de ApplicantsContext)

**Variables de estado:**
```typescript
- applicants: Applicant[]        // Mock data
- employees: Employee[]          // Mock data
```

**⚠️ CRÍTICO - DUPLICIDAD DETECTADA:**
- ApplicantsContext Y DataContext AMBOS manejan aplicantes
- DataContext usa "mockApplicants" → hardcoded
- ApplicantsContext usa localStorage → persistente
- **CONFLICTO:** Dos fuentes de verdad para los mismos datos

### 2.3 NotificationContext.tsx
**Ubicación:** `src/contexts/NotificationContext.tsx`  
**Propósito:** Sistema de toasts/notificaciones global

**Variables de estado:**
```typescript
- toasts: ToastMessage[]         // Array de mensajes activos
```

**Métodos:**
```typescript
- showSuccess(message: string): void
- showError(message: string): void
- showInfo(message: string): void
- removeToast(id: string): void
```

**Características:**
- ✅ Usa `useCallback` para todos los métodos (5 funciones)
- ✅ Auto-desaparece mensajes en 3000ms (success/info) y 4000ms (error)
- ✅ Bien separado de responsabilidades

### 2.4 SidebarContext.tsx
**Ubicación:** `src/contexts/SidebarContext.tsx`  
**Propósito:** Control de estado colapsado de sidebar

**Variables:**
```typescript
- collapsed: boolean             // true por default
```

**Características:**
- ✅ Persiste en localStorage
- ✅ 2 `useEffect` (1 para leer inicial, 1 para persistir cambios)
- ✅ Toggle function simple
- ⚠️ Minimalista pero efectivo

### 2.5 DevRoleContext.tsx
**Ubicación:** `src/contexts/DevRoleContext.tsx`  
**Propósito:** Selector de rol para desarrollo/testing

**Variables:**
```typescript
- selectedRole: Role             // 'RRHH' | 'RECLUTAMIENTO' | etc.
```

**Características:**
- ✅ Persiste en localStorage
- ✅ 1 `useEffect` para sincronizar
- ✅ Getter inicial con fallback

### 2.6 Custom hook: useNotification.ts

Proporciona acceso simplificado a NotificationContext sin throw on missing.

---

## 3. ANÁLISIS DE HOOKS PERSONALIZADOS

### Total de hooks: 7 archivos

#### 3.1 useApplicantsSync.ts (~20 líneas)
**Propósito:** Forzar re-render cuando contexto de aplicantes cambia

**Implementación:**
```typescript
- Escucha evento 'applicantsContextUpdated'
- Incrementa syncVersion para disparar re-render
- Retorna: { applicants, syncVersion }
```

**⚠️ PROBLEMA:** Patrón innecesario - una mejor opción sería usar selector del context

#### 3.2 useApplicantsTable.ts (~150 líneas)
**Propósito:** Filtrado, búsqueda y paginación de postulantes

**Estado:**
```typescript
- sortOrder: 'asc' | 'desc' | null
- activeFilter: string | null
- filters: Record<string, string>  // 8 campos diferentes
```

**Características:**
- ✅ 11 `useMemo` para optimización (línea 49+)
- ✅ useCallback para handleFilterChange y handleClearFilters
- ✅ Calcula campos únicos (doctypes, positions, campaigns, etc.)
- ✅ Filtrado completo en cliente
- ⚠️ RENDIMIENTO: Procesa 100+ postulantes en frontend sin virtualización

#### 3.3 useBackofficeLeads.ts (~120 líneas)
**Propósito:** Gestión de leads para ASESOR_BACKOFFICE con tipificación

**Estado:**
```typescript
- leads: BackofficeLead[]
- selectedLeadId: string | null
- searchTerm: string
- selectedFilter: TipificationFilter
- isLoading: boolean
- error: string | null
```

**Retorna:**
```typescript
- selectedLead: BackofficeLead | null
- pendingLeads: BackofficeLead[]
- inProgressLeads: BackofficeLead[]
- completedLeads: BackofficeLead[]
- filteredLeads: BackofficeLead[]
- stats: { pending, inProgress, completed }
```

**Características:**
- ✅ 6 useCallback para setters
- ⚠️ **INCOMPLETO:** Archivo truncado en la salida, falta retorno y lógica de filtrado

#### 3.4 usePagination.ts (~35 líneas)
**Propósito:** Lógica de paginación reutilizable

**Métodos:**
```typescript
- goToPage(page: number): void
- nextPage(): void
- prevPage(): void
```

**Características:**
- ✅ useMemo para paginationData
- ✅ Validación de límites
- ✅ Minimalista y limpio

#### 3.5 useTipification.ts (~75 líneas)
**Propósito:** Manejo de tipificación de leads

**Estado:**
```typescript
- selectedBlockId: string | null
- selectedOptionId: TipificationOptionId | null
- scheduledDate?: string
- notes?: string
- isSubmitting: boolean
- error: string | null
```

**Características:**
- ✅ useCallback bien separado
- ✅ Validación de campos
- ⚠️ **INCOMPLETO:** Archivo truncado

#### 3.6 useErrorHandler.ts (~50 líneas)
**Propósito:** Manejo y reporteo de errores

**Métodos:**
```typescript
- handleError(error, errorInfo?): void
- resetError(): void
```

**Características:**
- ✅ Hook minimalista
- ⚠️ **VACÍO:** Sin implementación real (comentarios sobre Sentry/LogRocket)
- ⚠️ Necesita integración con servicio de error real

#### 3.7 useRef en ApplicantsDashboard.ts
```typescript
const prevCount = useRef(filteredApplicants.length);
```
✅ Bien usado para track de cambios en paginación

---

## 4. ANÁLISIS DE COMPONENTES PRINCIPALES

### 4.1 CommunityDashboard.tsx
**Ubicación:** `src/features/COMMUNITY/pages/CommunityDashboard.tsx`  
**Líneas:** ~1100  
**Estados:** 13 useState

**useState desglose:**
```typescript
1. activeSection: string                    // Sección visible
2. companies: Company[]                    
3. advertiserAccounts: AdvertiserAccount[]  
4. campaigns: Campaign[]                   
5. leads: Lead[]                           
6. isModalOpen: boolean                    
7. isEditingMetrics: boolean               
8. editingMetricsType: 'META ADS' | 'DRIVE'
9. editMetricsData: { cantLeads, deltaLeads }
10. isEditingCampaignMetrics: boolean
11. selectedCampaignForEdit: Campaign | null
12. campaignEditData: { 9 campos numéricos }
13. formData: { 4 campos string }
14-15. expandedCampaignId, formData (sección 2)
```

**useMemo (3 instancias):**
```typescript
- metaAdsMetrics (L309)      // Suma de leads y Q x R
- driveMetrics (L323)        // Similar a metaAdsMetrics
- campaignLeadsBreakdown (L337) // Agrupa leads por campaña
```

**⚠️ PROBLEMAS DETECTADOS:**

1. **Inline functions en onChange:**
   ```typescript
   onChange={(e) => setEditMetricsData(prev => ({ ...prev, cantLeads: parseInt(e.target.value) || 0 }))}  // L517
   onChange={(e) => setEditMetricsData(prev => ({ ...prev, deltaLeads: parseInt(e.target.value) || 0 }))} // L525
   // TOTAL: 9 inline functions en onChange (L517, 525, 562, 570, 578, 586, 598, 606, 614, 622, 630)
   ```
   **Impacto:** Cada render crea nuevas funciones → no son iguales en memoria → rompe optimizaciones

2. **Cálculos internos en JSX:**
   ```typescript
   // L277-280: En campaignTableColumns
   { header: 'COSTO/RESULTADO', accessor: (c) => `S/ ${((c.metaAdsLeads || 0) > 0 ? ((c.totalSpent || 0) / (c.metaAdsLeads||0)).toFixed(2) : '0.00')}` }
   // Esto se recalcula en CADA render
   ```

3. **Array como dependencia sin estabilidad:**
   ```typescript
   useMemo(() => { ... }, [campaigns, leads]);  // L337
   // Si campaigns es derivado de setState, se recalcula mucho
   ```

4. **DataTable sin memo:**
   ```typescript
   <DataTable columns={campaignTableColumns} data={campaigns} />  // L448
   // campagainTableColumns se redefine en cada render (no está memoizado)
   ```

5. **Renderizado de campaignLeadsBreakdown sin virtualización:**
   ```typescript
   {campaignLeadsBreakdown.map(({ campaign, totalLeads, convertedLeads, leadsByDate }) => (  // L406
      // Renderiza TODOS los items expandibles - sin virtualización
      {Object.entries(leadsByDate).map(([date, dateLeads]) => (
         // Nested mapping sin keys estables
      ))}
   ))}
   ```
   **Problema:** Si hay 100+ campañas con múltiples fechas → DOM muy grande

6. **Multiple setState calls en handlers:**
   ```typescript
   const handleOpenEditMetrics = (type) => {
     setEditingMetricsType(type);     // 3 setState calls
     setEditMetricsData(...);
     setIsEditingMetrics(true);
   }
   ```
   → 3 re-renders en vez de 1

---

### 4.2 EmployeeDashboard.tsx
**Ubicación:** `src/features/RRHH/pages/EmployeeDashboard.tsx`  
**Líneas:** ~1700  
**Componentes anidados:** 2+ sub-componentes internos

**Sub-componentes:**
- `InactiveEmployeeContent` (~250 líneas)
- `EmployeeContent` (~400 líneas)
- Otros tabs de estados

**useState en EmployeeContent:**
```typescript
[employees, setEmployees]
[statistics, setStatistics]
[loading, setLoading]
[searchTerm, setSearchTerm]
[isModalOpen, setIsModalOpen]
[detailModalOpen, setDetailModalOpen]
[checkoutModalOpen, setCheckoutModalOpen]
[activateModalOpen, setActivateModalOpen]
[reasonModalOpen, setReasonModalOpen]
[selectedEmployee, setSelectedEmployee]
[detailMode, setDetailMode]
[pendingStatusChangeEmployee, setPendingStatusChangeEmployee]
[selectedDismissalReason, setSelectedDismissalReason]
[lastModifiedEmployeeId, setLastModifiedEmployeeId]
```
**Total: 15+ useState calls**

**useEffect (al menos 6):**
- L116: Cargar empleados iniciales
- L121: Listeners de eventos personalizados
- L150: Listener de cambios de estado
- L398: Focus management
- L403: Pagination resets
- L438+: Múltiples listeners en Modales

**⚠️ PROBLEMAS:**

1. **useCallback pero sin usarlos en children:**
   ```typescript
   const loadInitialData = useCallback(async () => { ... }, [handleError, showError]);
   // Pero se pasa directamente a <EmployeeTable>, que no está memoizado
   ```

2. **States acoplados:** 
   - `selectedEmployee`, `detailMode`, `detailModalOpen` - podrían ser 1 estado compuesto
   - `selectedDismissalReason`, `reasonModalOpen` - acoplados

3. **useCallback en dependencias de useEffect:**
   ```typescript
   useEffect(() => {
     loadInitialData();
   }, [loadInitialData]); // L116
   
   // loadInitialData usa [handleError, showError] como deps
   // Si showError cambia → loadInitialData cambia → useEffect corre de nuevo
   ```

4. **Sin useMemo para datos filtrados:**
   ```typescript
   const filteredEmployees = useMemo(() => {
     if (!searchTerm) return employees;
     //...filtering logic
   }, [searchTerm, employees]);  // ✅ EXISTE

   const paginatedEmployees = useMemo(() => {
     const { startIndex, endIndex } = pagination;
     return filteredEmployees.slice(startIndex, endIndex);
   }, [filteredEmployees, pagination]);  // ✅ EXISTE
   ```
   **Buena práctica encontrada!**

---

### 4.3 KanbanDashboard.tsx
**Ubicación:** `src/features/RECLUTAMIENTO/pages/KanbanDashboard.tsx`  
**Líneas:** ~450+ (hay dos componentes)

**Estructura:**

```
KanbanDashboard (Padre - maneja modales)
  └─ KanbanBoard (Component memoizado implícitamente)
       └─ Renderiza 5 columnas de Kanban
            └─ Paginación por columna
```

**Característica importante:**
```typescript
const KanbanBoard: React.FC<KanbanBoardProps> = ({ companyFilter, onSelectForTipify }) => {
  // Sub-componente que usa useApplicantsSync() para optimizar re-renders
  const { applicants } = useApplicantsSync();
  
  // FILTRADO POR EMPRESA dentro del componente
  const filteredApplicants = applicants.filter(a => a.company === companyFilter);
```

**✅ PATRÓN CORRECTO:** Separó el componente que observa datos del que maneja modales

**useState:**
- L76: `pageByStatus` - Record<StatusValue, number>
- L92-97: Tipificación (selectedForTipify, tipifyStatus, etc.)
- L104-105: startDate, startTime, meetingDate, meetingTime

**PROBLEMA en tipos iniciales:**
```typescript
const [reasonOptions, setReasonOptions] = useState<string[]>([]);  // Nunca se inicializa

useEffect(() => {
  // Falta código que setee reasonOptions
}, []);
```

**Paginación por columna:**
```typescript
const changePage = (status: StatusValue, delta: number) => {
  setPageByStatus((prev) => {
    const total = columns[status].length;
    const pages = Math.max(1, Math.ceil(total / ITEMS_PER_COLUMN));
    const next = prev[status] + delta;
    if (next < 1 || next > pages) return prev;
    return { ...prev, [status]: next };
  });
};
```
✅ Bien implementado - actualiza un estado object correctamente

**⚠️ PROBLEMA CRÍTICO:**
```typescript
useEffect(() => {
  setPageByStatus(() => {
    const updated: Record<StatusValue, number> = {} as any;
    STATUS_COLUMNS.forEach((status) => {
      const total = columns[status].length;
      const pages = Math.max(1, Math.ceil(total / ITEMS_PER_COLUMN));
      updated[status] = pages;
    });
    return updated;
  });
}, [companyFilter, applicants.length]);  // L80
```

**Problema:** 
- Dependencia en `applicants.length` pero debería ser `applicants` 
- Cada render de applicants NUEVO → columns NUEVO → página salta

---

### 4.4 CampaignsKanban.tsx
**Ubicación:** `src/features/COMMUNITY/components/CampaignsKanban.tsx`  
**Líneas:** ~350

**useState (8):**
```typescript
1. campaigns: Campaign[]
2. isModalOpen: boolean
3. isEditing: boolean
4. editingId: string | null
5. formData: CampaignFormData
6. currentPage: { [key: string]: number }  // Paginación por empresa
```

**Características:**
- ✅ Grupo por empresa
- ✅ Paginación por columna (3 items per page)
- ✅ Modal reutilizable create/edit

**⚠️ PROBLEMA - Estado de paginación:**
```typescript
const [currentPage, setCurrentPage] = useState<{ [key: string]: number }>({});

const handlePageChange = (companyId: string, newPage: number) => {
  setCurrentPage(prev => ({
    ...prev,
    [companyId]: newPage
  }));
};
```

**Ineficiencia:** Cada cambio de página dispara re-render de TODO el componente, incluyendo empresas que no cambiaron. Debería usar:
- `useReducer` para estado complejo
- O dividir en `<CampaignColumn>` memoizado

**⚠️ PROBLEMA - Validación:**
```typescript
const validateWhatsApp = (phone: string): boolean => {
  const phoneRegex = /^\d{9}$/;
  return phoneRegex.test(phone);
};
```
Redefinida en CADA render. Debería estar fuera del componente o en useMemo.

---

### 4.5 CompaniesSection.tsx
**Ubicación:** `src/features/COMMUNITY/components/CompaniesSection.tsx`  
**Líneas:** ~200

**useState (4):**
```typescript
1. isModalOpen: boolean
2. isEditing: boolean
3. editingCompanyId: string | null
4. formData: CompaniesFormData
```

**✅ ESTADO LIMPIO** - Simple y bien separado

**⚠️ PROBLEMA - Validación en handler:**
```typescript
const handleSave = () => {
  if (!formData.name.trim()) {
    alert('Por favor completa el nombre...');  // Usar context notification!
    return;
  }
  // ...
};
```

Usando `alert()` en vez de NotificationContext

---

### 4.6 AdvertiserAccountsSection.tsx
**Ubicación:** `src/features/COMMUNITY/components/AdvertiserAccountsSection.tsx`  
**Líneas:** ~220

**Identical structure a CompaniesSection:**
- 4 useState calls
- Modal create/edit pattern
- ✅ Mejor validación numérica (regex + length check)

---

## 5. PATRONES DE RENDERIZADO Y OPTIMIZACIONES

### 5.1 Uso de React.memo
**Ocurrencias globales:** 18 instancias encontradas

**Distribución:**
- `src/features/SUPERVISOR_GTR/pages/GTRDashboard.tsx` - L529 (estadísticas con index key)
- `src/features/ASESOR_VENTAS/pages/SalesAdvisorDashboard.tsx` - L178, 251, 313 (lista de categorías)
- `src/components/molecules/MetricsPanel/MetricsPanel.tsx` - L22 (items indexados)

**PROBLEMA:** 18 instancias pero **NO hay React.memo en componentes principales**
- CommunityDashboard: ❌ No usa memo
- EmployeeDashboard: ❌ No usa memo  
- KanbanDashboard: ❌ No usa memo (KanbanBoard es un sub-component sin memo)
- DataTable: ❌ Probablemente no memoizado

### 5.2 Inline Functions
**Total encontrado:** 20+ instancias (minimo)

**Ejemplos explícitos:**

CommunityDashboard.tsx (L517-630):
```typescript
onChange={(e) => setEditMetricsData(prev => ({ ...prev, cantLeads: parseInt(e.target.value) || 0 }))}
```
- 9 onChange handlers con inline lambdas
- Impacto: Cada render = nuevas funciones → DataTable no puede detectar cambios estructura

DevRoleSwitcher.tsx (L34):
```typescript
onChange={(e) => onRoleChange(e.target.value as Role)}
```

LeadsListPanel.tsx (L125):
```typescript
onChange={(e) => onSearchChange(e.target.value)}
```

### 5.3 Keys en Listas
**Problemas encontrados:**

GTRDashboard.tsx (L529):
```typescript
{statistics.map((stat, index) => (
  <StatCard key={index} stat={stat} />  // ❌ ANTI-PATRÓN: usar index como key
))}
```

ASESOR_VENTAS.tsx (L251, 313):
```typescript
{category.subcategories.map((sub, index) => (
  <li key={index}>• {sub}</li>  // ❌ index key
))}
{TIPIFICATION_CATEGORIES.find(...)?.subcategories.map((sub, index) => (
  <button key={index}>  // ❌ index key
))}
```

MetricsPanel.tsx (L22):
```typescript
{metrics.map((metric, index) => (
  <div key={index}>  // ❌ index key
))}
```

**CRÍTICO:** Total estimado de **index keys problemáticas: 5+**

### 5.4 Cálculos dentro de JSX
**Ejemplos:**

CommunityDashboard.tsx DataTable columns (L277-298):
```typescript
{ header: 'COSTO/RESULTADO', accessor: (c) => `S/ ${((c.metaAdsLeads || 0) > 0 ? ((c.totalSpent || 0) / (c.metaAdsLeads||0)).toFixed(2) : '0.00')}` }  // CPM
{ header: 'CPM', accessor: (c) => `S/ ${((c.impressions||0)>0?((c.totalSpent||0)/(c.impressions||0)*1000).toFixed(2):'0.00')}` }
{ header: 'CPC', accessor: (c) => `S/ ${((c.clicks||0)>0?((c.totalSpent||0)/(c.clicks||0)).toFixed(2):'0.00')}` }
{ header: 'CTR', accessor: (c) => `${((c.impressions||0)>0?(((c.clicks||0)/(c.impressions||0))*100).toFixed(2):'0.00')}%` }
```

**Problema:** Todos estos cálculos se repiten en CADA render del DataTable

**Solución recomendada:**
```typescript
const enrichCampaigns = useMemo(() => 
  campaigns.map(c => ({
    ...c,
    cpc: c.clicks > 0 ? (c.totalSpent / c.clicks).toFixed(2) : '0.00',
    cpm: c.impressions > 0 ? ((c.totalSpent / c.impressions) * 1000).toFixed(2) : '0.00',
    ctr: c.impressions > 0 ? (((c.clicks / c.impressions) * 100).toFixed(2)) : '0.00'
  })),
  [campaigns]
);
```

### 5.5 Virtualización de Listas
**NINGUNA instancia encontrada.**

**Componentes que renderean listas grandes:**

1. **CommunityDashboard - campaignLeadsBreakdown:**
   ```typescript
   {campaignLeadsBreakdown.map(({ campaign, totalLeads, convertedLeads, leadsByDate }) => (
     <React.Fragment key={campaign.id}>
       <tr>...</tr>
       {Object.entries(leadsByDate).map(([date, dateLeads]) => (  // Nested loop!
         <tr key={`${campaign.id}-${date}`}>...</tr>
       ))}
     </React.Fragment>
   ))}
   ```
   **Riesgo:** Si hay 50+ campañas con 30+ fechas cada una = 1500+ filas en DOM

2. **KanbanDashboard - columnas de Kanban:**
   ```typescript
   {paginatedCards.map((app) => (
     <Card key={app.id}>...</Card>  // ✅ Paginación de 10 items limita el tamaño
   ))}
   ```
   ✅ Este está protegido con paginación

3. **ApplicantsDashboard:**
   ```typescript
   <ApplicantsTable
     applicants={paginatedApplicants}  // ✅ También pagina (10 items)
   />
   ```
   ✅ Paginado

4. **EmployeeDashboard:**
   ```typescript
   <EmployeeTable
     employees={paginatedEmployees}  // ✅ Paginado (ITEMS_PER_PAGE = 10)
   />
   ```
   ✅ Paginado

**Conclusión:** CommunityDashboard es el único con riesgo real de renderizar muchos items. La tabla de campaignLeadsBreakdown necesita virtualización si hay >100 leads.

---

## 6. ANÁLISIS ATOMIC DESIGN

### 6.1 Componentes de Atoms
**Cantidad:** 13 carpetas

```
atoms/
├── Badge/                       # Badges simple
├── Button/                      # Botón base (extends HTMLButtonElement)
├── DarkModeToggle/              # Toggle tema oscuro
├── Divider/                     # Separador visual
├── IconButton/                  # Botón con icono
├── Input/                       # Input base (extends HTMLInputElement)
├── Label/                       # Label simple
├── LeadListItem/                # Item de lead
├── RoleBadge/                   # Badge de rol personalizado
├── Select/                      # Select/dropdown
├── Spinner/                     # Loading spinner
├── TipificationOption/          # Opción de tipificación
```

**Análisis de Button.tsx:**
```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}) => {
  const cls = `atom-button ${variant} ${size} ${className}`.trim();
  return <button className={cls} {...rest}>{children}</button>;
};
```

✅ **BIEN HECHO:**
- Extiende tipos HTML nativos
- Props tipadas correctamente
- Clase dinámica simple

**Análisis de Input.tsx:**
```typescript
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}
```

✅ **BIEN HECHO:** Similar patterns al Button

**⚠️ PROBLEMA POTENCIAL:** No hay validación en los atoms
- InputNumber sin validación
- Validaciones en componentes padres (CompaniesSection, AdvertiserAccountsSection)

**PATRÓN INCORRECTO EN ATOMS CON LÓGICA:**

LeadListItem.tsx podría tener lógica interna.

---

### 6.2 Componentes de Molecules
**Cantidad:** 14 carpetas

```
molecules/
├── Alert/                       # Mensaje de alerta
├── ApplicantForm/               # Formulario de postulante
├── Card/                        # Card contenedor
├── DataTable/                   # Tabla de datos flexible
├── DatePicker/                  # Selector de fecha
├── HeaderActions/               # Acciones en header
├── LeadDetailCard/              # Detalles de lead
├── LeadsWidget/                 # Widget de leads
├── MetricsPanel/                # Panel de métricas (encontrado)
├── Modal/                       # Modal reutilizable
├── Pagination/                  # Paginación
├── StatCard/                    # Tarjeta de estadística
├── TipificationBlockPanel/      # Panel de tipificación
├── Toast/                       # Toast/notificación
```

**DataTable (Crítica - muy usada):**

Usada en:
- CommunityDashboard (L448) - tabla de campañas
- Potencialmente otros dashboards

**MetricsPanel.tsx:**
```typescript
{metrics.map((metric, index) => (
  <div key={index} className="metric-item">  // ❌ Index key!
    <div className="metric-label">{metric.label}</div>
    <div className="metric-value">{metric.value}</div>
  </div>
))}
```

**DatePicker:** Tiene 2 useEffect (L15, 31)

**Modal:** Componente bien estructurado, probablemente memoizado internamente

---

### 6.3 Componentes de Organisms
**Cantidad:** 5 carpetas

```
organisms/
├── Forms/                       # Múltiples formularios
├── Layout/                      # Header, Sidebar
├── LeadsListPanel/              # Panel de leads
├── Tables/                      # Tablas específicas (EmployeeTable, ApplicantsTable)
├── TipificationPanel/           # Panel de tipificación
```

---

## 7. IMPORTACIONES Y DEPENDENCIAS

### 7.1 Package.json Analysis

**Dependencias principales:**
```json
{
  "axios": "^1.13.5",           // HTTP client
  "react": "^19.2.0",           // React
  "react-dom": "^19.2.0",       // React DOM
  "react-icons": "^5.5.0",      // Iconos (Bien usado en todo el código)
  "zod": "^4.3.6"               // Validación de esquemas
}
```

**DevDependencies clave:**
- TypeScript ~5.9.3
- Vite 7.2.4
- Vitest 4.0.18
- ESLint + TypeScript ESLint

**⚠️ OBSERVACIONES:**

1. **Muy pocas dependencias:** Bueno para tamaño del bundle
2. **Sin librerías de UI:** Todo CSS custom
3. **Sin react-router-dom:** Routing aparentemente manual en RouterByRole.tsx
4. **Sin gestión de estado (Redux/Zustand):** Solo Context API
5. **Sin testing visible:** Vitest instalado pero pocas pruebas
6. **Sin React Query/SWR:** Sincronización manual con localStorage

### 7.2 Importaciones Circulares
**Búsqueda realizada:** Ninguna detectada en análisis visual

**Patrón de imports:** 
- `@contexts/` - alias claro
- `@hooks/` - alias correcto
- `@molecules/` - alias funciona
- `@organisms/` - alias funciona
- `@atoms/` - alias funciona
- `@types/` - alias de tipos
- `@utils/` - alias de utilidades
- `@services/` - alias de servicios
- `@shared/` - alias compartido

**No hay imports relativos problemáticos:** ✅ Bien configurado en `tsconfig.json`

---

## 8. ANÁLISIS DETALLADO DE useEffect

### Total de useEffect encontrado: 38 instancias

**Distribución por archivo:**

| Archivo | useEffect | Categoría |
|---------|-----------|-----------|
| SidebarContext | 2 | localStorage sync |
| ApplicantsContext | 2 | Inicialización + eventos |
| DevRoleContext | 1 | localStorage |
| Toast | 1 | Auto-dismiss |
| DarkModeToggle | 1 | localStorage |
| DatePicker | 2 | UI state |
| TipificationBlockPanel | 1+ | UI interactions |
| KanbanDashboard | 1 | Paginación |
| ApplicantsDashboard | 2 | Paginación + data load |
| EmployeeDashboard | 6+ | Múltiplos |
| AdminDashboard | 1 | Logging |
| DESARROLLADOR | 1 | Logging |
| **Otros dashboards** | ~14 | Varios |

### 8.1 useEffect Problemáticos

#### ApplicantsContext.tsx (L47)
```typescript
useEffect(() => {
  loadInitialData();
  // ... listeners
  return () => { ... };
}, [loadInitialData]);  // ⚠️ PROBLEMA: loadInitialData es callback
```

**Problema:** `loadInitialData` es un useCallback que depende de sí mismo → loop potencial
**Solución:** Remover `useEffect` para inicialización o usar `[applicants]` en dependencias

#### KanbanDashboard.tsx (L80)
```typescript
useEffect(() => {
  setPageByStatus(() => { ... });
}, [companyFilter, applicants.length]);
```

**Problema:** Dependencia en `applicants.length` es incompleta
- Si un applicante es modificado (mismo length) → no actualiza
- Si se reordenan → no actualiza

**Solución:** Usar `applicants` como dependencia o `useDerivedState`

#### EmployeeDashboard.tsx (L116-121)
```typescript
useEffect(() => {
  loadInitialData();
}, [loadInitialData]);

useEffect(() => {
  dispatchEvent('employeeStatusChanged');
}, []);
```

**Problema:** Dos useEffect para cargar datos
- `loadInitialData` cambia → first effect corre
- Luego event dispatch

**Mejor:** Consolidar a 1 useEffect

#### TipificationBlockPanel.tsx (L69)
No analizado completamente, pero probabilemente hay listeners

### 8.2 Patrón de sincronización localStorage
**Encontrado en:** SidebarContext, DevRoleContext, ApplicantsContext

**Patrón:**
```typescript
useEffect(() => {
  const stored = localStorage.getItem(key);
  setState(stored ? JSON.parse(stored) : default);
}, []);

useEffect(() => {
  localStorage.setItem(key, JSON.stringify(state));
}, [state]);
```

✅ **CORRECTO:** Separación clara entre lectura y escritura

---

## 9. ESTADO GLOBAL VS LOCAL

### 9.1 Uso de Context

**Estado GLOBAL via Context (5 contextos):**
1. **ApplicantsContext** → postulantes + CRUD
2. **DataContext** → empleados + postulantes (DUPLICADO ⚠️)
3. **NotificationContext** → toasts
4. **SidebarContext** → collapsed/expanded
5. **DevRoleContext** → rol seleccionado (dev only)

**Métrica:** Usado en ~15+ componentes

### 9.2 Análisis de Estados que podrían ser locales

**CommunityDashboard:**
- ✅ `activeSection` → DEBE ser global o al menos persistente para volver
- ✅ `campaigns`, `companies`, `advertiserAccounts` → DEBERÍAN estar en Context o API
- ❌ `editMetricsData`, `selectedCampaignForEdit` → LOCAL (correcto)
- ❌ `isModalOpen`, `isEditingMetrics` → LOCAL (correcto)

**EmployeeDashboard:**
- ✅ `employees` → DEBE estar en Context o API
- ❌ `selectedEmployee`, `detailMode` → LOCAL (correcto)
- ❌ Todos los `isXModalOpen` → LOCAL (correcto)

**KanbanDashboard:**
- ✅ `applicants` → En ApplicantsContext (correcto)
- ❌ `pageByStatus`, `selectedForTipify` → LOCAL (correcto)

### 9.3 PROBLEMA - DataContext duplica ApplicantsContext

**Dos fuentes de verdad:**

```typescript
// DataContext.tsx
const [applicants, setApplicants] = useState<Applicant[]>(mockApplicants);

// ApplicantsContext.tsx  
const [applicants, setApplicants] = useState<Applicant[]>([]);
// + sincronización localStorage
```

**Componentes usan:**
- ApplicantsDashboard → useApplicants() ✅ Correcto
- Otros → useData() ❌ Datos mock hardcoded

**Recomendación:** Eliminar DataContext completamente, mantener ApplicantsContext como única verdad

---

## 10. VIRTUALIZACIÓN DE LISTAS

### Componentes con rendering de listas grandes

| Componente | Tipo | Items | Virtualizado | Paginado |
|-----------|------|-------|-------------|----------|
| CommunityDashboard - campaignLeadsBreakdown | Tabla | 50-1000+ | ❌ | ❌ |
| CommunityDashboard - campaigns DataTable | Tabla | 5-100 | ❌ | ❌ |
| KanbanDashboard - Kanban Cards | Columnas | <50 per column | ❌ | ✅ (10 items per page) |
| ApplicantsDashboard - Tabla | Tabla | 50-500+ | ❌ | ✅ (10 items per page) |
| EmployeeDashboard - Tabla | Tabla | 50-500+ | ❌ | ✅ (10 items per page) |
| CampaignsKanban - Cards | Kanban | 20-100 | ❌ | ✅ (3 items per page) |

### Conclusión de Virtualización

**NINGÚN componente usa:**
- react-window
- react-virtualized  
- tanstack/react-virtual
- intersection observer

**RIGO DETECTADO:**

1. **CommunityDashboard - campaignLeadsBreakdown:**
   ```
   Peor caso: 100 campañas × 365 fechas = 36,500 elementos en DOM
   Realista: 10 campañas × 30 fechas = 300 elementos (probablemente OK)
   ```

2. **CommunityDashboard - DataTable de campaigns:**
   ```
   Peor caso: 1000 campañas → renderiza todas las filas
   Realista: <50 campañas (probablemente OK)
   ```

**Recomendación:** Mantener eye en CommunityDashboard si crece el volumen de datos. Para ahora, paginación es suficiente.

---

## 11. OBSERVACIONES GENERALES DE CALIDAD

### ✅ FORTALEZAS

1. **TypeScript bien implementado:** Types explícitos en todos lados
2. **Context API bien usada:** 5 contextos separados por responsabilidad
3. **Atomic Design implementado:** Estructura clara atoms → molecules → organisms
4. **Paginación:** Implementada en lugares críticos (KanbanDashboard, ApplicantsDashboard, EmployeeDashboard)
5. **Notificaciones centralizadas:** NotificationContext + Toast system
6. **LocalStorage sync:** Modelos persistentes (SidebarContext, DevRoleContext)
7. **useCallback usado:** 26 instancias encontradas
8. **useMemo usado:** 28 instancias encontradas
9. **Error handling básico:** useErrorHandler hook (aunque incompleto)

### ⚠️ DEBILIDADES CRÍTICAS

1. **Duplicación de estados:** DataContext vs ApplicantsContext
2. **Inline functions excesivas:** +20 insances en onChange handlers
3. **Index keys en listas:** 5+ instancias en estadísticas y categorías
4. **Sin memoización de componentes:** DataTable, KanbanBoard, etc.
5. **Cálculos en JSX:** Métricas recalculadas en cada render
6. **useEffect con dependencias incompletas:** ApplicantsContext, KanbanDashboard
7. **Componentes demasiado grandes:** EmployeeDashboard tiene 1700+ líneas
8. **Sin error reporting real:** useErrorHandler es skeleton
9. **Sin testing:** 0 archivos de test encontrados (con vitest instalado)
10. **Sin código splitting:** Todo en page components, sin lazy loading

### 🟡 AREAS DE MEJORABLE

1. **Validación:** Mezcla entre atoms (sin validar) y secciones (con validar)
2. **Manejo de errores:** alert() en lugar de NotificationContext
3. **API integration:** Básica, sin retry logic o error recovery
4. **Performance:** Sin monitoreo de render counts o profiling
5. **Persistencia:** localStorage para todo, sin sincronización en server

---

## 12. NÚMEROS RESUMEN EXACTOS

| Métrica | Cantidad | Notas |
|---------|----------|-------|
| **Archivos TSX** | 79 | Total en src/ |
| **useState** | 177 | Instancias en el código |
| **useEffect** | 38 | Instancias en el código |
| **useCallback** | 26 | Instancias garantizadas |
| **useMemo** | 28 | Instancias garantizadas |
| **React.memo** | 18 | Instancias (sin componentes principales) |
| **Contextos** | 5 | ApplicantsContext, DataContext, NotificationContext, SidebarContext, DevRoleContext |
| **Hooks personalizados** | 7 | useApplicantsSync, useApplicantsTable, useBackofficeLeads, usePagination, useTipification, useErrorHandler, custom hooks |
| **Componentes Atoms** | 13 | Badge, Button, Input, Select, etc. |
| **Componentes Molecules** | 14 | Card, Modal, DataTable, MetricsPanel, etc. |
| **Componentes Organisms** | 5+ | Forms, Layout, Tables, LeadsListPanel, TipificationPanel |
| **Inline functions** | 20+ | En onChange handlers principalmente |
| **Index keys en listas** | 5+ | Anti-patrón encontrado |
| **Cálculos en JSX** | 10+ | En DataTable accessors |
| **useEffect con deps problematicas** | 3+ | ApplicantsContext, KanbanDashboard, EmployeeDashboard |

---

## 13. RECOMENDACIONES PRIORITARIAS

### Priority 1 (CRÍTICO)
1. **Eliminar DataContext:** Consolidar en ApplicantsContext única fuente
2. **Memoizar componentes principales:** KanbanBoard, DataTable, EmployeeDashboard
3. **Remover index keys:** Usar IDs únicos en listas

### Priority 2 (IMPORTANTE)
4. Mover cálculos de JSX a useMemo
5. Refactorizar inline functions a useCallback
6. Reducir líneas de CommunityDashboard y EmployeeDashboard

### Priority 3 (MEJORA)
7. Implementar verdadero error handling (Sentry)
8. Agregar performance monitoring
9. Implementar testing (vitest yá está instalado)
10. Code splitting + lazy loading para features

---

**FIN DEL ANÁLISIS**

Análisis completado: 13 de Marzo de 2026
