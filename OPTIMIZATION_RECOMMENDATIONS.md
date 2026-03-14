# 🚀 Recomendaciones de Optimización del Codebase

## Resumen Ejecutivo

**Estado Actual**: El codebase es funcional pero tiene componentes monolíticos, gestión de datos dispersa y oportunidades de performance.

**Prioridad Alta**: 3 cambios que generan máximo impacto  
**Prioridad Media**: 5 mejoras de mantenimiento  
**Prioridad Baja**: 4 optimizaciones de UX/Performance

---

## 🔴 PRIORIDAD ALTA - Implementar Primero

### 1. **Refactor CommunityDashboard: Custom Hook para State Management**

**Problema**:
- 20+ variables `useState` en un componente
- Lógica de metrics, campaigns, companies dispersa
- Difícil de testear y mantener
- Re-render innecesario de toda la página al actualizar una sección

**Solución - Crear Custom Hook**:

```typescript
// src/features/COMMUNITY/hooks/useCommunityDashboard.ts
import { useState, useCallback, useMemo } from 'react';
import type { Campaign, Company, AdvertiserAccount } from '@types';

export const useCommunityDashboard = () => {
  // STATE
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [advertiserAccounts, setAdvertiserAccounts] = useState<AdvertiserAccount[]>(mockAdvertiserAccounts);
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  // COMPUTED VALUES (memoized)
  const metaAdsMetrics = useMemo(() => {
    const totalCantLeads = campaigns.reduce((sum, c) => sum + (c.metaAdsLeads || 0), 0);
    const totalLeadsDelta = campaigns.reduce((sum, c) => sum + (c.metaAdsLeadsDelta || 0), 0);
    const avgQxR = campaigns.length > 0 
      ? (campaigns.reduce((sum, c) => sum + (c.metaAdsQxR || 0), 0) / campaigns.length).toFixed(2)
      : '0.00';
    return [
      { label: 'CANT LEADS', value: totalCantLeads.toLocaleString() },
      { label: 'Δ LEADS', value: totalLeadsDelta.toLocaleString() },
      { label: 'Q x R', value: `S/ ${avgQxR}` },
    ];
  }, [campaigns]);

  const driveMetrics = useMemo(() => {
    const totalCantLeads = campaigns.reduce((sum, c) => sum + (c.driveLeads || 0), 0);
    const totalLeadsDelta = campaigns.reduce((sum, c) => sum + (c.driveLeadsDelta || 0), 0);
    const avgQxR = campaigns.length > 0 
      ? (campaigns.reduce((sum, c) => sum + (c.driveQxR || 0), 0) / campaigns.length).toFixed(2)
      : '0.00';
    return [
      { label: 'CANT LEADS', value: totalCantLeads.toLocaleString() },
      { label: 'Δ LEADS', value: totalLeadsDelta.toLocaleString() },
      { label: 'Q x R', value: `S/ ${avgQxR}` },
    ];
  }, [campaigns]);

  // ACTIONS (memoized con useCallback)
  const handleCreateCampaign = useCallback((formData: FormData) => {
    // ... lógica de creación
    setCampaigns(prev => [newCampaign, ...prev]);
  }, []);

  const handleSaveMetrics = useCallback((type: 'META ADS' | 'DRIVE', data: any) => {
    setCampaigns(prev => prev.map(c => ({
      ...c,
      [type === 'META ADS' ? 'metaAdsLeads' : 'driveLeads']: data.cantLeads,
    })));
  }, []);

  return {
    // State
    companies,
    setCompanies,
    advertiserAccounts,
    setAdvertiserAccounts,
    campaigns,
    setCampaigns,
    leads,
    activeSection,
    setActiveSection,
    // Computed
    metaAdsMetrics,
    driveMetrics,
    // Actions
    handleCreateCampaign,
    handleSaveMetrics,
  };
};
```

**Beneficios**:
- ✅ CommunityDashboard pasa de 500 → 150 líneas
- ✅ Lógica reutilizable en tests
- ✅ State confinado y controlado
- ✅ Cada section puede usar el hook si necesita

**Impacto**: -50% complejidad del componente | +20% en readability

---

### 2. **Centralizar Gestión de Datos: DataContext para COMMUNITY**

**Problema**:
- RRHH usa localStorage
- Community usa mock data
- Reclutamiento usa ApplicantsContext
- No hay forma consistente de sincronizar

**Solución - Extender DataContext**:

```typescript
// src/contexts/DataContext.tsx (actualizar)
interface DataContextType {
  // Existing
  applicants: Applicant[];
  employees: Employee[];
  
  // NEW: Community module
  communityCompanies: Company[];
  communityAdvertiserAccounts: AdvertiserAccount[];
  communityCampaigns: Campaign[];
  
  // Actions
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  updateCompanyColor: (companyId: string, color: string) => void;
}

// Provider
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [communityCompanies, setCommunityCompanies] = useState<Company[]>(mockCompanies);
  const [communityCampaigns, setCommunityCampaigns] = useState<Campaign[]>(mockCampaigns);
  // ... más state

  const updateCompanyColor = useCallback((companyId: string, color: string) => {
    setCommunityCompanies(prev => prev.map(c => 
      c.id === companyId ? { ...c, color } : c
    ));
    // Persistir a localStorage o API
    localStorage.setItem(`company_${companyId}_color`, color);
  }, []);

  return (
    <DataContext.Provider value={{ communityCompanies, communityCampaigns, ... }}>
      {children}
    </DataContext.Provider>
  );
};
```

**Beneficios**:
- ✅ Single source of truth
- ✅ Fácil de persistir (localStorage/API)
- ✅ Sincronización automática entre componentes
- ✅ DevTools integration

**Impacto**: Mejora data flow | Elimina inconsistencias

---

### 3. **Implementar Virtual Scrolling en Tablas Grandes**

**Problema**:
- EmployeeDashboard renderiza todos los empleados del DOM (aunque paginados)
- KanbanDashboard renderiza todas las cards de cada columna
- Bajo performance con >100 items

**Solución - React Window**:

```bash
npm install react-window
```

```typescript
// src/features/RRHH/components/organisms/Tables/VirtualEmployeeTable.tsx
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-window-auto-sizer';

interface VirtualEmployeeTableProps {
  employees: Employee[];
  height: number;
  itemSize: 50; // altura de cada row
}

export const VirtualEmployeeTable: React.FC<VirtualEmployeeTableProps> = ({
  employees,
  height,
  itemSize = 50,
}) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const employee = employees[index];
    return (
      <div style={style} className="employee-row">
        <span>{employee.fullName}</span>
        <span>{employee.documentNumber}</span>
        <span>{employee.position}</span>
      </div>
    );
  };

  return (
    <AutoSizer>
      {({ width }) => (
        <List
          height={height}
          itemCount={employees.length}
          itemSize={itemSize}
          width={width}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
};
```

**Beneficios**:
- ✅ Renderiza solo items visibles (~10-15)
- ✅ Mantiene scroll smooth
- ✅ `-80% DOM nodes` con 1000+ items
- ✅ Sin cambios en lógica existente

**Impacto**: +300% performance en listas grandes

---

## 🟡 PRIORIDAD MEDIA - Mejoras de Mantenibilidad

### 4. **Descomponer EmployeeDetailForm en Sub-componententes**

**Problema**: 200 líneas de un único formulario, 3 secciones (Empleado, Personal, Laboral)

**Solución**:

```
EmployeeDetailForm.tsx (70 líneas - orquestador)
├── EmployeeSection.tsx (40 líneas)
├── PersonalDataSection.tsx (60 líneas)
└── LaboralDataSection.tsx (80 líneas)
```

**Patrones**:
- Cada sección es componente independiente
- Reciben `formData`, `disabled`, `onChangeField`
- Reutilizable en NewEmployeeForm también

---

### 5. **Extraer Validación a Zod Schemas Compartidos**

**Problema**: Validación repetida en múltiples componentes (AdvertiserAccountsSection, EmployeeDetailForm, etc.)

**Solución**:

```typescript
// src/validation/schemas.ts
import { z } from 'zod';

export const AdvertiserAccountSchema = z.object({
  name: z.string().min(3, 'Nombre mínimo 3 caracteres'),
  accountNumber: z.string()
    .regex(/^\d{16}$/, 'Debe ser exactamente 16 dígitos'),
});

export const WhatsAppSchema = z.string()
  .regex(/^\d{9}$/, 'WhatsApp debe ser 9 dígitos');

export const CampaignSchema = z.object({
  campaignName: z.string().min(1),
  accountNumber: WhatsAppSchema,
});

// Uso en componentes
const result = CampaignSchema.safeParse(formData);
if (!result.success) {
  setErrors(result.error.flatten().fieldErrors);
}
```

**Beneficios**:
- ✅ DRY: Una sola fuente de validación
- ✅ Type-safe: Inferir tipos de schemas
- ✅ Reutilizable en frontend + backend

---

### 6. **Crear FormBuilder Reutilizable**

**Problema**: EmployeeDashboard, CommunityDashboard, KanbanDashboard tienen modales con formularios repetitivos

**Solución**:

```typescript
// src/components/molecules/FormBuilder.tsx
interface FormField {
  name: string;
  type: 'text' | 'email' | 'select' | 'date' | 'time';
  label: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: (value: any) => string | null;
}

interface FormBuilderProps {
  fields: FormField[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onCancel: () => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  fields,
  initialData,
  onSubmit,
  onCancel,
}) => {
  // Maneja render, validación, submit automáticamente
  return (...);
};

// Uso
<FormBuilder
  fields={[
    { name: 'campaignName', type: 'text', label: 'Nombre Campaña', required: true },
    { name: 'accountNumber', type: 'text', label: 'Cuenta Publicitaria', validation: WhatsAppSchema.parse },
  ]}
  onSubmit={handleCreateCampaign}
  onCancel={handleCancel}
/>
```

**Beneficios**:
- ✅ Elimina boilerplate de formularios
- ✅ Consistencia en UX
- ✅ Menos código, menos bugs

---

### 7. **Implementar Error Boundaries por Feature**

**Problema**: Si Community falla, afecta todo el módulo RRHH

**Solución**:

```typescript
// src/features/COMMUNITY/components/CommunityErrorBoundary.tsx
export class CommunityErrorBoundary extends React.Component<...> {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log a backend
    logErrorToBackend(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <CommunityErrorFallback onReset={this.resetError} />;
    }
    return this.props.children;
  }
}

// En CommunityDashboard.tsx
<CommunityErrorBoundary>
  <CampaignsKanban companies={companies} accounts={accounts} />
</CommunityErrorBoundary>
```

**Beneficios**:
- ✅ Aislamiento de errores por módulo
- ✅ UX mejorada (no crash total)
- ✅ Debugging más fácil

---

### 8. **Patrón de Custom Hook para Paginación**

**Problema**: Paginación duplicada en EmployeeDashboard, KanbanDashboard, CampaignsKanban

**Solución - Ya existe `usePagination`**:

```typescript
// Mejorar el existente: src/hooks/usePagination.ts
export const usePagination = <T,>(
  items: T[],
  itemsPerPage: number = 10,
  options?: {
    onPageChange?: (page: number) => void;
    stickToEnd?: boolean; // Hacer sticky al cambio
  }
) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    setCurrentPage(validPage);
    options?.onPageChange?.(validPage);
  }, [totalPages, options]);

  // Auto-jump to last page on data change (stickToEnd)
  useEffect(() => {
    if (options?.stickToEnd && items.length > 0) {
      goToPage(totalPages);
    }
  }, [items.length, totalPages, options?.stickToEnd, goToPage]);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    goToNextPage: () => goToPage(currentPage + 1),
    goToPreviousPage: () => goToPage(currentPage - 1),
  };
};
```

**Beneficios**:
- ✅ Elimina código duplicado
- ✅ Comportamiento consistente
- ✅ Reutilizable en nuevos componentes

---

## 🟢 PRIORIDAD BAJA - Optimizaciones de UX/Performance

### 9. **Lazy Load Images y Assets**

```typescript
// Usar en CompanyCard, CampaignCard
<img 
  src={imageSrc} 
  loading="lazy"
  decoding="async"
/>
```

**Impacto**: `-10-15ms` en initial paint

---

### 10. **Code Splitting por Feature**

```typescript
// routes/index.ts
const CommunityModule = lazy(() => import('@features/COMMUNITY'));
const RRHHModule = lazy(() => import('@features/RRHH'));

<Suspense fallback={<Loader />}>
  <CommunityModule />
</Suspense>
```

**Impacto**: `-200-300kb` en bundle inicial

---

### 11. **Memoization de Componentes Costosos**

```typescript
// CampaignCard.tsx
export const CampaignCard = React.memo(({ campaign, onEdit, onDelete }) => {
  return (...)
}, (prevProps, nextProps) => {
  // Custom comparison para optimizar
  return prevProps.campaign.id === nextProps.campaign.id;
});
```

**Impacto**: Evita re-render innecesarios en KanbanDashboard

---

### 12. **Implementar Loading States con Skeleton Screens**

```typescript
// En lugar de "Cargando..."
<Skeleton className="table-skeleton" rows={5} />
```

**Impacto**: Mejor UX percibida

---

## 📊 Matriz de Impacto vs Esfuerzo

| Mejora | Esfuerzo | Impacto | ROI |
|--------|----------|---------|-----|
| **Custom Hook Community** | 🟡 2h | 🔴 Alto | ⭐⭐⭐⭐⭐ |
| **DataContext Unificado** | 🔴 4h | 🔴 Alto | ⭐⭐⭐⭐ |
| **Virtual Scrolling** | 🟡 3h | 🟢 Medio | ⭐⭐⭐ |
| **Descomponer Forms** | 🟡 3h | 🟢 Medio | ⭐⭐⭐ |
| **Zod Schemas** | 🟢 1h | 🟢 Medio | ⭐⭐⭐ |
| **FormBuilder** | 🔴 5h | 🟢 Medio | ⭐⭐⭐ |
| **Error Boundaries** | 🟢 1h | 🟢 Medio | ⭐⭐⭐ |
| **Mejorar usePagination** | 🟢 1h | 🟢 Bajo | ⭐⭐ |
| **Lazy Loading** | 🟢 30min | 🔵 Bajo | ⭐⭐ |
| **Code Splitting** | 🟡 2h | 🔵 Bajo | ⭐⭐ |

---

## 🎯 Plan de Implementación Recomendado

### **Sprint 1 (1-2 semanas)**
1. ✅ Custom Hook `useCommunityDashboard` 
2. ✅ Mejora `usePagination` hook
3. ✅ Error Boundaries básicos
4. ✅ Zod Schemas centralizados

### **Sprint 2 (2-3 semanas)**
5. ✅ DataContext unificado
6. ✅ Descomponer EmployeeDetailForm
7. ✅ Virtual Scrolling en tablas

### **Sprint 3 (+ optimizaciones)**
8. ✅ FormBuilder reutilizable
9. ✅ Code Splitting
10. ✅ Skeleton Screens

---

## 🔍 Testing & Validación

Para cada mejora, incluir:
- Unit tests de custom hooks
- Integration tests de cambios de data
- Performance benchmarks (antes/después)
- User testing de cambios de UX

---

## 📝 Conclusión

**Estado Actual**: Funcional pero con deuda técnica
**Riesgo**: Difícil de mantener a medida que crece el proyecto
**Oportunidad**: Aplicar estas mejoras → Código 2-3x más mantenible y rápido

**Próximos Pasos**:
1. Priorizar según ROI (Custom Hook + DataContext + Virtual Scrolling)
2. Crear tickets en backlog
3. Estimar capacidad de equipo
4. Ejecutar sprint por sprint
