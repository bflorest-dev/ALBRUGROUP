# React Query Quick Reference (Cheatsheet)

## Copy-Paste Snippets

### Snippet 1: Import All Available Queries & Mutations

```typescript
import {
  // Leads queries
  useLeadsCampaignsQuery,
  useLeadsAccountsQuery,
  useLeadsPlansQuery,
  useLeadsPromotionsQuery,
  useLeadsProvidersQuery,
  useLeadsZonesQuery,
  useAllLeadsData, // Convenience: all 6 at once
  
  // Leads mutations
  useLeadsCampaignCreateMutation,
  useLeadsCampaignUpdateMutation,
  useLeadsCampaignDeleteMutation,
  useLeadsAccountCreateMutation,
  useLeadsAccountDeleteMutation,
  useLeadsPlanCreateMutation,
  useLeadsPlanUpdateMutation,
  useLeadsPlanDeleteMutation,
  useLeadsPromotionCreateMutation,
  useLeadsPromotionDeleteMutation,
  useLeadsProviderCreateMutation,
  useLeadsZoneCreateMutation,
  useLeadsZoneUpdateMutation,
  useLeadsZoneDeleteMutation,
  
  // Employees queries
  useEmployeesQuery,
  useEmployeeByDocumentQuery,
  
  // Applicants queries
  useApplicantsByStageQuery,
  useApplicantsRecruitmentQuery,
  useApplicantsTrainingQuery,
} from '@shared/api/queries';
```

---

### Snippet 2: Replace Manual Fetch in Component

**Before**:
```typescript
export function MyCampaignList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    LeadsRepository.getCampanas()
      .then(setData)
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {loading && <Spinner />}
      {data.map(item => <Item key={item.id} {...item} />)}
    </div>
  );
}
```

**After**:
```typescript
export function MyCampaignList() {
  const { data = [], isPending } = useLeadsCampaignsQuery();

  return (
    <div>
      {isPending && <Spinner />}
      {data.map(item => <Item key={item.id} {...item} />)}
    </div>
  );
}
```

---

### Snippet 3: Simplify Hook with Manual Fetch to Query Hook

**Before**:
```typescript
export function useMyData() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LeadsRepository.getCampanas();
      setCampaigns(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { campaigns, loading, error, refetch: fetch };
}
```

**After**:
```typescript
export function useMyData() {
  const { data: campaigns = [], isPending: loading, error } = useLeadsCampaignsQuery();
  return { campaigns, loading, error, refetch };
}
```

---

### Snippet 4: Create with Auto-Cache Update

**Before**:
```typescript
const handleCreate = async (data) => {
  setLoading(true);
  try {
    await LeadsRepository.createCampaign(data);
    // Must manually refetch or update state
    const updated = await LeadsRepository.getCampanas();
    setCampaigns(updated);
  } catch (err) {
    setError(err);
  }
};
```

**After**:
```typescript
const mutation = useLeadsCampaignCreateMutation();

const handleCreate = async (data) => {
  await mutation.mutateAsync(data);
  // Cache auto-updates! UI re-renders automatically
};
```

---

### Snippet 5: Mutation with Error Handling

```typescript
const createMutation = useLeadsCampaignCreateMutation();

return (
  <form onSubmit={(e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  }}>
    <input placeholder="Campaign name" />
    
    {createMutation.isPending && <Spinner />}
    {createMutation.isError && (
      <Alert>{createMutation.error?.message}</Alert>
    )}
    {createMutation.isSuccess && (
      <Alert type="success">Created!</Alert>
    )}
    
    <button disabled={createMutation.isPending}>
      Create
    </button>
  </form>
);
```

---

### Snippet 6: Multiple Queries in Parallel

**Before**:
```typescript
const [c, setCampaigns] = useState();
const [a, setAccounts] = useState();
const [p, setPlans] = useState();

useEffect(() => {
  Promise.all([
    LeadsRepository.getCampanas(),
    LeadsRepository.getAccounts(),
    LeadsRepository.getPlans(),
  ]).then(([c, a, p]) => {
    setCampaigns(c);
    setAccounts(a);
    setPlans(p);
  });
}, []);
```

**After**:
```typescript
const campaigns = useLeadsCampaignsQuery();
const accounts = useLeadsAccountsQuery();
const plans = useLeadsPlansQuery();

// Or convenience:
const { campaigns, accounts, plans } = useAllLeadsData();

const isLoading = campaigns.isPending || accounts.isPending || plans.isPending;
```

---

### Snippet 7: Refetch on Demand

```typescript
const { data, refetch } = useLeadsCampaignsQuery();

const handleRefresh = async () => {
  await refetch(); // Force immediate refetch
};

return (
  <div>
    <button onClick={handleRefresh}>🔄 Refresh</button>
    {data?.map(item => <Item key={item.id} {...item} />)}
  </div>
);
```

---

### Snippet 8: Conditional Query (Only Fetch if ID Provided)

```typescript
// useEmployeeByDocumentQuery only fetches if documento provided
const { data: employee } = useEmployeeByDocumentQuery(docNumber);

// With TypeScript:
const { data: employee, isPending } = useEmployeeByDocumentQuery(docNumber);

return (
  <div>
    {isPending && <Spinner />}
    {employee && <EmployeeCard {...employee} />}
  </div>
);
```

---

## Most Common Patterns

### Pattern 1: Simple List View
```typescript
const { data = [], isPending, error } = useLeadsCampaignsQuery();

if (isPending) return <Spinner />;
if (error) return <Error message={error.message} />;

return (
  <ul>
    {data.map(item => <li key={item.id}>{item.nombre}</li>)}
  </ul>
);
```

### Pattern 2: Create with Form
```typescript
const mutation = useLeadsCampaignCreateMutation();

const onSubmit = async (formData) => {
  await mutation.mutateAsync(formData);
  if (mutation.isSuccess) {
    form.reset();
    // Cache auto-updates, no manual refetch needed
  }
};
```

### Pattern 3: Edit with Optimistic Update
```typescript
const updateMutation = useLeadsCampaignUpdateMutation();

const handleSave = async (id, data) => {
  await updateMutation.mutateAsync({ id, ...data });
  // Frontend cache updated immediately
};
```

### Pattern 4: Delete with Confirmation
```typescript
const deleteMutation = useLeadsCampaignDeleteMutation();

const handleDelete = async (id) => {
  if (confirm('Really delete?')) {
    await deleteMutation.mutateAsync(id);
    // Item removed from cache automatically
  }
};
```

### Pattern 5: Bulk Load (All Leads Data)
```typescript
const {
  campaigns,
  accounts,
  plans,
  promotions,
  providers,
  zones,
  isLoading,
} = useAllLeadsData();

// All 6 entities loaded in parallel
// Updates UI only once (after all load)
```

---

## Debugging

### See Loaded Queries

**In Browser DevTools**:
- Click React Query button (bottom right)
- Shows all active queries + their cache status
- Click query → See data, staleTime, lastUpdatedAt

### Force Refetch

```typescript
const { refetch } = useLeadsCampaignsQuery();
await refetch(); // Ignores cache, fetches now
```

### Check if Data is Stale

```typescript
const { data, isStale } = useLeadsCampaignsQuery();

if (isStale) {
  // Data is older than staleTime (5 min by default)
  // Background refetch likely happening
}
```

### See Errors

```typescript
const { error, isError } = useLeadsCampaignsQuery();

if (isError) {
  console.log('Error:', error.message);
  console.log('Status:', error.status);
  console.log('Details:', error.details);
}
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Query not fetching | Check cache (might be fresh). Use `refetch()` or set `staleTime: 0` |
| Mutation not updating UI | Check query cache is being invalidated in mutation success callback |
| Too many refetches | Increase `staleTime` (default 5 min is good) or check retry logic |
| No data (blank page) | Check network tab for failed requests, verify JWT token |
| Type errors with mutation params | Check types in repository methods, might need `as YourType` |
| `Cannot find module` | Check tsconfig.json paths alias points to src/shared |

---

## Fast Command Reference

```bash
# Check available imports
head -20 src/shared/api/queries/index.ts

# See current queries in use (React Query DevTools)
# Press Ctrl+Shift+P → "React Query DevTools"

# Find what queries should exist
grep "export.*Query" src/shared/api/queries/*.ts

# Force rebuild after changes
rm -rf node_modules/.vite
npm run dev

# Test specific file
npm run build -- src/caracteristicas/community/hooks/useCommunityData.ts

# Check bundle size impact
npm run build 2>&1 | grep "dist/assets/index"
```

---

## When to Use What Query

| Need | Use |
|------|-----|
| All campaigns | `useLeadsCampaignsQuery()` |
| All employees | `useEmployeesQuery()` |
| Specific employee by doc | `useEmployeeByDocumentQuery(docNumber)` |
| Applicants by stage | `useApplicantsByStageQuery('RECLUTAMIENTO')` |
| All leads data at once | `useAllLeadsData()` |
| Create campaign | `useLeadsCampaignCreateMutation()` + `mutateAsync(data)` |
| Update campaign | `useLeadsCampaignUpdateMutation()` + `mutateAsync({ id, ...data })` |
| Delete campaign | `useLeadsCampaignDeleteMutation()` + `mutateAsync(id)` |

---

## File Locations CheatSheet

```
Your work:
  src/caracteristicas/community/hooks/useCommunityData.ts

Query hooks (already created):
  src/shared/api/queries/useLeadsQueries.ts
  src/shared/api/queries/useEmployeesQueries.ts
  src/shared/api/queries/useApplicantsQueries.ts
  src/shared/api/queries/index.ts

View all types:
  src/shared/types/backend.ts (or entities/*/types.ts)

View HTTP config:
  src/shared/api/httpClient.ts

View cache config:
  src/app/providers/ProveedorQuery.tsx

Docs:
  REACT_QUERY_MIGRATION_GUIDE.md (overview)
  MIGRATE_USECOMMUNITYDATA.md (step-by-step for first hook)
  MIGRATION_CHECKLIST.md (walkthrough phases)
  REACT_QUERY_CHEATSHEET.md (this file)
```

---

## Pro Tips

✅ **DO**:
- Keep queries in components (not deep in hooks)
- Use mutations for create/update/delete
- Let React Query handle retry (don't add yours)
- Use `useAllLeadsData()` when you need multiple leads entities
- Set `staleTime` high for stable data (10-30 min)

❌ **DON'T**:
- Don't duplicate query logic (use the exported hook)
- Don't add try-catch around mutations (use isError instead)
- Don't manually set cache (use invalidateQueries)
- Don't disable retry (2x exponential is good)
- Don't forget to import from `@shared/api/queries`

---

## Emergency Commands

```bash
# Everything broken? Start fresh:
npm run clean
npm install
npm run build

# If single file broken:
git checkout -- src/caracteristicas/community/hooks/useCommunityData.ts
npm run build

# Check what queries exist:
grep -r "export.*useLeads\|useEmployees\|useApplicants" src/shared/api/queries/

# See all imports FROM queries module:
grep -r "from '@shared/api/queries'" src/ | wc -l
```

---

**Last Updated**: Phase 3 Complete
**Build Status**: ✅ 2.14s, 0 errors, no regression

