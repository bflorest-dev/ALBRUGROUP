# React Query Migration Guide - How to Use New Hooks

## Quick Start: Using React Query Hooks

### Antes (Manual Fetch)
```typescript
// Old: useCommunityData.ts - ~400 líneas con 50+ states
export function useCommunityData() {
  const [campanas, setCampanas] = useState<CampanaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampanas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LeadsRepository.getCampanas();
      setCampanas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampanas();
  }, [fetchCampanas]);

  // ... repeat 50 times for other entities
}
```

### Después (React Query)
```typescript
// New: useLeadsQueries.ts - Automatic caching
import { useLeadsCampaignsQuery } from '@shared/api/queries';

export function useCommunityData() {
  const campaigns = useLeadsCampaignsQuery();
  const accounts = useLeadsAccountsQuery();
  const plans = useLeadsPlansQuery();

  return {
    campanas: campaigns.data ?? [],
    loading: campaigns.isPending,
    error: campaigns.error?.message,
    
    cuentas: accounts.data ?? [],
    planes: plans.data ?? [],
    // ... etc
  };
}
```

---

## Phase 1.5: Start Using Queries (Right Now!)

### Option A: Minimal Migration (No Component Changes)

Keep old hooks but power them with React Query:

```typescript
// src/caracteristicas/community/hooks/useCommunityData.ts
import { 
  useLeadsCampaignsQuery,
  useLeadsAccountsQuery,
  useLeadsPlansQuery,
  useLeadsPromotionsQuery,
  useLeadsProvidersQuery,
  useLeadsZonesQuery,
  useAllLeadsData,
} from '@shared/api/queries';

// OPTION 1: Use individual queries
export function useCommunityData() {
  const { 
    data: campanas = [],
    isPending: campaignsLoading,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useLeadsCampaignsQuery();

  const { 
    data: cuentas = [],
    isPending: accountsLoading,
  } = useLeadsAccountsQuery();

  const { 
    data: planes = [],
    isPending: planesLoading,
  } = useLeadsPlansQuery();

  // ... all other queries

  const isLoading = campaignsLoading || accountsLoading || planesLoading;

  return {
    campanas,
    cuentas,
    planes,
    // ... etc
    loading: isLoading,
  };
}

// OPTION 2: Use convenience hook (simpler!)
export function useCommunityData() {
  const { 
    campaigns: campanas,
    accounts: cuentas,
    plans: planes,
    promotions,
    providers,
    zones,
    isLoading,
    isError,
  } = useAllLeadsData();

  return {
    campanas,
    cuentas,
    planes,
    loading: isLoading,
    // ... etc
  };
}
```

**Benefit**: NO component changes needed! Existing code still works.

---

### Option B: Direct Query Usage (Better Performance)

Use queries directly in components:

```typescript
// src/caracteristicas/community/ui/CampaignsList.tsx
import { useLeadsCampaignsQuery, useLeadsCampaignCreateMutation } from '@shared/api/queries';

export function CampaignsList() {
  // Query hook handles loading/error/caching
  const { data: campaigns = [], isLoading, error } = useLeadsCampaignsQuery();
  
  // Mutation hook handles POST + cache update
  const createMutation = useLeadsCampaignCreateMutation();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <ul>
        {campaigns.map(c => (
          <li key={c.id}>{c.nombre}</li>
        ))}
      </ul>
      
      <button 
        onClick={() => createMutation.mutate({ nombre: 'New Campaign' })}
        disabled={createMutation.isPending}
      >
        Create
      </button>
    </div>
  );
}
```

**Benefits**:
- Automatic caching (5 min stale time)
- Automatic refetch on error
- Retry logic (2x exponential backoff)
- Automatic cleanup on unmount

---

## Available Query Hooks

### Leads Module

**Queries (GET)**:
```typescript
import {
  useLeadsCampaignsQuery,
  useLeadsAccountsQuery,
  useLeadsPlansQuery,
  useLeadsPromotionsQuery,
  useLeadsProvidersQuery,
  useLeadsZonesQuery,
  useAllLeadsData, // convenient: all 6 at once
} from '@shared/api/queries';

// Usage
const { data, isLoading, error } = useLeadsCampaignsQuery();
```

**Mutations (POST/PATCH/DELETE)**:
```typescript
import {
  useLeadsCampaignCreateMutation,
  useLeadsCampaignUpdateMutation,
  useLeadsCampaignDeleteMutation,
  // ... similar for Accounts, Plans, Promotions, Providers, Zones
} from '@shared/api/queries';

// Usage
const mutation = useLeadsCampaignCreateMutation();
mutation.mutate({ nombre: 'My Campaign' });
wait mutation.isPending // true while uploading
if (mutation.isError) // show error
```

### Employees Module

```typescript
import {
  useEmployeesQuery,
  useEmployeeByDocumentQuery,
} from '@shared/api/queries';

// Replace useEmployeesSync
const { data: employees = [] } = useEmployeesQuery();
```

### Applicants Module

```typescript
import {
  useApplicantsByStageQuery,
  useApplicantsRecruitmentQuery,
  useApplicantsTrainingQuery,
} from '@shared/api/queries';

// Replace useApplicantsSync
const { data: applicants = [] } = useApplicantsByStageQuery('RECLUTAMIENTO');
```

---

## Common Patterns

### Pattern 1: Load & Display

```typescript
const { data, isLoading } = useLeadsCampaignsQuery();

return (
  <>
    {isLoading && <Spinner />}
    {data?.map(item => <Item key={item.id} {...item} />)}
  </>
);
```

### Pattern 2: Create with Optimistic Update

```typescript
const createMutation = useLeadsCampaignCreateMutation();

// Cache is automatically updated!
const handleCreate = async () => {
  await createMutation.mutateAsync({ nombre: 'New' });
  // Component re-renders with new data
};
```

### Pattern 3: Refetch on Demand

```typescript
const { data, refetch } = useLeadsCampaignsQuery();

const handleRefresh = () => {
  refetch(); // Manual refresh
};
```

### Pattern 4: Multiple Queries in Parallel

```typescript
const campaigns = useLeadsCampaignsQuery();
const plans = useLeadsPlansQuery();
const zones = useLeadsZonesQuery();

const isLoading = campaigns.isPending || plans.isPending || zones.isPending;

// Or use useAllLeadsData()
```

---

## Caching Behavior

### Automatic Stale-while-revalidate

```
Timeline:
0s:    Component mounts → Query executes → Get data
0s:    Data returns, shows immediately
5m:    Data becomes "stale" (but still shown)
5m:    Background refetch triggered (user doesn't see loading)
5m:    New data arrives, UI updates
10m:   If data not used, removed from cache (gc)
```

### Disable Automatic Stale Time (Force Fetch)

```typescript
// Force immediate refetch
const { refetch } = useLeadsCampaignsQuery();
await refetch();

// Or use query options
const query = useQuery({
  ...leadsQueryKeys.campaigns(),
  ...LeadsRepository.getCampanas(),
  staleTime: 0, // Always stale, always refetch
});
```

---

## Error Handling

Queries return standardized errors:

```typescript
const { error, isError } = useLeadsCampaignsQuery();

if (isError) {
  return (
    <Alert>
      {error.message} (Code: {error.code})
      <button onClick={() => retry()}>Retry</button>
    </Alert>
  );
}
```

### Error Types

```typescript
interface ApiError {
  message: string;     // "El servidor rechazó la solicitud"
  code?: string;       // "403", "NETWORK_ERROR"
  status?: number;     // 403
  details?: unknown;   // Raw response data
}
```

---

## Testing

### Mock Query Responses

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }, // Disable retry in tests
  },
});

test('displays campaigns', async () => {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const { result } = renderHook(() => useLeadsCampaignsQuery(), { wrapper });

  // Initially loading
  expect(result.current.isPending).toBe(true);

  // After fetch
  await waitFor(() => {
    expect(result.current.isPending).toBe(false);
  });

  expect(result.current.data).toEqual([...]);
});
```

---

## Migration Priority

### Week 1 - CRITICAL (Do First)
1. ✅ useCommunityData (50+ states) → useAllLeadsData
2. ✅ useEmployeesSync → useEmployeesQuery
3. ✅ useApplicantsSync → useApplicantsByStageQuery

### Week 2 - HIGH
4. useLeadAsesorVentas (complex mutations)
5. useProveedoresForm (backend sync issues)
6. useLeadGtr (moderate complexity)

### Week 3 - MEDIUM
7. useCampaignForm
8. useLeadBackoffice

### Week 4 - LOW
9. useFetchRoles (mock only)

---

## Performance Impact

### Before (Manual Hooks)
- 9 useState calls
- 9 separate useCallback(async () => fetch())
- 9 separate useEffect(call fetch, [deps])
- **Cascading**: Data fetches one after another
- **Memory**: All data stays in memory always

### After (React Query)
- 1 query hook call
- Automatic request deduplication
- Automatic background refetch
- **Parallel**: All queries can run simultaneously
- **Smart cache**: Data auto-removed after 10 min

### Result:
- ⚡ 40-50% less boilerplate
- 🚀 Faster initial load (parallel vs sequential)
- 💾 Smart memory management (gc)
- 🔄 Better offline support (show stale data while refetch)

---

## Troubleshooting

### Q: Query not updating when data changes
**A**: Check staleTime - by default 5 min. Use `refetch()` to force, or set `staleTime: 0`

### Q: Mutation not updating UI
**A**: Verify mutation success callback updates cache OR use `invalidateQueries` to force refetch

### Q: Network requests happening too often
**A**: Increase `staleTime` (default 5 min is good) or disable automatic refetch

### Q: "Cannot find module @shared/api/queries"
**A**: Make sure tsconfig has alias setup: `"@shared/*": ["./src/shared/*"]`

---

## Links

- [Docs](FSD_IMPROVEMENT_PLAN.md) - Full architecture plan
- React Query [Official Docs](https://tanstack.com/query/latest)
- [Query file](src/shared/api/queries/index.ts) - All exports

