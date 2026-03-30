# Hands-On: Migrate useCommunityData to React Query

## Before You Start

1. **Understand the current hook** → Read [src/caracteristicas/community/hooks/useCommunityData.ts](#)
2. **Know what changed** → Read REACT_QUERY_MIGRATION_GUIDE.md (especially "Before vs After" and "Available Query Hooks")
3. **Have build clean** → `npm run build` (should pass)

---

## Step 1: Understand What useCommunityData Does Now

Current file structure:
```
src/caracteristicas/community/hooks/useCommunityData.ts (414 lines)
├── useState: campanas, cuentas, planes, promociones, proveedores, zonas
├── useState: loading, error, selectedEntities
├── useCallback: ~12 functions (fetchCampanas, createCampaign, updatePlan, etc.)
└── useEffect: fetch on mount
```

**Try this**:
```bash
# Get loc count
(echo; echo "=== Current useCommunityData ==="; wc -l src/caracteristicas/community/hooks/useCommunityData.ts) | tail -1
```

---

## Step 2: Choose Migration Strategy

### Strategy A: Keep Wrapper, Replace Internals (RECOMMENDED)
✅ NO component changes needed
✅ Old hooks still work
✅ Can migrate other hooks first
❌ Slightly more code

```typescript
// What you'll change:
export function useCommunityData() {
  // Before: 50+ useState + useEffect calls
  // After: 1-2 useQueryHook calls

  const campaigns = useLeadsCampaignsQuery();
  const plans = useLeadsPlansQuery();
  // ...

  return {
    campanas: campaigns.data,
    loading: campaigns.isPending,
    // Map old prop names to new query props
  };
}
```

---

### Strategy B: Replace Hook Usage (ADVANCED)
✅ Cleaner code
✅ Less indirection
❌ Must update ALL components that use useCommunityData
❌ Higher risk of breaking changes

```typescript
// You'd change every component:
// Before
const { campanas, loading } = useCommunityData();

// After
const { data: campanas, isPending: loading } = useLeadsCampaignsQuery();
```

---

## Step 3: Implement Strategy A (Recommended)

### 3.1 - Backup current version (optional but smart)

```bash
# Create backup
cp src/caracteristicas/community/hooks/useCommunityData.ts src/caracteristicas/community/hooks/useCommunityData.ts.backup
```

### 3.2 - Update the hook

The new version should look like:

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
  useLeadsCampaignUpdateMutation,
  useLeadsCampaignDeleteMutation,
  // ... import OTHER mutations
} from '@shared/api/queries';

interface SelectedEntities {
  entityType?: string;
  entityId?: string;
}

export function useCommunityData() {
  // Local state only (UI-specific, not data)
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntities>({});

  // Data queries (automatic caching + refetch)
  const campaigns = useLeadsCampaignsQuery();
  const accounts = useLeadsAccountsQuery();
  const plans = useLeadsPlansQuery();
  const promotions = useLeadsPromotionsQuery();
  const providers = useLeadsProvidersQuery();
  const zones = useLeadsZonesQuery();

  // Mutations
  const createCampaignMutation = useLeadsCampaignCreateMutation();
  const updateCampaignMutation = useLeadsCampaignUpdateMutation();
  const deleteCampaignMutation = useLeadsCampaignDeleteMutation();
  // ... import more mutations if needed

  // NEW: Simplified handlers (no try-catch needed, mutation handles errors)
  const createCampaign = async (data: CampanaRequest) => {
    await createCampaignMutation.mutateAsync(data);
  };

  const updateCampaign = async (id: string, data: CampanaRequest) => {
    await updateCampaignMutation.mutateAsync({ id, ...data });
  };

  const deleteCampaign = async (id: string) => {
    await deleteCampaignMutation.mutateAsync(id);
  };

  // Determine overall loading state
  const isLoading = 
    campaigns.isPending ||
    accounts.isPending ||
    plans.isPending ||
    promotions.isPending ||
    providers.isPending ||
    zones.isPending;

  // Determine if any mutation is in flight
  const isMutating =
    createCampaignMutation.isPending ||
    updateCampaignMutation.isPending ||
    deleteCampaignMutation.isPending;

  return {
    // Data entities
    campanas: campaigns.data ?? [],
    cuentas: accounts.data ?? [],
    planes: plans.data ?? [],
    promociones: promotions.data ?? [],
    proveedores: providers.data ?? [],
    zonas: zones.data ?? [],

    // Loading states
    loading: isLoading,
    isMutating,

    // Error states
    error:
      campaigns.error?.message ||
      accounts.error?.message ||
      plans.error?.message,

    // Handlers
    createCampaign,
    updateCampaign,
    deleteCampaign,
    // ... add more handlers as needed

    // UI state
    selectedEntities,
    setSelectedEntities,

    // Refetch manually if needed
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

### 3.3 - Test that old components still work

The hook now returns the same props, so existing components should work unchanged:

```bash
npm run build  # Should see 0 errors
```

---

## Step 4: Test Individual Queries

### 4.1 - Verify each query loads

Open browser dev tools → React Query DevTools tab (should show green checkmarks):

```
✓ campaigns - 3 items
✓ accounts - 5 items
✓ plans - 12 items
...
```

### 4.2 - Check stale behavior

1. Open campaign list
2. Wait 5 minutes (or set staleTime: 0 for testing)
3. Refresh page
4. Should NOT call API again (cached data shows immediately)
5. After 10 min, cache is cleared

---

## Step 5: Update Components Incrementally (Optional)

Once hook works, you can update individual components to use queries directly:

### Before (Using Old Hook)
```typescript
export function CampaignsList() {
  const { campanas, loading, createCampaign } = useCommunityData();

  return (
    <div>
      {loading && <Spinner />}
      {campanas.map(c => <Campaign key={c.id} {...c} />)}
    </div>
  );
}
```

### After (Direct Query)
```typescript
import { useLeadsCampaignsQuery, useLeadsCampaignCreateMutation } from '@shared/api/queries';

export function CampaignsList() {
  const { data: campanas, isPending } = useLeadsCampaignsQuery();
  const createMutation = useLeadsCampaignCreateMutation();

  return (
    <div>
      {isPending && <Spinner />}
      {(campanas ?? []).map(c => <Campaign key={c.id} {...c} />)}
    </div>
  );
}
```

**DO THIS CAREFULLY**: Only update components one at a time and test each.

---

## Step 6: Verify Everything Works

### 6.1 - Build passes
```bash
npm run build
```

### 6.2 - No runtime errors
```bash
npm run dev
# Open browser console - should see 0 errors
```

### 6.3 - Data loads correctly
```bash
# Manually test each feature:
1. Go to Leads/Campaigns page
2. Should see data (no white screen)
3. Create new campaign
4. Should update automatically
5. Delete campaign
6. Should remove from list
```

### 6.4 - Check React Query DevTools

Click "DevTools" button in bottom-right corner:

```
Queries:
  campaigns       [✓ Idle, 10 items]
  accounts        [✓ Idle, 5 items]
  plans           [✓ Idle, 20 items]
  promotions      [✓ Idle, 8 items]
  providers       [✓ Idle, 12 items]
  zones           [✓ Idle, 15 items]

Mutations:
  Campaign Create [✓ Idle]
  Campaign Update [✓ Idle]
```

---

## Step 7: Commit Changes

```bash
# Stage changes
git add src/caracteristicas/community/hooks/useCommunityData.ts

# Commit with clear message
git commit -m "refactor(community): migrate useCommunityData to React Query

- Replace 50+ useState calls with useLeadsQueries
- Remove manual fetch logic (now handled by React Query)
- Maintain backward compatibility (same exported props)
- Automatic caching with 5min stale time
- Build: 2.14s, 0 errors, no size regression
- Tests: Manual verification passed"

# Optional: Push
git push origin feature/react-query-migration
```

---

## Troubleshooting

### Problem: "Cannot find module @shared/api/queries"

**Solution**: Check tsconfig.json has:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

### Problem: Mutations not updating UI

**Check**: Is mutation success updating the query cache?

```typescript
// Good (mutation auto-invalidates on success)
const mutation = useLeadsCampaignCreateMutation();

// Your data should update immediately
```

If not, manually invalidate:

```typescript
const queryClient = useQueryClient();

const createCampaign = async (data) => {
  await createMutation.mutateAsync(data);
  // Manual invalidate if auto-update doesn't work
  await queryClient.invalidateQueries({
    queryKey: leadsQueryKeys.all(),
  });
};
```

### Problem: Too many refetches

**Check**: staleTime is 5 minutes by default. If queries refetch on mount:

```typescript
// In src/app/providers/ProveedorQuery.tsx, check:
const defaultOptions = {
  queries: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,    // 10 minutes  
  }
};
```

If you need longer: create custom query options:

```typescript
export const leadsQueryOptions = {
  queries: {
    staleTime: 1000 * 60 * 30, // 30 minutes (not 5)
  }
};
```

---

## What's Next?

Once useCommunityData works:

1. ✅ useCommunityData → Done!
2. 🔄 useEmployeesSync → Similar refactor (~50 lines)
3. 🔄 useApplicantsSync → Similar refactor (~50 lines)
4. 🔄 useLeadAsesorVentas → More complex (multiple mutations)
5. 🔄 Other HIGH priority hooks

Each should take 15-30 min.

---

## Reference: Query Hook Signatures

```typescript
// All queries return:
{
  data?: T[],              // Loaded data
  error?: ApiError,        // Error if fetch failed
  isLoading: boolean,      // First load (no data yet)
  isPending: boolean,      // Loading (might have stale data)
  isFetching: boolean,     // Background fetch in progress
  isError: boolean,        // Error occurred
  isSuccess: boolean,      // Data loaded successfully
  refetch: () => Promise,  // Manual refetch
  status: 'pending' | 'error' | 'success',
}

// All mutations return:
{
  data?: T,                // Response data
  error?: ApiError,        // Error if mutation failed
  isPending: boolean,      // In progress
  isError: boolean,        // Error occurred
  isSuccess: boolean,      // Success
  mutate: (input) => void,           // Fire mutation (async)
  mutateAsync: (input) => Promise,   // Fire mutation (promise)
  reset: () => void,       // Clear mutation state
  status: 'idle' | 'pending' | 'error' | 'success',
}
```

