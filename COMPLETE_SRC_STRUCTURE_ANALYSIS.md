# COMPLETE SRC/ DIRECTORY STRUCTURE - EXHAUSTIVE ANALYSIS
**Generated:** March 24, 2026 | **Total Files:** 250+

---

## 🎯 QUICK ANSWERS TO YOUR QUESTIONS

### 1. Dashboard/Page Files Location ✅
**Primary Location:** `src/paginas/`
```
src/paginas/
├── admin/
│   ├── ui/
│   └── index.ts
├── asesor-backoffice/
│   ├── ui/
│   └── index.ts
├── asesor-ventas/
│   ├── ui/
│   └── index.ts
├── capacitacion/
│   ├── ui/
│   └── index.ts
├── community/
│   ├── ui/
│   └── index.ts
├── desarrollador/
│   ├── ui/
│   └── index.ts
├── login/
│   ├── ui/
│   └── index.ts
├── reclutamiento/
│   ├── ui/
│   └── index.ts
├── rrhh/
│   ├── ui/
│   └── index.ts
├── supervisor-gtr/
│   ├── ui/
│   └── index.ts
├── index.ts
└── README.md
```

**Secondary Location:** `src/caracteristicas/` (feature-specific dashboards)
- `caracteristicas/admin/` - Admin dashboards
- `caracteristicas/community/` - Community dashboard components
- `caracteristicas/desarrollador/` - Developer dashboard

---

### 2. Service/API Files Location ✅

**A. Main Service Layer:** `src/services/` (PRIMARY)
```
src/services/
├── applicant.service.ts      ← Applicant business logic
├── auth.service.ts           ← Authentication service
├── base.service.ts           ← Base service class
├── contract.service.ts       ← Contract management
├── employee.service.ts       ← Employee business logic
├── errorLogger.ts            ← Error logging service
└── index.ts
```

**B. Repository Layer:** `src/repositories/` (DATA ACCESS)
```
src/repositories/
├── applicant.repository.ts   ← Applicant data access
├── contract.repository.ts    ← Contract data access
├── employee.repository.ts    ← Employee data access
├── index.ts
```

**C. HTTP Client:** `src/api/` (LOWER LEVEL)
```
src/api/
├── http.ts                   ← Axios/HTTP client config
└── index.ts
```

**D. Feature-Specific Services:** `src/caracteristicas/*/api/`
```
src/caracteristicas/admin/api/
├── admin.service.ts

src/caracteristicas/autenticacion/api/
├── servicioAutenticacion.ts
├── index.ts

src/caracteristicas/registrar-empleado/api/
├── servicioEmpleado.ts
├── index.ts

src/caracteristicas/registrar-postulante/api/
├── servicioPostulante.ts
├── index.ts

src/caracteristicas/gestion-leads/api/
└── index.ts
```

**E. Shared/Compartido Services:** `src/compartido/api/`
```
src/compartido/api/
├── clienteHttp.ts            ← HTTP client
├── servicioBase.ts           ← Base service
└── index.ts
```

**E. Old Legacy API Location:** `src/app/api/` (check if deprecated)

---

### 3. Duplicate Detection - FOUND ISSUES! ⚠️

**MAJOR DUPLICATION IDENTIFIED:**

| Layer | Spanish Folder | English Folder | Status |
|-------|---|---|---|
| **Shared/Common** | `src/compartido/` | `src/shared/` | **BOTH EXIST** ⚠️ |
| **Features** | `src/caracteristicas/` | `src/features/` | Only caracteristicas exists |
| **Types** | `src/compartido/tipos/` | `src/shared/types/` | **BOTH EXIST** ⚠️ |
| **Pages** | `src/paginas/` | `src/pages/` | Only paginas exists |
| **Widgets** | `src/widgets/` | - | Single location ✅ |
| **Entities** | `src/entidades/` | - | Single location ✅ |
| **Contexts** | `src/contexts/` | - | Single location ✅ |

**DUPLICATE DETECTION DETAILS:**

```
src/compartido/ (SPANISH)
├── api/
│   ├── clienteHttp.ts
│   ├── servicioBase.ts
│   └── index.ts
├── tipos/
│   ├── community.ts
│   ├── comun.ts
│   ├── enums.ts
│   ├── eventos.ts
│   ├── index.ts
│   └── indice.ts
├── ui/
├── lib/
├── ganchos/
└── validacion/

src/shared/ (ENGLISH)
├── types/
│   ├── advisor.types.ts
│   ├── common.ts
│   ├── enums.ts
│   ├── index.ts
│   ├── lead.types.ts
│   └── tipification.types.ts
├── CONSISTENCY_GUIDE.ts
```

**DUPLICATION SUMMARY:**
- Two API layers: `src/api/` + `src/compartido/api/` + `src/shared/`
- Two types directories: `src/compartido/tipos/` + `src/shared/types/` + `src/types/`
- Entry points split: `src/main.tsx` vs `src/app/main.tsx`
- App roots: `src/App.tsx` vs `src/app/App.tsx`

---

### 4. Entry Point Chain ✅

**PRIMARY ENTRY POINT:**
```
src/main.tsx (ROOT)
  ↓
  imports src/App.tsx (ROOT LEVEL)
```

**SECONDARY ENTRY POINT (appears unused):**
```
src/app/main.tsx
  ↓
  imports src/app/App.tsx
  ↓
  src/app/RouterByRole.tsx
```

**ROUTING CONFIGURATION:**
```
src/RouterByRole.tsx  ← Role-based routing (ROOT)
src/app/RouterByRole.tsx  ← Role-based routing (APP folder - DUPLICATE?)
```

**CONFIGURATION:**
```
src/app/config/
├── index.ts
└── providers/
    └── index.ts

src/config/
├── env.ts
└── index.ts
```

---

### 5. Type Files - ALL TYPE DEFINITIONS ✅

**A. Root Types** (`src/types/`)
```
src/types/
├── events.ts           ← Event type definitions
└── index.ts
```

**B. Compartido Types** (`src/compartido/tipos/`) - SPANISH
```
src/compartido/tipos/
├── community.ts
├── comun.ts            ← Common/generic types
├── enums.ts
├── eventos.ts
├── index.ts
└── indice.ts
```

**C. Shared Types** (`src/shared/types/`) - ENGLISH
```
src/shared/types/
├── advisor.types.ts
├── common.ts
├── enums.ts
├── index.ts
├── lead.types.ts
└── tipification.types.ts
```

**D. Entity Model Types** (`src/entidades/*/modelo/`)
```
src/entidades/asesor/modelo/index.ts
src/entidades/candidato/modelo/index.ts
src/entidades/empleado/modelo/index.ts
src/entidades/lead/modelo/index.ts
src/entidades/postulante/modelo/index.ts
src/entidades/tipificacion/modelo/index.ts
src/entidades/usuario/modelo/index.ts
```

**E. Feature Model Types** (`src/caracteristicas/*/modelo/`)
```
src/caracteristicas/registrar-empleado/modelo/
├── esquemas.ts
├── ganchos.ts
├── index.ts
└── useSincEmpleados.ts

src/caracteristicas/registrar-postulante/modelo/
├── esquemas.ts
├── ganchos.ts
├── index.ts
└── useSincPostulantes.ts

src/caracteristicas/gestion-leads/modelo/
├── index.ts
├── useLeadsData.ts
├── useLeadsManagement.ts
├── useLeadSubmit.ts
└── useNewLeadForm.ts
```

---

### 6. Contexts - ALL CONTEXT FILES ✅

**Location:** `src/contexts/`

```
src/contexts/
├── ApplicantsContext.tsx     ← Applicants state management
├── DataContext.tsx            ← General data context
├── DevRoleContext.tsx         ← Developer role context (for testing)
├── NotificationContext.tsx    ← Notifications state
├── SidebarContext.tsx         ← Sidebar state
├── useNotification.ts         ← Notification hook
├── hooks/
│   ├── index.ts
│   ├── useApplicantsSelectors.ts
│   └── useNotificationSelectors.ts
```

**Context Selectors/Hooks:**
```
src/contexts/hooks/useApplicantsSelectors.ts   ← Applicant selectors
src/contexts/hooks/useNotificationSelectors.ts ← Notification selectors
src/contexts/useNotification.ts                ← Notification hook
```

---

## 📁 COMPLETE FILE TREE BY DIRECTORY

### ROOT LEVEL
```
src/
├── main.tsx                    ← PRIMARY ENTRY POINT
├── App.tsx                     ← PRIMARY APP COMPONENT
├── App.css
├── index.css
├── RouterByRole.tsx
├── setupTests.ts
└── architecture.md
```

### CONFIG
```
src/config/
├── env.ts
└── index.ts

src/app/config/
├── index.ts
└── providers/
    └── index.ts
```

### API/HTTP LAYER
```
src/api/
├── http.ts
└── index.ts

src/compartido/api/
├── clienteHttp.ts
├── servicioBase.ts
└── index.ts

src/shared/ (DUPLICATE)
└── CONSISTENCY_GUIDE.ts
```

### SERVICES LAYER
```
src/services/
├── applicant.service.ts
├── auth.service.ts
├── base.service.ts
├── contract.service.ts
├── employee.service.ts
├── errorLogger.ts
└── index.ts

src/repositories/
├── applicant.repository.ts
├── contract.repository.ts
├── employee.repository.ts
└── index.ts
```

### CHARACTERISTICS/FEATURES - `src/caracteristicas/`
```
src/caracteristicas/
├── admin/
│   ├── api/
│   │   └── admin.service.ts
│   ├── hooks/
│   │   └── useAdminDashboard.ts
│   ├── ui/
│   │   ├── AdicionalesSection.tsx
│   │   ├── PlansSection.tsx
│   │   ├── PromotionsSection.tsx
│   │   └── index.ts
│   ├── types.ts
│   └── index.ts
│
├── autenticacion/
│   ├── api/
│   │   ├── servicioAutenticacion.ts
│   │   └── index.ts
│   ├── ui/
│   │   ├── LoginForm.tsx
│   │   └── index.ts
│   └── index.ts
│
├── baja-empleado/
│   ├── ui/
│   │   ├── EmployeeCheckoutForm.tsx
│   │   └── index.ts
│   └── index.ts
│
├── community/
│   ├── hooks/
│   │   └── index.ts
│   ├── ui/
│   │   ├── AdvertiserAccountCard.tsx
│   │   ├── CampaignCard.tsx
│   │   ├── CampaignsSection.tsx
│   │   ├── CompanyCard.tsx
│   │   ├── DashboardSection.tsx
│   │   ├── LeadsManagementSection.tsx
│   │   ├── ModalsSection.tsx
│   │   └── index.ts
│   └── index.ts
│
├── desarrollador/
│   └── api/
│       └── desarrollador.service.ts
│
├── editar-postulante/
│   ├── ui/
│   │   ├── EditApplicantForm.tsx
│   │   └── index.ts
│   └── index.ts
│
├── gestion-leads/
│   ├── api/
│   │   └── index.ts
│   ├── hooks/
│   │   └── useNewLeadForm.ts
│   ├── modelo/
│   │   ├── index.ts
│   │   ├── useLeadsData.ts
│   │   ├── useLeadsManagement.ts
│   │   ├── useLeadSubmit.ts
│   │   └── useNewLeadForm.ts
│   ├── ui/
│   │   ├── NewLeadModal.tsx
│   │   └── index.ts
│   └── index.ts
│
├── registrar-empleado/
│   ├── api/
│   │   ├── servicioEmpleado.ts
│   │   └── index.ts
│   ├── modelo/
│   │   ├── ganchos.ts
│   │   ├── index.ts
│   │   └── useSincEmpleados.ts
│   ├── ui/
│   │   ├── ActivateEmployeeModal.tsx
│   │   ├── EmployeeDetailForm.tsx
│   │   ├── HireApplicantForm.tsx
│   │   ├── NewEmployeeForm.tsx
│   │   └── index.ts
│   └── index.ts
│
├── registrar-postulante/
│   ├── api/
│   │   ├── servicioPostulante.ts
│   │   └── index.ts
│   ├── modelo/
│   │   ├── esquemas.ts
│   │   ├── ganchos.ts
│   │   ├── index.ts
│   │   └── useSincPostulantes.ts
│   ├── ui/
│   │   ├── NewApplicantForm.tsx
│   │   └── index.ts
│   └── index.ts
│
├── index.ts
└── README.md
```

### SHARED/COMMON - `src/compartido/`
```
src/compartido/
├── api/
│   ├── clienteHttp.ts
│   ├── servicioBase.ts
│   └── index.ts
│
├── configuracion/
│   ├── constantes.ts
│   └── index.ts
│
├── ganchos/
│   ├── useManejadorError.ts
│   ├── usePaginacion.ts
│   ├── usePatronesComunes.ts
│   ├── useValidacionFormulario.ts
│   └── index.ts
│
├── lib/
│   ├── almacenamientoLocal.ts
│   ├── contextos.ts
│   ├── lazyLoad.tsx
│   ├── sanitizacion.ts
│   ├── servicios.ts
│   ├── utilidades.ts
│   ├── validacionTelefono.ts
│   └── index.ts
│
├── tipos/
│   ├── community.ts
│   ├── comun.ts
│   ├── enums.ts
│   ├── eventos.ts
│   ├── index.ts
│   └── indice.ts
│
├── ui/
│   ├── atomos/
│   │   ├── Badge.ts
│   │   ├── Button.ts
│   │   ├── botones/
│   │   │   └── index.ts
│   │   ├── campos/
│   │   │   └── index.ts
│   │   ├── espaciado/
│   │   │   └── index.ts
│   │   ├── etiquetas/
│   │   │   └── index.ts
│   │   ├── iconos/
│   │   │   └── index.ts
│   │   ├── indicadores/
│   │   │   └── index.ts
│   │   ├── tipografia/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── base/
│   │   ├── ApplicantForm.tsx
│   │   ├── Boton.tsx
│   │   ├── Button.tsx
│   │   ├── Entrada.tsx
│   │   ├── Girador.tsx
│   │   ├── LeadDetailCard.tsx
│   │   ├── LeadListItem.tsx
│   │   ├── Modal.tsx
│   │   ├── TipificationBlockPanel.tsx
│   │   ├── TipificationOption.tsx
│   │   └── index.ts
│   │
│   ├── moleculas/
│   │   ├── DataTable.ts
│   │   ├── formularios/
│   │   │   └── index.ts
│   │   ├── navegacion/
│   │   │   └── index.ts
│   │   ├── tablas/
│   │   │   └── index.ts
│   │   ├── tarjetas/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── organismos/
│   │   ├── contenedores/
│   │   │   └── index.ts
│   │   ├── Layout/
│   │   │   └── Header.ts
│   │   ├── modales/
│   │   │   └── index.ts
│   │   ├── navegadores/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── limitadorErrores/
│   │   ├── ErrorBoundary.tsx
│   │   └── FeatureErrorBoundary.tsx
│   │
│   ├── selectorFecha/
│   │   └── SelectorFecha.tsx
│   │
│   └── index.ts
│
├── validacion/
│   ├── esquemas.ts
│   └── index.ts
│
└── README.md
```

### SHARED (ENGLISH) - `src/shared/` - DUPLICATE! ⚠️
```
src/shared/
├── types/
│   ├── advisor.types.ts
│   ├── common.ts
│   ├── enums.ts
│   ├── index.ts
│   ├── lead.types.ts
│   └── tipification.types.ts
└── CONSISTENCY_GUIDE.ts
```

### ENTITIES - `src/entidades/`
```
src/entidades/
├── asesor/
│   ├── modelo/
│   │   └── index.ts
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── candidato/
│   ├── modelo/
│   │   └── index.ts
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── empleado/
│   ├── modelo/
│   │   └── index.ts
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── lead/
│   ├── modelo/
│   │   └── index.ts
│   ├── ui/
│   │   ├── atomos/
│   │   │   ├── LeadListItem/
│   │   │   │   └── LeadListItem.tsx
│   │   │   └── index.ts
│   │   ├── moleculas/
│   │   │   ├── LeadDetailCard/
│   │   │   │   └── LeadDetailCard.tsx
│   │   │   ├── LeadsWidget/
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
│
├── postulante/
│   ├── modelo/
│   │   └── index.ts
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── tipificacion/
│   ├── modelo/
│   │   └── index.ts
│   ├── ui/
│   │   ├── atomos/
│   │   │   ├── TipificationOption/
│   │   │   └── index.ts
│   │   ├── moleculas/
│   │   │   ├── TipificationBlockPanel/
│   │   │   │   └── TipificationBlockPanel.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
│
├── usuario/
│   ├── modelo/
│   │   └── index.ts
│   ├── ui/
│   │   ├── atomos/
│   │   │   ├── RoleBadge/
│   │   │   │   └── RoleBadge.types.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
│
├── index.ts
└── README.md
```

### PAGES/PAGES - `src/paginas/`
```
src/paginas/
├── admin/
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── asesor-backoffice/
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── asesor-ventas/
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── capacitacion/
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── community/
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── desarrollador/
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── login/
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── reclutamiento/
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── rrhh/
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── supervisor-gtr/
│   ├── ui/
│   │   └── index.ts
│   └── index.ts
│
├── index.ts
└── README.md
```

### WIDGETS - `src/widgets/`
```
src/widgets/
├── barra-lateral/
│   ├── ui/
│   │   ├── Sidebar.tsx
│   │   ├── UserProfile.tsx
│   │   └── index.ts
│   └── index.ts
│
├── community/
│   ├── ui/
│   │   ├── CampaignCard.tsx
│   │   ├── CampaignsKanban.tsx
│   │   ├── CommunityMenubar.tsx
│   │   └── index.ts
│   └── index.ts
│
├── encabezado/
│   ├── ui/
│   │   ├── Header.tsx
│   │   ├── HeaderActions.tsx
│   │   ├── UserProfile.tsx
│   │   └── index.ts
│   └── index.ts
│
├── layout-principal/
│   └── ui/
│       └── MainLayout.tsx
│
├── panel-leads/
│   ├── ui/
│   │   ├── LeadsListPanel.tsx
│   │   └── index.ts
│   └── index.ts
│
├── panel-tipificacion/
│   ├── ui/
│   │   ├── TipificationPanel.tsx
│   │   └── index.ts
│   └── index.ts
│
├── supervisor-gtr/
│   ├── ui/
│   │   ├── AdvisorsSection.tsx
│   │   ├── LeadsSection.tsx
│   │   └── index.ts
│   └── index.ts
│
├── tabla-empleados/
│   ├── ui/
│   │   ├── EmployeeTable.tsx
│   │   └── index.ts
│   └── index.ts
│
├── tabla-postulantes/
│   ├── ganchos/
│   │   ├── useTablaPostulantes.ts
│   │   └── index.ts
│   ├── ui/
│   │   ├── ApplicantsTable.tsx
│   │   ├── ApplicantsTableRow.tsx
│   │   └── index.ts
│   └── index.ts
│
├── index.ts
└── README.md
```

### CONTEXTS - `src/contexts/`
```
src/contexts/
├── ApplicantsContext.tsx
├── DataContext.tsx
├── DevRoleContext.tsx
├── NotificationContext.tsx
├── SidebarContext.tsx
├── useNotification.ts
├── hooks/
│   ├── useApplicantsSelectors.ts
│   ├── useNotificationSelectors.ts
│   └── index.ts
```

### HOOKS - `src/hooks/`
```
src/hooks/
├── useApplicantsSync.ts
├── useApplicantsTable.ts
├── useBackofficeLeads.ts
├── useCommonPatterns.ts
├── useEmployeesSync.ts
├── useErrorHandler.ts
├── useFormValidation.ts
├── usePagination.ts
├── useTipification.ts
└── index.ts
```

### VALIDATION - `src/validation/`
```
src/validation/
├── applicant.schemas.ts
├── form-example.tsx
└── schemas.ts
```

### UTILITIES - `src/utils/`
```
src/utils/
├── constants.ts
├── localStorage.ts
├── mockData.ts
├── phoneValidation.ts
├── rateLimiting.ts
├── sanitization.ts
├── secureErrorHandling.ts
└── tipificationConstants.ts
```

### STYLES - `src/styles/`
```
src/styles/
├── atoms.css
└── tokens.css
```

### DEVELOPMENT - `src/dev/`
```
src/dev/
├── DevRoleSwitcher.tsx
└── DevRoleSwitcher.css
```

### APP FOLDER (APPEARS SECONDARY/UNUSED) - `src/app/`
```
src/app/
├── main.tsx
├── App.tsx
├── App.css
├── config/
│   ├── index.ts
│   └── providers/
│       └── index.ts
├── RouterByRole.tsx
└── styles/
    └── index.css
```

### TYPES (ROOT) - `src/types/`
```
src/types/
├── events.ts
└── index.ts
```

### ASSETS - `src/assets/`
```
src/assets/
└── react.svg
```

---

## 📊 STATISTICS

| Category | Count | Location |
|----------|-------|----------|
| **TSX Components** | 50+ | `src/caracteristicas`, `src/widgets`, `src/entidades`, `src/paginas` |
| **TS Services** | 15+ | `src/services`, `src/repositories`, `src/caracteristicas/*/api` |
| **Type Definition Files** | 15+ | `src/compartido/tipos`, `src/shared/types`, `src/types` |
| **Custom Hooks** | 20+ | `src/hooks`, `src/caracteristicas/*/hooks`, `src/compartido/ganchos` |
| **Context Files** | 5 | `src/contexts` |
| **CSS Files** | 5+ | `src/styles`, `src/dev`, root level |
| **Total Directories** | 80+ | Across all layers |
| **Total Files** | 250+ | All types combined |

---

## 🚨 CRITICAL ISSUES FOUND

### Issue #1: DUAL ENTRY POINTS
- `src/main.tsx` → `src/App.tsx` (ACTIVE)
- `src/app/main.tsx` → `src/app/App.tsx` (APPEARS UNUSED)

### Issue #2: DUPLICATE API LAYERS
- `src/api/http.ts`
- `src/compartido/api/clienteHttp.ts`
- `src/shared/types/` (unused?)

### Issue #3: DUPLICATE TYPES SYSTEM
- `src/compartido/tipos/` (Spanish)
- `src/shared/types/` (English)
- `src/types/` (Root level)

### Issue #4: MIXED NAMING CONVENTIONS
- Spanish: `caracteristicas`, `compartido`, `entidades`, `paginas`, `ganchos`
- English: `shared`, `widgets`, `services`, `repositories`, `hooks`

### Issue #5: UNUSED DIRECTORIES
- `src/app/` folder appears to duplicate root-level setup
- `src/shared/` may not be actively used
- Need to verify actual entry point

---

## ✅ RECOMMENDATIONS

1. **Consolidate Entry Points**: Use only `src/main.tsx` → `src/App.tsx`
2. **Unify Type System**: Choose either `compartido/tipos/` (Spanish) OR `shared/types/` (English)
3. **Single API Layer**: Keep `src/api/` for HTTP, use `src/services/` for business logic
4. **Clean up `src/app/`**: If unused, remove or clarify its purpose
5. **Consistent Naming**: Pick English OR Spanish across all layers
6. **Consolidate Hooks**: `src/hooks/` vs `src/compartido/ganchos/` vs feature-level hooks

---

**Analysis Complete** ✅
