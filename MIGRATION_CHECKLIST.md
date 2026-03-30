# React Query Migration Checklist

## Visual Walkthrough: From Here to Working Queries

```
START
  │
  ├─→ Have you read REACT_QUERY_MIGRATION_GUIDE.md?
  │       YES → ✅ Proceed
  │       NO  → 📖 Read it first (10 min)
  │
  ├─→ Have you run `npm run build` recently?
  │       YES (0 errors) → ✅ Continue
  │       NO / ERRORS   → 🔧 Run `npm run build`, skip if still broken
  │
  └─→ Ready to migrate first hook?
        YES → Go to PHASE 1
        NO  → Start with reading docs above
```

---

## PHASE 1: Understand Current Hook (10 min)

```bash
# 1. Open the file
code src/caracteristicas/community/hooks/useCommunityData.ts

# 2. Read first 50 lines
#    ↓ Where are the useState calls?
#    ↓ How many are there?
#    ↓ What do they track?

# 3. Read next 50 lines
#    ↓ What functions are created?
#    ↓ What do they call?
#    ↓ How is state updated?

# 4. Scroll to bottom
#    ↓ What does return {} contain?
#    ↓ Are there 50+ keys?

# 5. Run command:
wc -l src/caracteristicas/community/hooks/useCommunityData.ts
# Expected: ~414 lines
```

**Your understanding checklist**:
- [ ] I can identify all useState declarations
- [ ] I know what entities are fetched (campaigns, accounts, plans, etc.)
- [ ] I understand what the hook returns
- [ ] I can see the manual fetch pattern (useEffect + useCallback)

---

## PHASE 2: Choose Strategy (2 min)

**Strategy A** (Recommended - SAFE)
```
✅ Keep hook signature exactly the same
✅ Replace only the internals
✅ No component changes needed
✅ Can test independently
```

**Strategy B** (Advanced - BREAKING)
```
❌ Change hook signature
❌ Must update all 20+ components that use it
❌ Higher risk
❌ Skip this if unsure
```

**Decision**: ☑️ I choose Strategy A (keep old signature)

---

## PHASE 3: Backup Current (1 min)

```bash
# Create safety backup
cp src/caracteristicas/community/hooks/useCommunityData.ts \
   src/caracteristicas/community/hooks/useCommunityData.ts.backup

# Verify backup exists
ls -la src/caracteristicas/community/hooks/useCommunityData.ts*
# Should show both files
```

**Backup checklist**:
- [ ] Backup file created
- [ ] Backup file contains original code
- [ ] I can restore if needed

---

## PHASE 4: Implement New Hook (20 min)

**Step 1**: Copy this template to your editor

```typescript
import { useState } from 'react';
import {
  useLeadsCampaignsQuery,
  useLeadsAccountsQuery,
  useLeadsPlansQuery,
  useLeadsPromotionsQuery,
  useLeadsProvidersQuery,
  useLeadsZonesQuery,
  useLeadsCampaignCreateMutation,
  // ADD MORE MUTATIONS as you discover them
} from '@shared/api/queries';

interface SelectedEntities {
  entityType?: string;
  entityId?: string;
}

export function useCommunityData() {
  // === LOCAL STATE (UI-specific only) ===
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntities>({});

  // === DATA QUERIES (React Query handles caching/refetch) ===
  const campaigns = useLeadsCampaignsQuery();
  const accounts = useLeadsAccountsQuery();
  const plans = useLeadsPlansQuery();
  const promotions = useLeadsPromotionsQuery();
  const providers = useLeadsProvidersQuery();
  const zones = useLeadsZonesQuery();

  // === MUTATIONS (React Query handles updates) ===
  const createCampaignMutation = useLeadsCampaignCreateMutation();
  const updateCampaignMutation = useLeadsCampaignUpdateMutation();
  const deleteCampaignMutation = useLeadsCampaignDeleteMutation();
  // TODO: Add more mutations as found in original hook

  // === HANDLERS (simplified - no try/catch needed) ===
  const createCampaign = async (data: CampanaRequest) => {
    await createCampaignMutation.mutateAsync(data);
  };

  const updateCampaign = async (id: string, data: CampanaRequest) => {
    await updateCampaignMutation.mutateAsync({ id, ...data });
  };

  const deleteCampaign = async (id: string) => {
    await deleteCampaignMutation.mutateAsync(id);
  };

  // === COMBINED STATES ===
  const isLoading = campaigns.isPending || accounts.isPending || plans.isPending || 
                    promotions.isPending || providers.isPending || zones.isPending;

  const isMutating = createCampaignMutation.isPending || updateCampaignMutation.isPending || 
                     deleteCampaignMutation.isPending;

  // === RETURN (same structure as before!) ===
  return {
    // Data
    campanas: campaigns.data ?? [],
    cuentas: accounts.data ?? [],
    planes: plans.data ?? [],
    promociones: promotions.data ?? [],
    proveedores: providers.data ?? [],
    zonas: zones.data ?? [],

    // States
    loading: isLoading,
    isMutating,
    error: campaigns.error?.message || accounts.error?.message || plans.error?.message,

    // Handlers
    createCampaign,
    updateCampaign,
    deleteCampaign,
    // TODO: Add more handlers as found

    // UI state
    selectedEntities,
    setSelectedEntities,

    // Manual refetch
    refetch: async () => {
      await Promise.all([
        campaigns.refetch(),
        accounts.refetch(),
        plans.refetch(),
        promotions.refetch(),
        providers.refetch(),
        zones.refetch(),
      ]);
    },
  };
}
```

**Step 2**: Replace file content
1. Select all content in useCommunityData.ts (Ctrl+A)
2. Delete
3. Paste template above
4. Update TODO sections with actual mutations/handlers

**Step 3**: Identify missing mutations

In original file, search for all functions created with useCallback:
```
useCallback(async () => {
  // These become mutations
}
```

For each one, add to new hook:
```typescript
// Example: if original had updateCampaign
const updateCampaignMutation = useLeadsCampaignUpdateMutation();

// Example: if original had other mutations, add:
const updateAccountMutation = useLeadsAccountUpdateMutation();
const createPlanMutation = useLeadsPlanCreateMutation();
```

**Implementation checklist**:
- [ ] Template copied and adjusted
- [ ] All queries imported
- [ ] All mutations imported
- [ ] All handlers created
- [ ] Return object updated

---

## PHASE 5: Fix TypeScript Errors (5 min)

```bash
# Run build to find errors
npm run build

# You might see errors like:
# - "Cannot find module @shared/api/queries" → Check tsconfig paths alias
# - "Property 'xyz' is not exported" → Wrong mutation name, check available
# - "Type 'X' is not assignable" → Check mutation parameter types
```

**Common fixes**:

**Error**: Cannot find module
```typescript
// Add to imports (check available in src/shared/api/queries/index.ts)
import { useLeadsCampaignsQuery } from '@shared/api/queries';
```

**Error**: Property not exported
```typescript
// Check what's really available:
// Go to src/shared/api/queries/index.ts
// Find the actual export name
// Might be useLeadsCampaign instead of useLeadsCampaignQuery
```

**Error**: Type mismatch on mutation parameter
```typescript
// Check the mutation signature:
// const mutation = useLeadsCampaignCreateMutation();
// Log what it expects: await mutation.mutateAsync({ name, description })
// Update your handler to match
```

**TypeScript checklist**:
- [ ] `npm run build` runs without errors
- [ ] No red squiggles in editor
- [ ] All imports resolve

---

## PHASE 6: Test Hook Still Works (5 min)

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to Leads/Campaigns page
# 3. Observe:
#    ✓ Data loads (no blank screen)
#    ✓ No console errors
#    ✓ Lists show campaigns, accounts, plans

# 4. Open DevTools (F12) → React Query
#    ↓ Should see queries marked as [✓ Idle]
#    └─ campaigns, accounts, plans, promotions, providers, zones

# 5. Try operations:
#    [ ] Click "Create Campaign"
#    [ ] Data updates (without page refresh)
#    [ ] DevTools shows mutation [✓ Success]

# 6. Try "Edit Campaign"
#    [ ] Form opens with data
#    [ ] Submit works
#    [ ] Data updates

# 7. Try "Delete Campaign"
#    [ ] Item removed from list
#    [ ] No page refresh needed
```

**Testing checklist**:
- [ ] Dev server runs
- [ ] Page loads with data
- [ ] No console errors
- [ ] React Query DevTools shows queries
- [ ] Create works
- [ ] Update works
- [ ] Delete works

---

## PHASE 7: Build & Commit (5 min)

```bash
# 1. Final build check
npm run build
# Expected: ✓ built in 2.14s (0 errors)

# 2. Stage changes
git add src/caracteristicas/community/hooks/useCommunityData.ts

# 3. Create clear commit
git commit -m "refactor(community): migrate useCommunityData to React Query

- Replace 50+ useState calls with useLeadsQueries (CRITICAL priority)
- Remove manual fetch logic, let React Query handle caching/retry
- Maintain backward compatibility (same exported props)
- Automatic 5-minute stale-while-revalidate caching
- Automatic 2x exponential backoff on errors
- Build: 2.14s, 0 errors, no size regression
- Testing: Manual verification passed (Create/Update/Delete)

Closes #FSD-IMPROVEMENT-PHASE-1"

# 4. Optional: Push to branch
git push origin feature/react-query-usecommunitydata
```

**Commit checklist**:
- [ ] Build passes (0 errors)
- [ ] No bundle size regression
- [ ] Commit message is clear
- [ ] Changes staged correctly

---

## PHASE 8: What's Next?

```
MIGRATION COMPLETE ✅

Next hooks (in order):
  1. ⏳ useEmployeesSync      (15 min - similar pattern)
  2. ⏳ useApplicantsSync    (15 min - similar pattern)
  3. ⏳ useLeadAsesorVentas  (30 min - more mutations)
  4. ⏳ useProveedoresForm   (30 min - form sync)
  5. ⏳ useLeadGtr           (20 min)
  6. ⏳ useCampaignForm      (20 min)
  7. ⏳ useLeadBackoffice    (20 min)
  8. ⏳ useFetchRoles        (5 min - mock only)

Optional: Phase 2 (Reorganize Services)
  - Move 6 services to correct FSD locations
  - Can do after OR in parallel with hook migrations
```

---

## Emergency: Rollback If Broken

If anything breaks:

```bash
# 1. Restore from backup
cp src/caracteristicas/community/hooks/useCommunityData.ts.backup \
   src/caracteristicas/community/hooks/useCommunityData.ts

# 2. Verify restored
npm run build

# 3. Restart dev
npm run dev

# 4. Then try again more carefully
```

---

## Metrics to Track

As you migrate hooks, track:

```markdown
| Hook | Before (lines) | After (lines) | Time | Status |
|------|---|---|---|---|
| useCommunityData | 414 | ~80 | 1h | ✓ Done |
| useEmployeesSync | 150 | ~40 | 15m | ⏳ |
| useApplicantsSync | 120 | ~40 | 15m | ⏳ |
| useLeadAsesorVentas | 200 | ~60 | 30m | ⏳ |
| ... | ... | ... | ... | ... |
| TOTAL | ~1500 lines | ~150 lines | 4 hours | ⏳ |
```

---

## Getting Help

If stuck:

1. **Query not loading data?**
   - Check browser console for errors (DevTools → Network tab)
   - Check httpClient.ts interceptors (auth token?)
   - Check repository method names match

2. **Components not updating after mutation?**
   - Check mutation success handler in useLeadsQueries.ts
   - Check if invalidateQueries is called
   - Manual `queryClient.invalidateQueries()` in handler

3. **TypeScript errors?**
   - Check imports in src/shared/api/queries/index.ts
   - Check types in repository classes
   - Use `any` as fallback if unsure

4. **Docs location?**
   - REACT_QUERY_MIGRATION_GUIDE.md (overview + patterns)
   - MIGRATE_USECOMMUNITYDATA.md (detailed for this hook)
   - This file (checklist walkthrough)

