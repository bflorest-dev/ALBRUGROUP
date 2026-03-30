# FSD Architecture Improvement Plan

## Current State Analysis

### 1. Hooks with Manual Fetch (React Query Candidates)

| Hook | Type | Location | Repository Used | Priority |
|------|------|----------|-----------------|----------|
| `useFetchRoles` | List | shared/hooks | Mock only | LOW - Mock |
| `useEmployeesSync` | List + Sync | shared/hooks | EmployeeRepository | HIGH |
| `useApplicantsSync` | List + Filter | shared/hooks | ApplicantRepository | HIGH |
| `useLeadAsesorVentas` | Detail + Mutations | caracteristicas/asesor-ventas | LeadsRepository | HIGH |
| `useLeadGtr` | List + Mutations | caracteristicas/gtr | LeadsRepository | MEDIUM |
| `useLeadBackoffice` | List | caracteristicas/asesor-backoffice | LeadsRepository | MEDIUM |
| `useCampaignForm` | Data Loading | caracteristicas/community | LeadsRepository | MEDIUM |
| `useProveedoresForm` | List + Mutations | caracteristicas/community | proveedorService | HIGH |
| `useCommunityData` | Hub (6 entities) | caracteristicas/community | LeadsRepository | CRITICAL |

**Total**: 9 hooks = ~50% of codebase doing manual HTTP handling

---

### 2. Services Current Locations

All in `src/shared/services/`:
```
shared/services/
  ├── auth.service.ts (Auth logic - should move to entidades/auth/model)
  ├── employee.service.ts (Employee logic - should move to entidades/empleado/model)
  ├── contract.service.ts (Contract logic - should move to entidades/contrato/model)
  ├── applicant.service.ts (Applicant logic - should move to entidades/postulante/model)
  ├── proveedorService.ts (Provider logic - should move to caracteristicas/community/model)
  └── campaignService.ts (Campaign logic - should move to caracteristicas/community/model)
```

**Problem**: Generic services mixed with domain-specific logic

---

### 3. FSD Compliance Issues

❌ **Current Problems**:
- Services in `shared` should be utilities only (logging, formatting, etc.)
- Domain services should be in `entities/{entity}/model` or `features/{feature}/model`
- Hooks doing HTTP directly (should use services or React Query)
- No React Query dependency injection
- No query client setup

---

## Phase 1: React Query Setup (Week 1-2)

### Step 1: Install Dependencies
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Step 2: Create Query Client Setup
Create `src/app/providers/QueryProvider.tsx`:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      gcTime: 1000 * 60 * 10, // 10 min
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Step 3: Create Query Hooks (Progressive)

Priority order for migration:

**CRITICAL** (Week 1):
1. → `useLeadsQuery` (replaces useCommunityData - 50+ states)
2. → `useEmployeesQuery` (replaces useEmployeesSync)
3. → `useApplicantsQuery` (replaces useApplicantsSync)

**HIGH** (Week 2):
4. → `useLeadAsesorVentasQuery` (replaces useLeadAsesorVentas)
5. → `useProveedoresQuery` (replaces useProveedoresForm)
6. → `useLeadGtrQuery` (replaces useLeadGtr)

**MEDIUM** (Optional):
7. → `useCampaignFormQuery`
8. → `useLeadBackofficeQuery`

---

## Phase 2: Service Reorganization (Week 2-3)

### Target Structure

```
FSD Layers (Top to Bottom):
app/
├── providers/
│   ├── QueryProvider.tsx (NEW)
│   └── ...existing
└── ...

shared/
├── services/  ← Utilities ONLY
│   ├── logger.ts
│   ├── formatter.ts
│   └── cache.ts
├── lib/
│   ├── base.service.ts (maybe keep if utilities)
│   └── ...
└── hooks/
    └── (no HTTP directly - use queries)

entidades/
├── auth/
│   └── model/
│       ├── auth.service.ts ← AUTH SERVICE MOVED HERE
│       └── ...
├── empleado/
│   └── model/
│       ├── employee.service.ts ← EMPLOYEE SERVICE MOVED HERE
│       └── ...
├── contrato/
│   └── model/
│       ├── contract.service.ts ← CONTRACT SERVICE MOVED HERE
│       └── ...
└── postulante/
    └── model/
        ├── applicant.service.ts ← APPLICANT SERVICE MOVED HERE
        └── ...

caracteristicas/
├── community/
│   ├── model/
│   │   ├── proveedor.service.ts ← PROVEEDOR SERVICE MOVED HERE
│   │   ├── campaign.service.ts ← CAMPAIGN SERVICE MOVED HERE
│   │   └── ...
│   ├── hooks/
│   │   └── useLeadsQueries.ts (NEW - replaces big centralized hook)
│   └── ...
└── ...
```

### Migration Steps

1. Move services:
   ```bash
   mv src/shared/services/auth.service.ts src/entidades/auth/model/
   mv src/shared/services/employee.service.ts src/entidades/empleado/model/
   mv src/shared/services/contract.service.ts src/entidades/contrato/model/
   mv src/shared/services/applicant.service.ts src/entidades/postulante/model/
   mv src/shared/services/proveedorService.ts src/caracteristicas/community/model/
   mv src/shared/services/campaignService.ts src/caracteristicas/community/model/
   ```

2. Update imports:
   ```typescript
   // Before
   import { AuthService } from '@shared/services/auth.service';
   
   // After
   import { AuthService } from '@entidades/auth/model/auth.service';
   ```

3. Create index.ts files for re-exports (backward compat):
   ```typescript
   // src/entidades/auth/model/index.ts
   export { AuthService } from './auth.service';
   
   // src/entidades/auth/index.ts
   export { AuthService } from './model';
   ```

---

## Phase 3: Type & Mock Cleanup (Week 3)

### Identify Redundant Types
```bash
grep -r "export interface\|export type" src/shared/types src/entidades src/caracteristicas | wc -l
```

Look for:
- Duplicate definitions of same type
- Types only used in tests (move to test-utils)
- Aliases without real value (e.g., `TipificacionStatusAlias` = `string`)

### Consolidate Mocks
```
Locations to check:
  - __mocks__/ folders
  - mock*.ts files in source
  - .mock.ts files
  - Inline mocks in hooks (useFetchRoles)

Move to: src/shared/test-utils/mocks/
```

Example:
```typescript
// Move inline mocks
export const useFetchRoles = (): Role[] => {
  const [roles, setRoles] = useState<Role[]>([]);
  useEffect(() => {
    // Mock - reemplazar con API real
    setRoles(['LOGIN']);  // ← MOVE THIS TO TEST-UTILS
  }, []);
  return roles;
};
```

---

## Phase 4: FSD Validation (Week 4)

### Automated Checks

1. **Verify layer boundaries**:
   ```bash
   # No features should import from other features at same level
   grep -r "@caracteristicas/gtr" src/caracteristicas/community/
   # Should return: no matches
   ```

2. **Verify no HTTP in components**:
   ```bash
   grep -r "axios\|fetch\|http\." src/caracteristicas/*/ui/ src/pages/ src/widgets/
   # Should return: no matches
   ```

3. **Verify service locations**:
   ```bash
   ls src/shared/services/
   # Should return: empty or only utilities (logger, formatter)
   ```

4. **Check import aliases**:
   ```bash
   grep -r "@entidades/" src/caracteristicas/
   # Only features/pages can import entities
   # Features should NOT import other features
   ```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Breaking existing components | Create aliases first, deprecate gradually |
| Type errors after moves | Use imports with full paths for 1 month |
| Performance regression | React Query dev tools to monitor |
| Complexity in tests | Provide test-utils with query mocks |
| Interceptor logging loss | Keep httpClient & interceptors as-is |

---

## Success Criteria

✅ **Phase 1 (React Query)**:
- [ ] QueryProvider integrated in App.tsx
- [ ] 3 critical hooks migrated to RQ
- [ ] Devtools showing query cache
- [ ] Build passes

✅ **Phase 2 (Services)**:
- [ ] All domain services moved to entities/features
- [ ] shared/services empty except utilities
- [ ] Backward compat aliases working
- [ ] 0 import errors

✅ **Phase 3 (Types)**:
- [ ] Redundant types identified and merged
- [ ] Mocks in test-utils/
- [ ] Build size < 310 kB (current: 307.87 kB)
- [ ] No unused exports

✅ **Phase 4 (FSD)**:
- [ ] All grep checks pass
- [ ] No layer violations
- [ ] No HTTP in UI components
- [ ] Documentation updated

---

## Timeline

| Phase | Duration | Effort |
|-------|----------|--------|
| Setup & Critical RQ hooks | 1 week | 6h |
| Service reorganization | 1 week | 8h |
| Types & mocks cleanup | 1 week | 4h |
| FSD validation & docs | 1 week | 3h |
| **Total** | **4 weeks** | **21h** |

---

## Quick Wins (Do First)

1. ✅ Install React Query (5 min)
2. ✅ Setup QueryProvider (15 min)
3. ✅ Create `@shared/queries/` folder structure (10 min)
4. ✅ Start with `useLeadsQuery` (most impact)
5. ✅ Document import migration (20 min)

