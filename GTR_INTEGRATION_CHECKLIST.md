# GTR Integration Checklist

## ✅ Status: Build SUCCESS (0 errors in 2.32s)

---

## 📋 Pre-Integration Checklist

Componentes creados y validados - Listos para integración en la página principal.

### ✅ Completed Tasks

- [x] **Domain Types** (`entidades/lead/types.ts`)
  - LeadIntakeRequest, LeadGtrResponse, LeadAsesorVentasResponse
  - PermisosGTR interface (15 permission flags)
  - EstadoSeguimiento enum

- [x] **Repository Layer** (`caracteristicas/gtr/model/gtr.repo.ts`)
  - GtrRepository class with 10 methods
  - All endpoints mapped: POST, PATCH, GET
  - Error handling and retry logic

- [x] **React Query Hooks** (`caracteristicas/gtr/hooks/useGtrQueries.ts`)
  - 9 custom hooks (queries + mutations)
  - Proper cache invalidation strategy
  - Query keys pattern

- [x] **UI Components** (`caracteristicas/gtr/ui/`)
  - AltaLead (form to create lead)
  - AsignacionLead (assign to asesor)
  - TablaLeadsGTR (supervisor dashboard)
  - TablaLeadsAsesorVentas (asesor personal bandeja)

- [x] **Shared UI Components** (`shared/ui/`)
  - FormInput, FormSelect, Alert, Spinner, Badge, Button, TextArea
  - CSS Modules with responsive design
  - Accessibility attributes (ARIA)

- [x] **CSS Styling** (7 CSS Module files)
  - Responsive breakpoints (640px, 768px, 1024px)
  - Mobile-first design
  - No conflicts

- [x] **Build Validation**
  - TypeScript: 0 errors, 0 warnings
  - Vite: Success in 2.32s
  - Bundle size: 308.04 kB (gzip: 100.18 kB)
  - No import violations (FSD compliant)

---

## 🚀 Next Steps - Integration Phase

### Step 1: Create wrapper page component
**File:** `src/caracteristicas/gtr/pages/PaginaGTR.tsx`

- [ ] Import all GTR UI components
- [ ] Import React Query hooks
- [ ] Import permission types
- [ ] Create component state for:
  - `showAltaLead` (boolean - modal visibility)
  - `selectedLead` (LeadGtrResponse | null - for edit/assign)
  - `filtros` (filters for table)
- [ ] Render layout with:
  - Header with title
  - "New Lead" button (opens AltaLead modal)
  - Main TablaLeadsGTR
  - AsignacionLead modal (appears on reasignar click)
- [ ] Wire up callbacks:
  - onSuccess callbacks for mutations
  - onReasignarClick for table action
  - Filter changes

**Estimated time:** 1 hour

---

### Step 2: Add Modal Wrappers
**Files to create:**
- `src/caracteristicas/gtr/ui/AltaLeadModal.tsx`
- `src/caracteristicas/gtr/ui/AsignacionLeadModal.tsx`

- [ ] Wrap components in Modal dialog
- [ ] Add backdrop (semi-transparent overlay)
- [ ] Add close button (X button)
- [ ] Add animation (fade in/slide)
- [ ] Handle ESC key to close
- [ ] Style: Centered, responsive, z-index correct

**Estimated time:** 45 minutes

---

### Step 3: Wire up Event Handlers
**In PaginaGTR.tsx:**

- [ ] **Create Lead submission:**
  ```tsx
  const createMutation = useCreateLeadMutation();
  
  const handleCrearLead = async (formData: LeadIntakeRequest) => {
    try {
      await createMutation.mutateAsync(formData);
      setShowAltaLead(false);
      // Toast: "Lead creado exitosamente"
    } catch (error) {
      // Toast: "Error al crear lead"
    }
  };
  ```

- [ ] **Assign Lead submission:**
  ```tsx
  const assignMutation = useAssignLeadMutation();
  
  const handleAsignar = async (idAsesor: number) => {
    try {
      await assignMutation.mutateAsync({
        idLead: selectedLead.id,
        data: { idAsesorAsignado: idAsesor },
      });
      setSelectedLead(null);
      // Toast: "Lead reasignado"
    } catch (error) {
      // Handle error
    }
  };
  ```

- [ ] **Contact Lead:**
  ```tsx
  const contactMutation = useContactLeadMutation();
  
  const handleContactar = async (idLead: number) => {
    try {
      await contactMutation.mutateAsync({ idLead });
      // Toast: "Contacto registrado"
    } catch (error) {
      // Handle error
    }
  };
  ```

**Estimated time:** 1 hour

---

### Step 4: Add Toast Notifications
**Library:** React Toastify (if available) or custom Alert

- [ ] Success toast for:
  - Lead creado
  - Lead asignado
  - Contacto registrado
  - Tipificación exitosa
- [ ] Error toast for:
  - Network errors
  - Permission errors
  - Validation errors
- [ ] Warning toast for:
  - Permission denied (at top of component)

**Estimated time:** 30 minutes

---

### Step 5: Add Confirmation Dialogs
**For destructive actions:**

- [ ] **Before Assign:** "¿Reasignar lead a nuevo asesor?"
- [ ] **Before Contact:** "¿Marcar como contactado?"
- [ ] **Before Typify:** "¿Guardar tipificación?"

Use simple modal with Cancel/Confirm buttons.

**Estimated time:** 45 minutes

---

### Step 6: Permission Testing
**In browser DevTools or via mock user:**

- [ ] Test with user having:
  - `CREATE_LEADS: true` → AltaLead visible
  - `ASSIGN_LEADS: true` → Reasignar button visible
  - `CONTACT_LEADS: true` → Contactar button visible
  - `TYPIFY_LEADS: true` → Tipificar button visible

- [ ] Test with user having:
  - `CREATE_LEADS: false` → AltaLead shows "No permission" alert
  - All false → TablaLeadsGTR shows "No permission"

**Estimated time:** 30 minutes

---

### Step 7: Add Loading/Error States
**In tables and forms:**

- [ ] Show Spinner while loading data
- [ ] Show error message if query fails
- [ ] Disable buttons during mutation
- [ ] Show loading state on buttons (isLoading prop)
- [ ] Retry button for failed queries

**Estimated time:** 30 minutes

---

### Step 8: Testing
**Unit tests for:**

- [ ] Form validation (correct/incorrect inputs)
- [ ] Permission gating (button disabled without permission)
- [ ] API error handling (show error message)
- [ ] Query hooks (cache/refetch behavior)
- [ ] Mutations (success/error callbacks)

**Component tests for:**

- [ ] AltaLead form submission
- [ ] TablaLeadsGTR sorting/filtering
- [ ] AsignacionLead selection

**Estimated time:** 2-3 hours

---

### Step 9: Documentation & Comments
**Add to components:**

- [ ] JSDoc comments for component props
- [ ] Comments explaining permission checks
- [ ] Comments for complex logic (mutations, cache invalidation)
- [ ] README with usage examples

**Estimated time:** 1 hour

---

### Step 10: Performance Optimization
**Optional but recommended:**

- [ ] Memoize components (React.memo) for tables if many rows
- [ ] Lazy load TablaLeadsGTR using React.lazy
- [ ] Add pagination to avoid loading all leads at once
- [ ] Profile bundle with Vite analyzer

**Estimated time:** 1 hour

---

## 📊 Estimated Effort

| Task | Hours | Priority |
|------|-------|----------|
| 1. Wrapper page | 1h | **CRITICAL** |
| 2. Modal wrappers | 0.75h | HIGH |
| 3. Event handlers | 1h | **CRITICAL** |
| 4. Toast notifications | 0.5h | HIGH |
| 5. Confirmation dialogs | 0.75h | MEDIUM |
| 6. Permission testing | 0.5h | **CRITICAL** |
| 7. Loading/error states | 0.5h | MEDIUM |
| 8. Testing | 2-3h | MEDIUM |
| 9. Documentation | 1h | LOW |
| 10. Performance | 1h | LOW |
| **TOTAL** | **8.5-9.5h** | **~1 day** |

**Quick path (Critical only):** 3.5-4 hours
**Recommended (Critical + High):** 6-7 hours

---

## 🔗 File References

### Created Files
- [GTR_COMPONENTS_GUIDE.md](GTR_COMPONENTS_GUIDE.md) - Full documentation

### Component Files (Ready to use)
- `src/caracteristicas/gtr/ui/AltaLead.tsx`
- `src/caracteristicas/gtr/ui/AsignacionLead.tsx`
- `src/caracteristicas/gtr/ui/TablaLeadsGTR.tsx`
- `src/caracteristicas/gtr/ui/TablaLeadsAsesorVentas.tsx`

### Hook Files (Ready to use)
- `src/caracteristicas/gtr/hooks/useGtrQueries.ts`

### Type Files (Ready to use)
- `src/entidades/lead/types.ts`
- `src/caracteristicas/gtr/model/gtr.repo.ts`

---

## ✨ Quality Metrics

- **TypeScript Strict Mode:** ✅ Passing
- **Build Time:** ✅ 2.32s (acceptable)
- **Bundle Size:** ✅ No regression
- **Import violations:** ✅ 0 (FSD compliant)
- **Code coverage:** ☐ Pending (add tests)
- **Accessibility:** ✅ ARIA attributes included
- **Responsive:** ✅ Tested at 3+ breakpoints

---

## 🧠 Key Decisions Made

1. **Singleton Repository:** Instantiate `GtrRepository` once to avoid duplicates
2. **Permission Gating:** Check at component level (don't render) not just disable button
3. **React Query Cache:** 5-minute stale time, auto-invalidation on mutations
4. **CSS Modules:** Scoped styles prevent namespace collision
5. **Barrel Exports:** Enforce FSD layer boundaries
6. **Error Messages:** User-friendly and actionable

---

## 🎯 Success Criteria

Before consider "Integration Phase" complete:

- [ ] PaginaGTR renders all 4 components
- [ ] All forms submit successfully to backend
- [ ] All table queries load data correctly
- [ ] Permissions are enforced on all actions
- [ ] Error messages display when API fails
- [ ] User can create, assign, typify, contact leads
- [ ] Build passes: 0 errors, 0 warnings
- [ ] No console warnings (except React devtools)
- [ ] Responsive works on mobile/tablet/desktop
- [ ] Toast/alerts appear for success/error

---

## 📞 Quick Reference

**Import all GTR components:**
```tsx
import {
  AltaLead,
  AsignacionLead,
  TablaLeadsGTR,
  TablaLeadsAsesorVentas,
} from '@caracteristicas/gtr/ui';
```

**Import all hooks:**
```tsx
import {
  useLeadsGTR,
  useLeadsAsesorVentas,
  useCreateLeadMutation,
  useAssignLeadMutation,
  useTypifyLeadMutation,
  useContactLeadMutation,
} from '@caracteristicas/gtr/hooks';
```

**Permission check:**
```tsx
if (!permisos.CREATE_LEADS) {
  return <Alert type="warning" message="No tienes permiso" />;
}
```

---

## 🚨 Common Issues & Fixes

**Issue:** Build fails with "Module not found"
**Fix:** Check `/src/caracteristicas/gtr/index.ts` exports

**Issue:** Table doesn't load data
**Fix:** Verify `leadsHttp` client is authenticated (JWT token in Authorization header)

**Issue:** Permissions not working
**Fix:** Ensure user object has `permisos: PermisosGTR` property

**Issue:** React Query not refetching after mutation
**Fix:** Check cache invalidation in useGtrQueries.ts hooks

---

## 📝 Next Action

👉 **Recommended first step:** Create wrapper page component (Step 1)

Once `PaginaGTR.tsx` wraps components, run: `npm run dev` and test in browser at dev-role-switcher.

---

**Last updated:** 2026-03-25
**Build version:** 1.0.0 (GTR Phase 3)
**Status:** ✅ READY FOR INTEGRATION
