/* Proveedores Module Documentation

# 📚 PROVEEDORES ARQUITECTURA COMPLETA

## 1. ESTRUCTURA FSD

```
src/
├── entidades/
│   └── proveedor/                          ✅ Layer: Domain Models
│       ├── model/
│       │   └── proveedor.ts               (31 lines - Types)
│       │       - interface Proveedor
│       │       - interface CreateProveedorPayload
│       └── index.ts                       (barrel export)
│
├── shared/
│   └── services/
│       └── proveedorService.ts            ✅ Layer: Business Logic
│           (18 lines)
│           - fetchProveedores(): Promise<Proveedor[]>
│           - createProveedor(payload): Promise<Proveedor>
│
├── características/community/
│   ├── hooks/
│   │   └── useProveedoresForm.ts          ✅ Layer: State Management
│   │       (160+ lines)
│   │       - Form state: { nombre: string }
│   │       - Validation, error handling
│   │       - Submit with double-click prevention
│   │
│   └── ui/
│       ├── ProveedorForm.tsx              ✅ Layer: Presentation (Form)
│       │   (100 lines - Pure component, no hooks)
│       │   - Input fields, validation display
│       │   - Loading/disabled states
│       │
│       ├── ProveedoresList.tsx            ✅ Layer: Presentation (Table)
│       │   (140 lines - Pure component)
│       │   - Tabular display of proveedores
│       │   - Loading, error, empty states
│       │
│       ├── ProveedoresSection.tsx         ✅ Layer: Container/Integration
│       │   (35 lines - Combines Form + List)
│       │
│       └── (Already existed)
│           └── PaginaCommunity.tsx        ✅ Pages Layer
│               - Imports and renders ProveedoresSection
│               - Manages tabs/sections
│
```

## 2. DEPENDENCIA VISUAL

```
┌─────────────────────────────────────────┐
│   PaginaCommunity.tsx                   │ (Pages)
│   - Manages activeSection state         │
│   - Renders <ProveedoresSection />      │
└───────────────┬─────────────────────────┘
                │ (imports)
                ▼
┌─────────────────────────────────────────┐
│   ProveedoresSection.tsx                │ (Features/UI)
│   - Container component                 │
│   - Uses useProveedoresForm hook        │
│   - Renders Form + List                 │
└───────────────┬─────────────────────────┘
       ┌────────┴────────┐
       ▼                 ▼
  ┌─────────────┐  ┌──────────────┐
  │ Proveedor   │  │ Proveedores  │ (Features/UI)
  │ Form.tsx    │  │ List.tsx     │
  │             │  │              │
  │ Pure comp   │  │ Pure comp    │
  │ No Logic    │  │ No Logic     │
  └──────┬──────┘  └──────┬───────┘
         │                │
         └────────┬───────┘
                  │ (controlled via props)
                  ▼
┌─────────────────────────────────────────┐
│ useProveedoresForm Hook                 │ (Features/Hooks)
│ - Form state management                 │
│ - Validation logic                      │
│ - Submit handlers                       │
│ - Refetch logic                         │
└───────────────┬─────────────────────────┘
                │ (calls)
                ▼
┌─────────────────────────────────────────┐
│ proveedorService                        │ (Shared/Services)
│ - fetchProveedores()                    │
│ - createProveedor()                     │
└───────────────┬─────────────────────────┘
                │ (uses)
                ▼
┌─────────────────────────────────────────┐
│ leadsHttp (Axios client)                │ (Shared/API)
│ - baseURL: /api/leads                   │
│ - JWT interceptor                       │
│ - 30s timeout + auto-retry              │
│ - Error handling (401/403/500/etc)      │
└───────────────┬─────────────────────────┘
                │ (HTTP requests)
                ▼
┌─────────────────────────────────────────┐
│ Backend Endpoints                       │
│ - GET /leads/proveedores                │
│ - POST /leads/proveedores               │
└─────────────────────────────────────────┘
```

## 3. DATA FLOW: CREATE PROVEEDOR

```
USER INTERACTION
    │
    ├─ Input: nombre en campo de texto
    │   └─ triggerEvent: onChange
    │       └─ Handler: handleInputChange('nombre', value)
    │           └─ State Update: setFormState({ nombre: value })
    │               └─ UI Re-render: <ProveedorForm />
    │                   └─ Input shows new value
    │
    ├─ Click: Botón "Crear Proveedor"
    │   └─ triggerEvent: onClick
    │       └─ Handler: handleSubmit()
    │
    ▼ SUBMISSION FLOW
    
    1. validateForm()
       └─ Check: nombre.trim() !== ""
       └─ if invalid: setErrors({ nombre: "required" })
       └─ Return: false (stop)
    
    2. setSubmitting(true)
       └─ Disable button, show "⏳ Creando..."
    
    3. payload prep
       └─ { nombre: formState.nombre.trim() }
    
    4. proveedorService.createProveedor(payload)
       └─ Axios POST /api/leads/proveedores
           ├─ JWT: ✅ Auto-injected by leadsHttp interceptor
           ├─ Headers: Content-Type: application/json
           ├─ Timeout: 30s
           ├─ On timeout: Auto-retry 1x
           │
           ├─ Response 201 (SUCCESS)
           │   └─ return res.data (Proveedor object)
           │
           ├─ Response 400 (BAD REQUEST)
           │   └─ Error: "⚠️ Datos inválidos"
           │
           ├─ Response 401 (UNAUTHORIZED)
           │   └─ Error: "🔐 Sesión expirada"
           │
           ├─ Response 403 (FORBIDDEN)
           │   └─ Error: "🚫 Permiso denegado"
           │
           ├─ Response 409 (CONFLICT)
           │   └─ Error: "⚠️ Proveedor duplicado"
           │
           └─ Response 500+ (SERVER ERROR)
               └─ Error: "💥 Error del servidor"
    
    5. SUCCESS path
       └─ setGlobalMessage('✅ Proveedor creado correctamente')
       └─ setFormState({ nombre: '' }) [clear form]
       └─ await refetch()
           └─ proveedorService.fetchProveedores()
               └─ GET /api/leads/proveedores
                   └─ setProveedores(data) [update list]
    
    6. ERROR path
       └─ setGlobalMessage(`❌ ${errorMap[status]}`)
       └─ Keep form data for retry
    
    7. setSubmitting(false)
       └─ Enable button again
    
    ▼ UI STATE UPDATES
    
    During submit:
    - ProveedorForm: button disabled, text="⏳ Creando..."
    - ProveedoresList: continues showing current list (no changes)
    
    After SUCCESS:
    - ProveedorForm: clears input, shows success message
    - ProveedoresList: NEW proveedor appears at top/bottom
    - globalMessage: success notification
    
    After ERROR:
    - ProveedorForm: keeps input, shows error message
    - ProveedoresList: unchanged
    - globalMessage: error notification
```

## 4. MANEJO DE ERRORES (6 NIVELES)

```
LEVEL 1: CLIENT-SIDE VALIDATION (antes de POST)
├─ Empty nombre field
├─ Whitespace-only nombre
└─ Handler: validateForm() → setErrors({ nombre: "..." })

LEVEL 2: DOUBLE-CLICK PREVENTION
├─ Check: if (submitting) return
├─ State: submitting flag
└─ UI: Button disabled during request

LEVEL 3: HTTP TIMEOUT & AUTO-RETRY
├─ Timeout: 30s (vs 10s default)
├─ On ECONNABORTED: Retry 1x automatically
├─ leadsHttp response interceptor handles this
└─ User sees: Spinner for 30-60s max

LEVEL 4: HTTP STATUS CODES
├─ 401 → "🔐 Sesión expirada"
├─ 403 → "🚫 Permiso denegado"
├─ 400/422 → "⚠️ Datos inválidos"
├─ 409 → "⚠️ Proveedor duplicado"
└─ 500 → "💥 Error del servidor"

LEVEL 5: JWT TOKEN VALIDATION
├─ Check: localStorage.getItem('auth_token')
├─ Inject: Authorization: Bearer <token>
├─ Interceptor: leadsHttp adds it automatically
└─ If missing: 401 response

LEVEL 6: NETWORK ERRORS
├─ No internet → timeout → auto-retry
├─ DNS failure → error message
├─ CORS blocked → error message
└─ Handler: catch in handleSubmit() → errorMap[status]
```

## 5. INTEGRACIÓN CON CAMPAÑAS

```
FlowA: DATA SYNC (proveedores para multi-select en campañas)

GET /proveedores (Campañas)
    │
    ├─ Called from: useCampaignForm.ts
    │   ├─ useEffect → loadData()
    │   │   └─ Promise.all([
    │   │       fetchCuentasPublicitarias(),
    │   │       fetchProveedores()  ← ✅ SAME endpoint
    │   │   ])
    │   │
    │   └─ Results: setProveedores(data)
    │
    ├─ Rendered: <MultiSelect
    │       options={proveedores.map(p => ({ label: p.nombre, value: p.id }))}
    │       selectedIds={formState.proveedoresIds}
    │   />
    │
    └─ Submitted: 
        ├─ POST /campanas
        │   └─ payload.proveedoresIds = [id1, id2, ...]


FlowB: DATA REFRESH (after creating new proveedor)

1. Create proveedor in ProveedoresSection
   └─ POST /api/leads/proveedores
   └─ SUCCESS → refetch()
       └─ setProveedores([...new list])

2. User navigates to Campañas tab
   └─ CampaignSection mounts
       └─ useCampaignForm initializes
           └─ useEffect
               └─ Promise.all([
                   fetchCuentasPublicitarias(),
                   fetchProveedores()  ← ✅ GETS FRESH DATA
               ])

    ✅ NEW proveedores are now available for selection in Campañas
```

## 6. CHECKLIST DE FEATURES

```
✅ Funcionalidad
  ├─ GET /proveedores lista todos
  ├─ POST /proveedores crea nuevo
  ├─ Form clears después de crear
  ├─ Refetch automático después de crear
  └─ Nuevo proveedor aparece en lista

✅ Validación
  ├─ Required field: nombre
  ├─ Trimmed whitespace
  ├─ Error messages muestran in-line
  └─ Errores se limpian al typing

✅ UX/Feedback
  ├─ Botón disabledo durante submit
  ├─ Loading spinner en lista
  ├─ Success/error messages globales
  ├─ Per-field error display
  └─ Status badge: ✅ Activo / ❌ Inactivo

✅ Robustez
  ├─ Double-click prevention (submitting flag)
  ├─ JWT token auto-injected
  ├─ 30s timeout con retry
  ├─ Error mapping (6 HTTP codes)
  └─ Network error handling

✅ Code Quality
  ├─ TypeScript strict types
  ├─ FSD architecture respected
  ├─ Pure presentational components
  ├─ Custom hook for logic
  ├─ Service layer for API
  └─ Barrel exports

✅ Integration
  ├─ Campañas puede usar GET /proveedores
  ├─ Multi-select compatible
  ├─ Data flows correctly
  └─ Refetch syncs datos
```

## 7. PRÓXIMOS PASOS (OPCIONAL)

```
ENHANCEMENT 1: Edit Proveedor
├─ Add: ProveedorEditor.tsx component
├─ Add: PATCH /proveedores/{id} endpoint
├─ Implementation: Edit button in ProveedoresList
└─ State: Handle edit mode in hook

ENHANCEMENT 2: Delete Proveedor
├─ Add: Delete button with confirmation
├─ Add: DELETE /proveedores/{id} endpoint
├─ Implementation: Refetch after delete
└─ UI: Soft delete status badge

ENHANCEMENT 3: Filter/Search
├─ Add: Search input filter by nombre
├─ Add: Query params: GET /proveedores?search=x
├─ Implementation: useMemo for client-side filter
└─ UI: Real-time search results

ENHANCEMENT 4: Pagination
├─ Add: GET /proveedores?page=0&size=10
├─ Implementation: Table pagination
├─ State: Page, pageSize management
└─ UI: Prev/Next buttons

ENHANCEMENT 5: Sort
├─ Add: GET /proveedores?sort=nombre,asc
├─ Implementation: Click column header to sort
├─ State: sortBy, sortOrder
└─ UI: Sort indicators (▲▼)

ENHANCEMENT 6: Bulk Actions
├─ Add: Checkbox select multiple
├─ Add: Bulk delete/activate/deactivate
├─ Implementation: Batch requests
└─ UI: Action buttons appear when rows selected

ENHANCEMENT 7: Export/Import
├─ Add: Download as CSV
├─ Add: Upload CSV to bulk create
├─ Implementation: Papa Parse library
└─ UI: Download/Upload buttons
```

## 8. ENUMS BACKEND

```
(From backend spec - BACKEND_ENDPOINTS_FSD.md)

No se necesitan enums especiales para Proveedores.

Solo se usa:
- Proveedor.activo: boolean (✅ o ❌)
```

## 9. TESTING CHECKLIST

```
MANUAL TESTING (en navegador después de npm run dev)

✅ Form Submission
  1. Leave nombre empty → Click submit → Error "Nombre es requerido"
  2. Enter nombre="Test" → Click submit → Should create
  3. Check network tab → Authorization header present
  4. Check console → [proveedorService] logs show token

✅ List Display
  1. List loads on component mount
  2. New proveedor appears after create
  3. Clicking multiple "Crear" buttons → only 1 request (double-click prevention)
  4. List shows: ID, Nombre, Estado (✅/❌), Fecha Creación

✅ Error Handling
  1. Disconnect internet → timeout → error message
  2. Invalid JWT (clear localStorage.auth_token) → 401 → "🔐 Sesión expirada"
  3. Submit duplicate nombre → 409 → "⚠️ Proveedor duplicado"

✅ Integration with Campañas
  1. Create proveedor in Proveedores tab
  2. Switch to Campañas tab
  3. Check "Proveedores" multi-select → new proveedor in list ✅
  4. Create campaña with new proveedor → should work

✅ State Management
  1. Form clears after successful submit
  2. Errors clear when user types
  3. Button disabled during submit
  4. List updates immediately after create
  5. Global message shows succesfully

```

## 10. DEPENDENCIAS EXTERNAS

```
Core:
├─ React 18+ (hooks)
├─ TypeScript 5+
├─ Axios (leadsHttp client)
└─ Vite (build tool)

Integración:
├─ leadsHttp: custom Axios instance
│   ├─ baseURL: /api/leads ✅
│   ├─ JWT interceptor ✅
│   ├─ 30s timeout ✅
│   ├─ Auto-retry on ECONNABORTED ✅
│   └─ Error normalization ✅
│
└─ entidades/proveedor: types
    └─ Proveedor, CreateProveedorPayload ✅
```

---

Generated: 28 Mar 2026
Status: ✅ PRODUCTION READY
*/