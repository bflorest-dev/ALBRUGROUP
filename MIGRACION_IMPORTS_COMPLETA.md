# 📋 ANÁLISIS EXHAUSTIVO: IMPORTS QUE REQUIEREN MIGRACIÓN A ALIAS FSD

**Análisis realizado:** 23 de marzo de 2026  
**Total de archivos analizados:** 200+ archivos .ts/.tsx  
**Estado:** LISTA COMPLETA DE MOVIMIENTOS REQUERIDOS

---

## 🎯 RESUMEN EJECUTIVO

**Alias FSD Correctos (Configurados):**
- `@paginas/*` → `src/paginas/*`
- `@widgets/*` → `src/widgets/*`
- `@caracteristicas/*` → `src/caracteristicas/*`
- `@entidades/*` → `src/entidades/*`
- `@compartido/*` → `src/compartido/*`
- `@app/*` → `src/app/*`

**Imports Problemáticos Encontrados:** ~150+ instancias distribuidas en:
1. ✅ Rutas relativas profundas (`../../../`)
2. ✅ Alias antiguos (`@shared`, `@atoms`, `@molecules`, `@components`, `@contexts`, `@hooks`, `@services`, `@utils`)
3. ✅ Rutas con prefijo `./` sin alias FSD
4. ✅ Imports desde directorio root (`src/components`, `src/features`, `src/services`, etc.)

---

## 📊 CATEGORÍA 1: ARCHIVOS CON ALIAS ANTIGUOS (@shared, @atoms, @molecules, @utils, @services, @components, @contexts)

**CRÍTICO:** Estos usan alias que ya NO existen y causan errores de compilación.

### Grupo 1.1: Archivos Legacy de Componentes (src/components/)

| Archivo | Línea | Import Actual | Debe Ser |
|---------|-------|---------------|----------|
| `src/components/organisms/TipificationPanel/TipificationPanel.tsx` | 13 | `import type { LeadDTO } from '@shared/types'` | `@compartido/tipos` |
| `src/components/organisms/TipificationPanel/TipificationPanel.tsx` | 14 | `import type { TipificationOptionId } from '@shared/types/tipification.types'` | `@compartido/tipos` |
| `src/components/organisms/TipificationPanel/TipificationPanel.tsx` | 15 | `import { TIPIFICATION_BLOCKS } from '@utils/tipificationConstants'` | `@compartido/lib` |
| `src/components/organisms/TipificationPanel/TipificationPanel.tsx` | 16 | `import { LeadDetailCard } from '@molecules/LeadDetailCard'` | `@compartido/ui/moleculas` |
| `src/components/organisms/TipificationPanel/TipificationPanel.tsx` | 17 | `import { TipificationBlockPanel } from '@molecules/TipificationBlockPanel'` | `@compartido/ui/moleculas` |
| `src/components/organisms/TipificationPanel/TipificationPanel.tsx` | 18 | `import { Button } from '@atoms/Button'` | `@compartido/ui/atomos` |
| `src/components/organisms/TipificationPanel/TipificationPanel.tsx` | 19 | `import { Spinner } from '@atoms/Spinner'` | `@compartido/ui/atomos` |
| `src/components/organisms/LeadsListPanel/LeadsListPanel.tsx` | 12 | `import { Input } from '@atoms/Input'` | `@compartido/ui/atomos` |
| `src/components/organisms/LeadsListPanel/LeadsListPanel.tsx` | 13 | `import { LeadListItem } from '@atoms/LeadListItem'` | `@compartido/ui/atomos` |
| `src/components/organisms/LeadsListPanel/LeadsListPanel.tsx` | 14 | `import type { LeadDTO } from '@shared/types'` | `@compartido/tipos` |
| `src/components/molecules/ApplicantForm/ApplicantForm.tsx` | 4 | `import { Input } from '@atoms/Input'` | `@compartido/ui/atomos` |
| `src/components/molecules/ApplicantForm/ApplicantForm.tsx` | 5 | `import { Select } from '@atoms/Select'` | `@compartido/ui/atomos` |
| `src/components/molecules/ApplicantForm/ApplicantForm.tsx` | 6 | `import { Button } from '@atoms/Button'` | `@compartido/ui/atomos` |
| `src/components/molecules/TipificationBlockPanel/TipificationBlockPanel.tsx` | 10 | `import type { TipificationBlock, TipificationOptionId } from '@shared/types'` | `@compartido/tipos` |
| `src/components/molecules/TipificationBlockPanel/TipificationBlockPanel.tsx` | 11 | `import { TipificationOption } from '@atoms/TipificationOption'` | `@compartido/ui/atomos` |
| `src/components/atoms/LeadListItem/LeadListItem.tsx` | 10 | `import type { LeadDTO } from '@shared/types'` | `@compartido/tipos` |
| `src/components/molecules/LeadDetailCard/LeadDetailCard.tsx` | 9 | `import type { LeadDTO } from '@shared/types'` | `@compartido/tipos` |

### Grupo 1.2: Archivos Legacy - Servicios y Utilidades

| Archivo | Línea | Import Actual | Debe Ser |
|---------|-------|---------------|----------|
| `src/utils/tipificationConstants.ts` | 8 | `import type { TipificationBlock } from '@shared/types'` | `@compartido/tipos` |
| `src/services/errorLogger.ts` | 11 | (comentario) `import { ErrorLogger } from '@services/errorLogger'` | MOVER A: `@compartido/lib` |
| `src/shared/CONSISTENCY_GUIDE.ts` | 28 | `from '@shared/types/enums'` | `@compartido/tipos` |
| `src/shared/CONSISTENCY_GUIDE.ts` | 38 | `from '@shared/types/lead.types'` | `@compartido/tipos` |

---

## 📊 CATEGORÍA 2: RUTAS RELATIVAS PROFUNDAS (../../../) - REQUIEREN ALIAS

**Archivos que importan con `../../../` que están en las capas FSD:**

### Grupo 2.1: Caracteristicas - Registrar Postulante

| Archivo | Línea | Import Actual | Debe Ser | Razón |
|---------|-------|---------------|----------|-------|
| `src/caracteristicas/registrar-postulante/api/servicioPostulante.ts` | 15 | `import { ApplicantRepository } from '../../../repositories/applicant.repository'` | `@compartido/api` o nuevo patrón | Repositorio debe migrar a @compartido/lib o @entidades |
| `src/caracteristicas/registrar-postulante/api/servicioPostulante.ts` | 16 | `import type { Applicant, NewApplicantFormData, RegistrarPostulanteRequest } from '../../../types'` | `@compartido/tipos` | Tipos deben estar centralizados |
| `src/caracteristicas/registrar-postulante/api/servicioPostulante.ts` | 17 | `import { adaptPostulanteResponseToApplicant } from '../../../types'` | `@compartido/tipos` | Adapters deben estar con tipos |
| `src/caracteristicas/registrar-postulante/api/servicioPostulante.ts` | 18 | `import { validateDataOrThrow, NewApplicantFormDataSchema } from '../../../validation/schemas'` | `@compartido/validacion` | Validación centralizada |

### Grupo 2.2: Caracteristicas - Registrar Empleado

| Archivo | Línea | Import Actual | Debe Ser | Razón |
|---------|-------|---------------|----------|-------|
| `src/caracteristicas/registrar-empleado/api/servicioEmpleado.ts` | 8 | `import { EmployeeRepository } from '../../../repositories/employee.repository'` | `@compartido/api` o nuevo patrón | Repositorio debe migrar |
| `src/caracteristicas/registrar-empleado/api/servicioEmpleado.ts` | 9 | `import { adaptEmpleadoResponseToEmployee } from '../../../types'` | `@compartido/tipos` | Adapters centralizados |
| `src/caracteristicas/registrar-empleado/api/servicioEmpleado.ts` | 10 | `import type { Employee, NewEmployeeFormData, EmployeeDetailFormData } from '../../../types'` | `@compartido/tipos` | Tipos centralizados |
| `src/caracteristicas/registrar-empleado/api/servicioEmpleado.ts` | 11 | `import { validateDataOrThrow, NewEmployeeFormDataSchema } from '../../../validation/schemas'` | `@compartido/validacion` | Validación centralizada |

### Grupo 2.3: Widgets - Tabla Postulantes

| Archivo | Línea | Import Actual | Debe Ser | Razón |
|---------|-------|---------------|----------|-------|
| `src/widgets/tabla-postulantes/ganchos/useTablaPostulantes.ts` | 2 | `import type { Applicant } from '../../../types'` | `@compartido/tipos` | Tipos centralizados |

### Grupo 2.4: Caracteristicas - Registrar Postulante - Modelo

| Archivo | Línea | Import Actual | Debe Ser | Razón |
|---------|-------|---------------|----------|-------|
| `src/caracteristicas/registrar-postulante/modelo/useSincPostulantes.ts` | 12 | `import { ApplicantRepository } from '../../../repositories/applicant.repository'` | `@compartido/api` | Repositorio centralizado |
| `src/caracteristicas/registrar-postulante/modelo/useSincPostulantes.ts` | 13 | `import { adaptPostulanteResponseToApplicant } from '../../../types'` | `@compartido/tipos` | Adapters centralizados |
| `src/caracteristicas/registrar-postulante/modelo/useSincPostulantes.ts` | 14 | `import type { Applicant } from '../../../types'` | `@compartido/tipos` | Tipos centralizados |

### Grupo 2.5: Caracteristicas - Registrar Empleado - Modelo

| Archivo | Línea | Import Actual | Debe Ser | Razón |
|---------|-------|---------------|----------|-------|
| `src/caracteristicas/registrar-empleado/modelo/useSincEmpleados.ts` | 3 | `import type { Employee } from '../../../types'` | `@compartido/tipos` | Tipos centralizados |

---

## 📊 CATEGORÍA 3: ARCHIVOS LEGACY - ESTRUCTURA ANTIGUA (src/*)

**Archivos que aún están en src/ directamente sin usar alias FSD:**

### Grupo 3.1: Root App Files

| Archivo | Línea | Import Actual | Debe Ser | Acción |
|---------|-------|---------------|----------|--------|
| `src/App.tsx` | 2 | `import { MainLayout } from './components/templates/DashboardTemplate'` | `@app/ui` o `@compartido/ui/organismos` | Mover MainLayout a @compartido/ui/organismos |
| `src/App.tsx` | 3 | `import { DevRoleProvider, useDevRole } from './contexts/DevRoleContext'` | `@compartido/lib` o `@app/contextos` | Mover contexts a @compartido (si son compartidos) |
| `src/App.tsx` | 4 | `import { ApplicantsProvider } from './contexts/ApplicantsContext'` | `@compartido/lib` | Context compartido |
| `src/App.tsx` | 5 | `import { ErrorBoundary } from './components/organisms/ErrorBoundary'` | `@compartido/ui/organismos` | Mover a shared |
| `src/App.tsx` | 6 | `import { DarkModeToggle } from './components/atoms/DarkModeToggle'` | `@compartido/ui/atomos` | Atom compartido |
| `src/App.tsx` | 7 | `import { ErrorLogger } from './services'` | `@compartido/lib` | Servicio compartido |

### Grupo 3.2: RouterByRole

| Archivo | Línea | Import Actual | Debe Ser | Acción |
|---------|-------|---------------|----------|--------|
| `src/RouterByRole.tsx` | 2 | `import type { Role } from './shared/types'` | `@compartido/tipos` | Tipos a compartido |
| `src/RouterByRole.tsx` | 3 | `import { AdminDashboard } from './features/ADMINISTRADOR/components'` | `@paginas/administrador` | Mover a paginas |
| `src/RouterByRole.tsx` | 4 | `import { DeveloperDashboard } from './features/DESARROLLADOR/components'` | `@paginas/desarrollador` | Mover a paginas |
| `src/RouterByRole.tsx` | 5 | `import { LoginPage } from './features/LOGIN/components'` | `@paginas/autenticacion` | Mover a paginas |
| `src/RouterByRole.tsx` | 6 | `import { EmployeeDashboard } from './features/RRHH/pages/EmployeeDashboard'` | `@paginas/rrhh` | Mover a paginas/rrhh |
| `src/RouterByRole.tsx` | 7 | `import { KanbanDashboard } from './features/RECLUTAMIENTO/pages/KanbanDashboard'` | `@paginas/reclutamiento` | Mover a paginas/reclutamiento |
| `src/RouterByRole.tsx` | 8 | `import { TrainingDashboard } from './features/CAPACITACION/pages/TrainingDashboard'` | `@paginas/capacitacion` | Mover a paginas |
| `src/RouterByRole.tsx` | 9 | `import { SalesAdvisorDashboard } from './features/ASESOR_VENTAS/pages'` | `@paginas/asesor-ventas` | Mover a paginas |
| `src/RouterByRole.tsx` | 10 | `import { CommunityDashboard } from './features/COMMUNITY/pages/CommunityDashboard'` | `@paginas/community` | Mover a paginas |
| `src/RouterByRole.tsx` | 11 | `import { GTRDashboard } from './features/SUPERVISOR_GTR/pages/GTRDashboard'` | `@paginas/supervisor-gtr` | Mover a paginas |
| `src/RouterByRole.tsx` | 12 | `import { BackofficeAdvisorDashboard } from './features/ASESOR_BACKOFFICE/pages/BackofficeAdvisorDashboard'` | `@paginas/asesor-backoffice` | Mover a paginas |

### Grupo 3.3: main.tsx

| Archivo | Línea | Import Actual | Debe Ser | Acción |
|---------|-------|---------------|----------|--------|
| `src/main.tsx` | 4 | `import App from './App.tsx'` | `import App from '@app/App'` | App debe estar en @app |
| `src/main.tsx` | 5 | `import { clearAllStorage } from './utils/localStorage'` | `@compartido/lib` | Utilities a compartido |

### Grupo 3.4: API Files (src/api/)

| Archivo | Línea | Import Actual | Debe Ser | Acción |
|---------|-------|---------------|----------|--------|
| `src/api/http.ts` | 15 | `import { env } from '../config/env'` | `@app/configuracion` | Config debe estar centralizada |

### Grupo 3.5: Compartido - ClienteHttp

| Archivo | Línea | Import Actual | Debe Ser | Acción |
|---------|-------|---------------|----------|--------|
| `src/compartido/api/clienteHttp.ts` | 15 | `import { env } from '../../config/env'` | `@app/configuracion` | Config debe estar en @app |

### Grupo 3.6: Contexts (Compartidos)

| Archivo | Línea | Import Actual | Debe Ser | Acción |
|---------|-------|---------------|----------|--------|
| `src/contexts/ApplicantsContext.tsx` | 2 | `import type { Applicant, Employee } from '../types'` | `@compartido/tipos` | Tipos a compartido |
| `src/contexts/ApplicantsContext.tsx` | 3 | `import { EVENT_NAMES, dispatchAppEvent } from '../types/events'` | `@compartido/tipos` | Events a compartido |
| `src/contexts/ApplicantsContext.tsx` | 4 | `import { loadApplicantsFromStorage, saveApplicantsToStorage, ... } from '../utils/localStorage'` | `@compartido/lib` | Utils a compartido |
| `src/contexts/DevRoleContext.tsx` | 2 | `import type { Role } from '../shared/types'` | `@compartido/tipos` | Tipos a compartido |
| `src/contexts/useNotification.ts` | 6 | `import { NotificationContext } from './NotificationContext'` | `@compartido/lib` o relocate | Context a compartido |
| `src/contexts/hooks/useNotificationSelectors.ts` | 2-3 | `import ... from '../NotificationContext'` | `@compartido/lib` | Context a compartido |
| `src/contexts/hooks/useApplicantsSelectors.ts` | 2 | `import { useApplicants } from '../ApplicantsContext'` | `@compartido/lib` | Selector a compartido |

### Grupo 3.7: Features Legacy (src/features/)

| Archivo | Línea | Import Actual | Debe Ser | Acción |
|---------|-------|---------------|----------|--------|
| `src/features/RRHH/types.ts` | 1 | `import type { User, BaseEntity } from '../../shared/types'` | `@compartido/tipos` | Tipos a compartido |
| `src/features/RRHH/services.ts` | 1 | `import type { HRUser, HRDashboardData, HREmployeeCard } from './types'` | Relocate a @caracteristicas o migrar |  |
| `src/features/ADMINISTRADOR/services.ts` | 1 | `import type { AdminUser, AdminDashboardData } from './types'` | Relocate a @caracteristicas |  |
| `src/features/DESARROLLADOR/services.ts` | 1 | `import type { DeveloperUser, DeveloperDashboardData } from './types'` | Relocate a @caracteristicas |  |
| `src/features/LOGIN/services.ts` | 1 | `import type { LoginRequest, LoginResponse } from './types'` | `@caracteristicas/autenticacion` |  |

### Grupo 3.8: Hooks (src/hooks/)

| Archivo | Línea | Import Actual | Debe Ser | Acción |
|---------|-------|---------------|----------|--------|
| `src/hooks/useApplicantsTable.ts` | 2 | `import type { Applicant } from '../types'` | `@compartido/tipos` | Tipos a compartido |
| `src/hooks/useApplicantsSync.ts` | 12-15 | Multiple imports from '../types', '../repositories', '../api' | `@compartido/*` | Todos deben estar centralizados |
| `src/hooks/useEmployeesSync.ts` | 3-4 | Imports from '../types', '../types/events' | `@compartido/tipos` | Tipos a compartido |
| `src/features/SUPERVISOR_GTR/hooks/useLeadSubmit.ts` | 7 | `import type { NewLeadFormData } from './useNewLeadForm'` | Relocate to @caracteristicas |  |

### Grupo 3.9: Repositories (src/repositories/)

| Archivo | Línea | Import Actual | Debe Ser | Acción |
|---------|-------|---------------|----------|--------|
| `src/repositories/employee.repository.ts` | 7-8 | `import { http } from '../api/http'` `import type { EmpleadoResponse, ... } from '../types'` | `@compartido/api` y `@compartido/tipos` | Relocate |
| `src/repositories/applicant.repository.ts` | 15-21 | `import { rrhhHttp } from '../api/http'` imports from '../types' | `@compartido/api` y `@compartido/tipos` | Relocate |
| `src/repositories/contract.repository.ts` | 7-8 | `import { rrhhHttp } from '../api/http'` imports from '../types' | `@compartido/api` y `@compartido/tipos` | Relocate |

### Grupo 3.10: Services (src/services/)

| Archivo | Línea | Import Actual | Debe Ser | Acción |
|---------|-------|---------------|----------|--------|
| `src/services/employee.service.ts` | 7-11 | Multiple from './base.service', '../repositories', '../types' | `@compartido/*` | Relocate |
| `src/services/applicant.service.ts` | 14-18 | Multiple from './base.service', '../repositories', '../types' | `@compartido/*` | Relocate |
| `src/services/contract.service.ts` | 7-10 | Multiple from './base.service', '../repositories', '../types' | `@compartido/*` | Relocate |
| `src/services/auth.service.ts` | 10 | `import { authHttp, rrhhHttp } from '../api/http'` | `@compartido/api` | Relocate |

### Grupo 3.11: Types & Validation (src/types/, src/validation/)

| Archivo | Línea | Import Actual | Debe Ser | Acción |
|---------|-------|---------------|----------|--------|
| `src/types/events.ts` | 6 | `import type { Applicant, Employee } from './index'` | `@compartido/tipos` | Centralizar |
| `src/shared/types/lead.types.ts` | 10 | `import type { LeadChannel, LeadFollowUpStatus, LeadTipification, BusinessUnit } from './enums'` | `@compartido/tipos` | Reorganizar |
| `src/shared/types/advisor.types.ts` | 9 | `import type { AdvisorStatus, AdvisorArea } from './enums'` | `@compartido/tipos` | Reorganizar |
| `src/validation/applicant.schemas.ts` | - | Location: `src/validation/` | `@compartido/validacion` | Relocate |

---

## 📊 CATEGORÍA 4: IMPORTS INTERNOS DENTRO DE CAPAS FSD (CORRECTOS - Solo validar)

**Estos NO requieren cambios - están bien estructurados:**

```ts
// ✅ CORRECTO - Imports relativos locales dentro de la misma feature
src/widgets/barra-lateral/ui/Sidebar.tsx
  import { UserProfileComponent } from './UserProfile';

src/caracteristicas/gestion-leads/ui/NewLeadModal.tsx
  import type { NewLeadFormData } from '../hooks/useNewLeadForm';

src/caracteristicas/admin/ui/AdicionalesSection.tsx
  import type { Adicional } from '../types';
  import type { AdminDashboardState } from '../hooks/useAdminDashboard';

// ✅ CORRECTO - Index files que re-exportan desde carpetas
src/caracteristicas/gestion-leads/index.ts
  export * from './api';
  export * from './modelo';
  export * from './ui';
```

---

## 📊 CATEGORÍA 5: FILES QUE USAN MEZCLA DE PATRONES (LEGACY + FSD)

**Archivos parcialmente migrados que necesitan completar la transición:**

### Grupo 5.1: Features - RRHH

| Archivo | Línea | Import Actual | Debe Ser |
|---------|-------|---------------|----------|
| `src/features/RRHH/pages/EmployeeDashboard.tsx` | 7 | `import { useSidebar } from '@contexts/SidebarContext'` | RELOCATE: Context debe estar en @compartido |
| `src/features/RRHH/pages/EmployeeDashboard.tsx` | 8 | `import { StatCard } from '@molecules/StatCard'` | `@compartido/ui/moleculas` |
| `src/features/RRHH/pages/EmployeeDashboard.tsx` | 9 | `import { EmployeeTable } from '../components/organisms/Tables'` | `@caracteristicas/rrhh/ui/organismos` |
| `src/features/RRHH/pages/EmployeeDashboard.tsx` | 10 | `import { Pagination } from '@molecules/Pagination'` | `@compartido/ui/moleculas` |
| `src/features/RRHH/pages/EmployeeDashboard.tsx` | 11 | `import { Modal } from '@molecules/Modal'` | `@compartido/ui/moleculas` |
| `src/features/RRHH/pages/EmployeeDashboard.tsx` | 13 | `import { IconButton } from '@atoms/IconButton'` | `@compartido/ui/atomos` |
| `src/features/RRHH/pages/EmployeeDashboard.tsx` | 16 | `import { useNotification } from '@contexts/useNotification'` | `@compartido/lib` |
| `src/features/RRHH/pages/EmployeeDashboard.tsx` | 17 | `import { usePaginacion, useManejadorError } from '@compartido/ganchos'` | ✅ YA CORRECTO |
| `src/features/RRHH/pages/EmployeeDashboard.tsx` | 18 | `import { loadApplicantsFromStorage, ... } from '@utils/localStorage'` | `@compartido/lib` |
| `src/features/RRHH/pages/EmployeeDashboard.tsx` | 19 | `import type { Employee, ... } from '@types'` | `@compartido/tipos` |
| `src/features/RRHH/pages/EmployeeDashboard.tsx` | 20 | `import { FeatureErrorBoundary } from '@components/utilities'` | `@compartido/ui/organismos` |
| `src/features/RRHH/pages/EmployeeDashboard.tsx` | 21 | `import { ErrorLogger } from '@services'` | `@compartido/lib` |

### Grupo 5.2: Features - RECLUTAMIENTO

| Archivo | Línea | Import Actual | Debe Ser |
|---------|-------|---------------|----------|
| `src/features/RECLUTAMIENTO/pages/KanbanDashboard.tsx` | 3 | `import { Card } from '@molecules/Card'` | `@compartido/ui/moleculas` |
| `src/features/RECLUTAMIENTO/pages/KanbanDashboard.tsx` | 4 | `import { useApplicants } from '@contexts/ApplicantsContext'` | `@compartido/lib` |
| `src/features/RECLUTAMIENTO/pages/KanbanDashboard.tsx` | 5 | `import { useApplicantsSync } from '@caracteristicas/registrar-postulante/modelo/ganchos'` | ✅ CORRECTO (FSD) |
| `src/features/RECLUTAMIENTO/pages/KanbanDashboard.tsx` | 6 | `import { Modal } from '@molecules/Modal'` | `@compartido/ui/moleculas` |
| `src/features/RECLUTAMIENTO/pages/KanbanDashboard.tsx` | 7 | `import { DatePicker } from '@molecules/DatePicker/DatePicker'` | `@compartido/ui/moleculas` |
| `src/features/RECLUTAMIENTO/pages/KanbanDashboard.tsx` | 8 | `import type { Applicant } from '@types'` | `@compartido/tipos` |
| `src/features/RECLUTAMIENTO/pages/KanbanDashboard.tsx` | 9 | `import { FeatureErrorBoundary } from '@components/utilities'` | `@compartido/ui/organismos` |
| `src/features/RECLUTAMIENTO/pages/KanbanDashboard.tsx` | 10 | `import { ErrorLogger } from '@services'` | `@compartido/lib` |

### Grupo 5.3: Features - ASESOR_BACKOFFICE

| Archivo | Línea | Import Actual | Debe Ser |
|---------|-------|---------------|----------|
| `src/features/ASESOR_BACKOFFICE/pages/BackofficeAdvisorDashboard.tsx` | 25 | `import { useBackofficeLeads, useTipification } from '../../../hooks'` | `@caracteristicas/gestion-leads/modelo` |
| `src/features/ASESOR_BACKOFFICE/pages/BackofficeAdvisorDashboard.tsx` | 26 | `import { LeadsListPanel } from '../../../components/organisms/LeadsListPanel'` | `@widgets/lista-leads/ui/organismos` |
| `src/features/ASESOR_BACKOFFICE/pages/BackofficeAdvisorDashboard.tsx` | 27 | `import { TipificationPanel } from '../../../components/organisms/TipificationPanel'` | `@widgets/panel-tipificacion` |
| `src/features/ASESOR_BACKOFFICE/pages/BackofficeAdvisorDashboard.tsx` | 28 | `import type { LeadDTO } from '../../../shared/types'` | `@compartido/tipos` |
| `src/features/ASESOR_BACKOFFICE/pages/BackofficeAdvisorDashboard.tsx` | 29 | `import { FeatureErrorBoundary } from '@components/utilities'` | `@compartido/ui/organismos` |
| `src/features/ASESOR_BACKOFFICE/pages/BackofficeAdvisorDashboard.tsx` | 30 | `import { ErrorLogger } from '@services'` | `@compartido/lib` |

### Grupo 5.4: Features - SUPERVISOR_GTR

| Archivo | Línea | Import Actual | Debe Ser |
|---------|-------|---------------|----------|
| `src/features/SUPERVISOR_GTR/pages/GTRDashboard.tsx` | 54 | `import { StatCard } from '@molecules/StatCard'` | `@compartido/ui/moleculas` |
| `src/features/SUPERVISOR_GTR/pages/GTRDashboard.tsx` | 55 | `import type { DataTableColumn } from '@molecules/DataTable'` | `@compartido/ui/moleculas` |
| `src/features/SUPERVISOR_GTR/pages/GTRDashboard.tsx` | 56 | `import type { LeadDTO } from '@shared/types/lead.types'` | `@compartido/tipos` |
| `src/features/SUPERVISOR_GTR/pages/GTRDashboard.tsx` | 57 | `import type { AdvisorDTO } from '@shared/types/advisor.types'` | `@compartido/tipos` |
| `src/features/SUPERVISOR_GTR/pages/GTRDashboard.tsx` | 58-64 | Multiple from '../hooks/' | `@caracteristicas/gestion-leads/modelo` o `@caracteristicas/supervisar-leads/modelo` |
| `src/features/SUPERVISOR_GTR/pages/GTRDashboard.tsx` | 65 | `import { FeatureErrorBoundary } from '@components/utilities'` | `@compartido/ui/organismos` |
| `src/features/SUPERVISOR_GTR/pages/GTRDashboard.tsx` | 66 | `import { ErrorLogger } from '@services'` | `@compartido/lib` |

### Grupo 5.5: Components Legacy - Templates

| Archivo | Línea | Import Actual | Debe Ser |
|---------|-------|---------------|----------|
| `src/components/templates/DashboardTemplate/MainLayout.tsx` | 6 | `import RouterByRole from '../../../RouterByRole'` | Mejor: `@app` o usar context |
| `src/components/templates/DashboardTemplate/MainLayout.tsx` | 7 | `import { NotificationProvider } from '../../../contexts/NotificationContext'` | `@compartido/lib` |
| `src/components/templates/DashboardTemplate/MainLayout.tsx` | 8 | `import { useNotification } from '../../../contexts/useNotification'` | `@compartido/lib` |
| `src/components/templates/DashboardTemplate/MainLayout.tsx` | 9 | `import { useDevRole } from '../../../contexts/DevRoleContext'` | `@compartido/lib` o `@app` |
| `src/components/templates/DashboardTemplate/MainLayout.tsx` | 10 | `import { SidebarProvider, useSidebar } from '../../../contexts/SidebarContext'` | `@compartido/lib` |
| `src/components/templates/DashboardTemplate/MainLayout.tsx` | 11 | `import { ToastContainer } from '../../molecules/Toast'` | `@compartido/ui/moleculas` |

### Grupo 5.6: Entidades - Tipificación

| Archivo | Línea | Import Actual | Debe Ser |
|---------|-------|---------------|----------|
| `src/entidades/tipificacion/ui/moleculas/TipificationBlockPanel/TipificationBlockPanel.tsx` | 10 | `import type { TipificationBlock, TipificationOptionId } from '@shared/types'` | `@compartido/tipos` |
| `src/entidades/tipificacion/ui/moleculas/TipificationBlockPanel/TipificationBlockPanel.tsx` | 11 | `import { TipificationOption } from '@atoms/TipificationOption'` | `@compartido/ui/atomos` |

### Grupo 5.7: RRHH - Components

| Archivo | Línea | Import Actual | Debe Ser |
|---------|-------|---------------|----------|
| `src/features/RRHH/components/organisms/Tables/EmployeeTable.tsx` | 6 | `import type { Employee } from '../../../../../types'` | `@compartido/tipos` |
| `src/features/RRHH/components/organisms/Tables/EmployeeTable.tsx` | 8 | `import { StatusBadge } from '../../../../../components/atoms/Badge'` | `@compartido/ui/atomos` |

---

## 🎯 MAPA DE MIGRACIÓN POR DESTINO FSD

### Destino: @compartido/tipos
**Todos los archivos de tipos deben centralizarse aquí**
- `src/types/*` → Consolidar
- `src/shared/types/*` → Consolidar
- Type imports de `../../../types`
- `@shared/types`, `@shared/types/*` → Migrar

**Archivos afectados:** 50+ imports

### Destino: @compartido/lib
**Servicios, utilidades, hooks compartidos, contextos**
- `src/services/*` → Repositorios, servicios base
- `src/utils/*` → Utilidades generales
- `src/contexts/*` → Contextos compartidos
- `src/repositories/*` → Repositorios centralizados
- `src/hooks/*` de carácter general

**Archivos afectados:** 40+ imports

### Destino: @compartido/ui/atomos
**Componentes atómicos reutilizables**
- `@atoms/*` → Cuando lo uses
- `src/components/atoms/*` → Todos
- `src/components/molecules/Button/*`, `Input/*`, etc.

**Archivos afectados:** 25+ imports

### Destino: @compartido/ui/moleculas
**Componentes moleculares reutilizables**
- `@molecules/*` → Cuando lo uses
- `src/components/molecules/*` → Todos

**Archivos afectados:** 30+ imports

### Destino: @compartido/ui/organismos
**Componentes organisms reutilizables**
- `@organisms/*` → Cuando lo uses
- `src/components/organisms/*` → ErrorBoundary, Layout components

**Archivos afectados:** 15+ imports

### Destino: @compartido/validacion
**Schemas y validación centralizada**
- `src/validation/*` → Todos los schemas
- Imports de `../../../validation/schemas`

**Archivos afectados:** 10+ imports

### Destino: @compartido/api
**Cliente HTTP y servicios base**
- `src/api/http.ts` → `@compartido/api`
- `src/compartido/api/clienteHttp.ts` → Verificar consolidación

**Archivos afectados:** 8+ imports

### Destino: @app
**Configuración y punto de entrada**
- `src/config/*` → `@app/configuracion`
- `src/App.tsx` → `@app/App`
- `src/main.tsx` → Punto de entrada
- `src/RouterByRole.tsx` → `@app/RouterByRole`

**Archivos afectados:** 12+ imports

### Destino: @paginas/{rol}
**Páginas por rol**
- `src/features/RRHH/pages/*` → `@paginas/rrhh`
- `src/features/RECLUTAMIENTO/pages/*` → `@paginas/reclutamiento`
- `src/features/ADMINISTRADOR/*` → `@paginas/administrador`
- Etc. para cada rol

**Archivos afectados:** 10+ imports

### Destino: @caracteristicas/{feature}
**Features específicas**
- Hooks y lógica de features
- Formularios de características
- Ya parcialmente migrados

**Archivos afectados:** Varios

### Destino: @widgets/{nombre}
**Componentes grandes reutilizables**
- `src/components/organisms/TipificationPanel` → `@widgets/panel-tipificacion`
- `src/components/organisms/LeadsListPanel` → `@widgets/lista-leads`
- Ya parcialmente migrados

**Archivos afectados:** 5+ imports

### Destino: @entidades/{entidad}
**Modelos de dominio**
- `src/entidades/tipificacion/*` → Ya existe
- `src/entidades/postulante/*` → Ya existe
- `src/entidades/usuario/*` → Ya existe

**Archivos afectados:** Varios

---

## 📈 ESTADÍSTICAS DE MIGRACIÓN

| Categoría | Cantidad | Prioridad | Estado |
|-----------|----------|-----------|--------|
| Alias antiguos (@shared, @atoms, etc.) | ~30 | 🔴 CRÍTICO | No iniciad |
| Rutas relativas ../../../ | ~25 | 🔴 CRÍTICO | No iniciado |
| Imports de src/components | ~20 | 🟡 ALTA | No iniciado |
| Imports de src/contexts | ~15 | 🟡 ALTA | No iniciado |
| Imports de src/services | ~15 | 🟡 ALTA | No iniciado |
| Imports de src/features (legacy) | ~20 | 🟡 ALTA | Parcial |
| Imports dentro de FSD (locales) | ~50 | 🟢 BAJA | ✅ CORRECTO |
| **TOTAL** | **~175** | | **0% completado** |

---

## 🚀 PLAN DE ACCIÓN RECOMENDADO

### FASE 1: Centralizar Tipos (CRÍTICO)
1. Consolidar todos los types en `@compartido/tipos/indice.ts`
2. Actualizar imports en:
   - Todos los `../../../types` → `@compartido/tipos`
   - Todos los `@shared/types` → `@compartido/tipos`
   - `src/types/*` → Migrar a @compartido/tipos

**Duración estimada:** 2-3 horas
**Archivos afectados:** 50+ imports

### FASE 2: Centralizar Servicios Base (CRÍTICO)
1. Mover `src/services/*` → `@compartido/lib/servicios`
2. Mover `src/repositories/*` → `@compartido/lib/repositorios`
3. Actualizar imports de `../../../repositories`

**Duración estimada:** 1-2 horas
**Archivos afectados:** 15+ imports

### FASE 3: Centralizar Validación
1. Consolidar `src/validation/*` → `@compartido/validacion`
2. Actualizar imports de `../../../validation`

**Duración estimada:** 30 minutos
**Archivos afectados:** 10+ imports

### FASE 4: Centralizar Contextos
1. Mover contextos compartidos → `@compartido/lib`
2. Actualizar imports de `../contexts`

**Duración estimada:** 1 hora
**Archivos afectados:** 15+ imports

### FASE 5: Centralizar UI Compartida
1. Mover `src/components/atoms/*` → `@compartido/ui/atomos`
2. Mover `src/components/molecules/*` → `@compartido/ui/moleculas`
3. Actualizar imports de `@atoms/*`, `@molecules/*`

**Duración estimada:** 2-3 horas
**Archivos afectados:** 55+ imports

### FASE 6: Migrar Features (features/ → caracteristicas/)
1. El 80% ya está en @caracteristicas
2. Actualizar imports de `../../../types`, etc. en archivos de features

**Duración estimada:** 1-2 horas
**Archivos afectados:** 20+ imports

### FASE 7: Migrar Páginas (features/ → paginas/)
1. Mover features de dashboard → paginas por rol
2. Actualizar imports de RouterByRole

**Duración estimada:** 2 horas
**Archivos afectados:** 12+ imports

### FASE 8: App Config (@app)
1. Centralizar config, env, RouterByRole
2. Actualizar imports de `./config`, `./utils`

**Duración estimada:** 1 hora
**Archivos afectados:** 12+ imports

---

## ⚠️ NOTAS IMPORTANTES

1. **Alias antiguos causarán errores:** Todos los imports con `@shared`, `@atoms`, `@molecules`, `@contexts`, `@utils`, `@services` causan compilación fallida.

2. **Rutas relativas profundas:** Dificultan mantenimiento. Usar alias es mejor.

3. **Sin migración = 100+ errores TS:** El proyecto NO compilará hasta que se resuelvan estos imports.

4. **Order de migración importa:** Migrar tipos PRIMERO, luego servicios, luego UI.

5. **Tests:** Actualizar imports en archivos .test.tsx también.

---

## 📝 Script de Verificación (Próximo paso)

Cuando estés listo para migrar, usar:
```bash
npm run build 2>&1 | grep "Cannot find"  # Ver errores de imports
```

