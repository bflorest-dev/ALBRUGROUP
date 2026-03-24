# 🎯 DETAILED FSD RESTRUCTURING PLAN - PHASE 2 (COMPREHENSIVE)

**Status**: Planning | **Execution**: Ready  
**Date**: 2026-03-24

---

## 🔍 CURRENT STATE ANALYSIS

### Critical Issues Identified
1. **Type Duplication** (3 locations):
   - `src/compartido/tipos/` ← Primary (keep)
   - `src/shared/types/` ← Delete (merge)
   - `src/types/` ← Delete (merge)

2. **Entry Point Duplication** (2 entry points):
   - `src/main.tsx` ← Current active point
   - `src/app/main.tsx` ← New point (consolidate)

3. **Service Duplication**:
   - `src/services/` ← Legacy services
   - `src/caracteristicas/*/api/` ← Feature-specific (keep, more organized)
   - Decision: Consolidate legacy services into features where applicable

4. **Context Location**:
   - `src/contexts/` ← Currently dispersed
   - Target: Move core contexts to `src/compartido/lib/contexts` or keep accessible

---

## 📋 REESTRUCTURACIÓN MASTER PLAN

### PHASE A: Consolidate Types (Priority 1)
**Goal**: Single source of truth for all types  
**Action**: Merge `src/shared/types/` and `src/types/` into `src/compartido/tipos/`

```
ELIMINATE:
- src/shared/types/
- src/types/

KEEP & EXPAND:
- src/compartido/tipos/
  ├── advisor.types.ts (from shared/)
  ├── common.ts (from shared/)
  ├── community.ts ✅
  ├── comun.ts (consolidate with common.ts)
  ├── enums.ts (merge both)
  ├── eventos.ts / events.ts (consolidate)
  ├── lead.types.ts (from shared/)
  └── tipification.types.ts (from shared/)
```

**Files to update**: ~80+ imports across src/

---

### PHASE B: Reorganize Entry Points (Priority 2)
**Goal**: Single, clean entry point via src/app/main.tsx

```
CURRENT:
- src/main.tsx (active point)
→ src/App.tsx
→ src/RouterByRole.tsx

NEW:
- src/main.tsx (proxy - keep for vite entry)
→ src/app/main.tsx (actual entry)
  → src/app/App.tsx
  → src/app/RouterByRole.tsx

MOVE:
- RouterByRole.tsx: src/ → src/app/ (verify already there)
- Update: src/main.tsx to forward to src/app/main.tsx
```

---

### PHASE C: Consolidate Services (Priority 2.5)
**Goal**: Centralize services in feature folders

```
KEEP IN src/services/ (legacy):
- auth.service.ts (if not in features)
- base.service.ts (utility - move to compartido/lib)

MIGRATE TO src/caracteristicas/*/api/:
- applicant.service.ts → caracteristicas/registrar-postulante/api/
- employee.service.ts → caracteristicas/registrar-empleado/api/
- contract.service.ts → caracteristicas/gestion-contratos/api/

ARCHIVE/DELETE:
- src/shared/ (after type consolidation)
- Old service implementations (if already in features)
```

---

### PHASE D: Organize Entidades (Priority 3)
**Goal**: Clear domain structure per entity

```
VERIFY & ORGANIZE:

src/entidades/
├── lead/
│   ├── modelo/ (types)
│   ├── ui/
│   │   ├── atomos/
│   │   ├── moleculas/
│   │   └── organismos/
│   └── index.ts
├── postulante/
│   ├── modelo/
│   ├── ui/
│   └── index.ts
├── empleado/
│   ├── modelo/
│   ├── ui/
│   └── index.ts
├── asesor/
│   ├── modelo/
│   ├── ui/
│   └── index.ts
├── tipificacion/
│   ├── modelo/
│   ├── ui/
│   └── index.ts
├── usuario/
│   ├── modelo/
│   ├── ui/
│   └── index.ts
└── candidato/
    ├── modelo/
    ├── ui/
    └── index.ts
```

---

### PHASE E: Organize Paginas (Priority 3)
**Goal**: Each dashboard is a role-based page

```
KEEP IN src/paginas/:

├── admin/
│   ├── AdminDashboard.tsx
│   └── index.ts
├── rrhh/
│   ├── ApplicantsDashboard.tsx
│   └── index.ts
├── login/
│   ├── LoginPage.tsx
│   └── index.ts
├── community/
│   ├── CommunityDashboard.tsx
│   └── index.ts
├── supervisor-gtr/
│   ├── SupervisorGTRDashboard.tsx
│   └── index.ts
├── asesor-backoffice/
├── asesor-ventas/
├── reclutamiento/
├── capacitacion/
└── desarrollador/

ARCHITECTURE:
Each page:
- Imports features (caracteristicas/)
- Imports entities (entidades/)
- Imports widgets (widgets/)
- NO internal logic - composes features
```

---

### PHASE F: Verify Widgets (Priority 4)
**Goal**: Ensure all widgets are domain-agnostic

```
KEEP IN src/widgets/:
✅ All existing widgets (already well-organized)
- barra-lateral/
- encabezado/
- layout-principal/
- panel-leads/
- panel-tipificacion/
- supervisor-gtr/ (if generic, else move to caracteristicas)
- tabla-empleados/
- tabla-postulantes/

ACTION:
- Verify no domain-specific logic
- All widgets should use generic props
- Import from entidades/ for types, not implementations
```

---

### PHASE G: Cleanup & Delete (Priority 5)
**Goal**: Remove obsolete directories

```
DELETE AFTER CONSOLIDATION:
- src/shared/ (after types migrated)
- src/types/ (after consolidation)
- src/features/ (if empty or duplicated)
- OLD src/COMMUNITY/ (if exists, duplicated in caracteristicas/)
- OLD src/SUPERVISOR_GTR/ (if exists, duplicated in caracteristicas/)

KEEP:
- src/contexts/ (still referenced, keep for now)
- src/services/ (keep as utility, migrate specifics to features)
- src/repositories/ (keep - data access layer)
- src/api/ (keep - HTTP config)
```

---

## 🔄 EXECUTION ORDER

1. **Consolidate Types** (Phase A) - ~2-3 hours
   - Copy types from shared/ and types/ to compartido/tipos/
   - Update 80+ imports
   - Verify build

2. **Fix Entry Points** (Phase B) - ~30 min
   - Ensure src/app/main.tsx is actual entry
   - src/main.tsx forwards to app/
   - Verify build

3. **Reorganize Entidades** (Phase D) - ~1-2 hours
   - Verify structure
   - Create missing modelo/ dirs
   - Update exports/imports in each entity

4. **Verify Paginas** (Phase E) - ~30 min
   - Check each page imports correctly
   - No duplicated logic
   - Clean index.ts exports

5. **Consolidate Services** (Phase C) - ~1 hour
   - Move legacy services to features
   - Update imports
   - Verify API route pathing

6. **Cleanup** (Phase G) - ~30 min
   - Delete empty folders
   - Archive old code if needed
   - Final cleanup

7. **Verification** (Phase H) - ~30 min
   - `npm run build` - target 0 TS errors
   - Visual check of all dashboards
   - Test all routes

---

## 📊 IMPACT ESTIMATE

| Category | Estimate | Files Affected |
|----------|----------|-----------------|
| Type consolidation | 2-3h | ~90 files |
| Entry point cleanup | 30m | 5 files |
| Entidades reorganization | 1-2h | ~40 files |
| Paginas review | 30m | 10 files |
| Services consolidation | 1h | ~20 files |
| Cleanup & delete | 30m | 15 dirs |
| **TOTAL** | **~6 hours** | **~175 files** |

---

## ⚠️ CRITICAL PRECAUTIONS

1. **Backup**: Git commits after each phase
2. **Build**: Verify `npm run build` after major changes
3. **No Code Loss**: Move, don't delete until verified
4. **Type Safety**: 0 TS errors target throughout
5. **Tests**: Run dev server after each phase

---

## 📝 DELIVERABLES

1. Clean FSD + Atomic Design structure
2. Single source of truth for types
3. Clear entry point
4. No duplicated code or services
5. All imports updated and functional
6. Build successful (0 TS errors)
7. All dashboards operational
8. Comprehensive change report

**Next**: Execute Phase A (Type Consolidation) when ready.
