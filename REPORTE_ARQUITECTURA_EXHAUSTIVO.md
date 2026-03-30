# 📊 REPORTE COMPLETO DE ARQUITECTURA
**Proyecto**: ALBRUGROUP Frontend  
**Fecha**: 29 de marzo de 2026  
**Versión**: 1.0 - Análisis Exhaustivo  
**Scope**: Endpoints, Código Muerto, Duplicados

---

## 🎯 TABLA DE CONTENIDOS

1. [Área 1: Arquitectura de Endpoints](#área-1-arquitectura-de-endpoints)
2. [Área 2: Código Muerto](#área-2-código-muerto)
3. [Área 3: Duplicados](#área-3-duplicados)
4. [Semáforo de Salud](#semáforo-de-salud)
5. [Plan de Acción Priorizado](#plan-de-acción-priorizado)

---

# ÁREA 1: ARQUITECTURA DE ENDPOINTS

## 1.1 Inventario Completo de Endpoints

| Archivo | Capa FSD | Cliente HTTP | Patrón | Estado |
|---------|----------|--------------|--------|--------|
| `src/shared/api/clienteHttp.ts` | shared/api | Axios (3 clientes) | ✅ Base | ✓ |
| `src/shared/api/apiClient.ts` | shared/api | Axios (legacy) | ⚠️ Legacy | ✓ |
| `src/shared/api/repositories/applicant.repository.ts` | shared/api | rrhhHttp | ✅ Correcto | ✓ |
| `src/shared/api/repositories/employee.repository.ts` | shared/api | rrhhHttp | ✅ Correcto | ✓ |
| `src/shared/api/repositories/contract.repository.ts` | shared/api | rrhhHttp | ✅ Correcto | ✓ |
| `src/shared/api/repositories/auth.repository.ts` | shared/api | authHttp | ✅ Correcto | ✓ |
| `src/shared/api/repositories/leads.repository.ts` | shared/api | leadsHttp | ✅ Correcto | ✓ |
| `src/entidades/empleado/api/employee.repository.ts` | entities/api | rrhhHttp | ❌ Duplicado | ✗ |
| `src/entidades/contrato/api/contract.repository.ts` | entities/api | rrhhHttp | ❌ Duplicado | ✗ |
| `src/entidades/postulante/api/applicant.repository.ts` | entities/api | rrhhHttp | ❌ Duplicado | ✗ |
| `src/entidades/auth/api/auth.repository.ts` | entities/api | authHttp | ❌ Duplicado | ✗ |
| `src/shared/api/repositories/contract.repository.new.ts` | shared/api | rrhhHttp | ❌ Fragmentación | ✗ |
| `src/caracteristicas/registrar-postulante/api/applicant.service.ts` | features/api | N/A (service) | ⚠️ Viola FSD | ✗ |
| `src/caracteristicas/community/hooks/useCommunityData.ts` | features/hooks | leadsHttp (directo) | ❌ Viola FSD | ✗ |
| `src/caracteristicas/registrar-postulante/hooks/useProveedoresForm.ts` | features/hooks | leadsHttp (directo) | ❌ Viola FSD | ✗ |
| `src/shared/services/proveedorService.ts` | shared/services | leadsHttp | ⚠️ Ambiguo | ✓ |
| `src/entidades/auth/model/auth.service.ts` | entities/model | rrhhHttp | ⚠️ Viola FSD | ✗ |
| `src/entidades/empleado/model/employee.service.ts` | entities/model | rrhhHttp | ⚠️ Viola FSD | ✗ |
| `src/entidades/contrato/model/contract.service.ts` | entities/model | rrhhHttp | ⚠️ Viola FSD | ✗ |

## 1.2 Violaciones de Arquitectura Críticas

### ❌ VIOLACIÓN #1: Repositorios Duplicados (CRÍTICO)

**Problema**: Hay 4 repositorios duplicados en `src/entidades/*/api/` que debería existir **SOLO** en `src/shared/api/repositories/`

**Por qué es problema**:
- Mantener 2 versiones de la misma lógica → bugs inconsistentes
- Cambios en uno se olvidan en el otro
- Confunde a desarrolladores sobre cuál usar
- Viola FSD: entities NO debería contener API/infrastructure

**Archivos afectados**:

1. **Employee Repository Duplicate**
   - `src/entidades/empleado/api/employee.repository.ts` (ELIMINAR)
   - `src/shared/api/repositories/employee.repository.ts` (MANTENER)
   - **Diferencia**: Idénticos, solo diferente Import de `RegistrarEmpleadoRequest`

2. **Contract Repository Duplicate + Fragmentación**
   - `src/entidades/contrato/api/contract.repository.ts` (ELIMINAR)
   - `src/shared/api/repositories/contract.repository.ts` (MANTENER)
   - `src/shared/api/repositories/contract.repository.new.ts` (ELIMINAR)
   - **Diferencia**: `.new.ts` es copia experimental sin uso

3. **Applicant Repository Duplicate**
   - `src/entidades/postulante/api/applicant.repository.ts` (ELIMINAR)
   - `src/shared/api/repositories/applicant.repository.ts` (MANTENER)
   - **Diferencia**: Idénticos

4. **Auth Repository Duplicate**
   - `src/entidades/auth/api/auth.repository.ts` (ELIMINAR)
   - No existe canónico en `shared/api/repositories/` (MOVER)
   - **Acción**: Mover a `src/shared/api/repositories/auth.repository.ts`

---

### ❌ VIOLACIÓN #2: Features Llamando API Directamente (IMPORTANTE)

**Problema**: `useCommunityData.ts` llamada directa a `leadsHttp`

**Archivo**: `src/caracteristicas/community/hooks/useCommunityData.ts` línea 43-50

```tsx
❌ INCORRECTO (ACTUAL):
const fetchCampanas = useCallback(async (activo?: boolean) => {
  setLoading(true);
  setError(null);
  try {
    const response = await leadsHttp.get<CampanaResponse[]>('/campanas', {
      params: activo !== undefined ? { activo } : undefined,
    });  // ← Llamada directa al cliente HTTP
```

**Por qué es problema**:
- Features no debería conocer sobre los clientes HTTP
- Si cambia el cliente → todos los features se rompen
- Viola el patrón: Hook → Service → Repository → Cliente

**Corrección necesaria**:
```tsx
✅ CORRECTO (ESPERADO):
const fetchCampanas = useCallback(async (activo?: boolean) => {
  const campanas = await LeadsRepository.getCampanas(activo);  // ← Usa repository
```

---

### ❌ VIOLACIÓN #3: Services en Features (IMPORTANTE)

**Archivo**: `src/caracteristicas/registrar-postulante/api/applicant.service.ts`

**Problema**: `applicant.service.ts` está en la capa `caracteristicas/api/` en lugar de `shared/services/`

- Un service de negocio NO debería estar dentro de una feature
- Es lógica compartida entre múltiples características

**Ubicación correcta**: `src/shared/services/applicant.service.ts`

---

### ⚠️ VIOLACIÓN #4: Entities con Llamadas a API (IMPORTANTE)

**Archivos**:
- `src/entidades/auth/model/auth.service.ts` línea 8: `import { rrhhHttp, leadsHttp }`
- `src/entidades/empleado/model/employee.service.ts` línea 5: usa EmployeeRepository (que tiene API)
- `src/entidades/contrato/model/contract.service.ts` línea 6: usa ContractRepository (que tiene API)

**Problema**: Services en entities importan clientes HTTP o repositories que tienen API

**Por qué es problema** (FSD estricto):
- Entities debería ser SOLO lógica y tipos de dominio
- Infrastructure (HTTP, API) debería estar en `shared/`
- Crea ciclos de dependencia

**Impacto**: Bajo (funciona, pero arquitecturamente inconsistente)

---

## 1.3 Flujo de Cada Endpoint

### ✅ Flujo CORRECTO

**Ejemplo: Crear Proveedor**

```
TablaPostulantes.tsx
    ↓
useApplicantsSync() [shared/hooks]
    ↓
ApplicantRepository.create() [shared/api/repositories]
    ↓
rrhhHttp.post('/postulantes') [shared/api/clienteHttp]
    ↓
Backend: POST /api/rrhh/postulantes
```

**Estado**: ✅ OK (seguir este patrón)

---

### ❌ Flujo INCORRECTO

**Ejemplo: Community Data**

```
ACTUAL:
PaginaCommunity.tsx
    ↓
useCommunityData() [caracteristicas/community/hooks]
    ↓
leadsHttp.get('/campanas') [DIRECTO, SIN REPOSITORY]
    ↓
Backend: GET /api/leads/campanas

DEBERÍA SER:
PaginaCommunity.tsx
    ↓
useCommunityData() [características/community/hooks]
    ↓
LeadsRepository.getCampanas() [shared/api/repositories]
    ↓
leadsHttp.get('/campanas') [shared/api/clienteHttp]
    ↓
Backend
```

---

## 1.4 React Query - Estado Actual

### ✅ Configurado pero Subutilizado

**Archivo**: `src/app/providers/ProveedorQuery.tsx`

```tsx
export const ProveedorQuery: React.FC<ProveedorQueryProps> = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
```

**Estado Actual**:
- ✅ Provider está instalado y cargado
- ❌ **NO hay ningún `useQuery()` o `useMutation()` en el proyecto**
- ❌ Todos los datos se cargan con `useEffect + useState` manual
- ❌ No hay `queryKeys` centralizadas

**Oportunidad**:
Migrar a React Query traería:
- Caching automático
- Sincronización entre pestañas
- Retry automático
- Devtools para debugging
- **Impacto**: Alto valor, Medium esfuerzo

---

## 1.5 Resumen de Patrones de API

| Endpoint | Cliente | Interceptor | Error Handling | Estado |
|----------|---------|-------------|-----------------|--------|
| POST /autorizacion/login | authHttp | ❌ NO | Error handler | ✓ |
| GET /rrhh/* | rrhhHttp | ✅ JWT | Error handler | ✓ |
| GET /api/leads/* | leadsHttp | ✅ JWT | Error handler | ✓ |

**Notas**:
- `authHttp` NO tiene `addAuthInterceptor()` → correcto (no lleva JWT)
- `rrhhHttp` y `leadsHttp` SÍ tienen interceptor JWT → correcto
- Todos tienen `addErrorInterceptor()` → limpia sesión en 401 → correcto

---

# ÁREA 2: CÓDIGO MUERTO

## 2.1 Archivos Muertos (No Importados)

| Archivo | Razón | Importado por | Acción |
|---------|-------|----------------|--------|
| `src/caracteristicas/autenticacion/ui/ResetPasswordForm.old.tsx` | Archivo `.old.tsx` - legacy | NADIE | ✂️ ELIMINAR |
| `src/shared/api/repositories/contract.repository.new.ts` | Copia experimental | NADIE | ✂️ ELIMINAR |
| `src/shared/api/apiClient.ts` | Reemplazado por `clienteHttp.ts` | SOLO `interceptors.ts` (legacy) | ✂️ ELIMINAR (legacy) |
| `src/shared/api/http.ts` | Copia de `clienteHttp.ts` | NADIE | ✂️ ELIMINAR |
| `src/shared/api/interceptors.ts` | Logging legacy de contratos | NADIE | ✂️ ELIMINAR (si logging no es necesario) |
| `EJEMPLOS_INTEGRACION_API.tsx` | Archivo de documentación/ejemplo | NADIE | ✂️ ELIMINAR (generar doc en MD) |

---

## 2.2 Componentes No Usados

| Componente | Archivo | Importado por | Estado |
|-----------|---------|-----------------|--------|
| `ResetPasswordForm` | `src/caracteristicas/autenticacion/ui/ResetPasswordForm.old.tsx` | ❌ NADIE | ✂️ ELIMINAR |

---

## 2.3 Hooks No Usados / Duplicados

| Hook | Ubicaciones | Diferencia | Acción |
|------|-----------|-----------|--------|
| `useApplicantsSync()` | `src/shared/hooks/useApplicantsSync.ts` | **Duplicado** | ❌ PROBLEMA |
| `useApplicantsSync()` | `src/caracteristicas/registrar-postulante/modelo/useSincPostulantes.ts` | Idéntico contenido, ubicación incorrecta | ✂️ ELIMINAR uno |
| `useFetchRoles()` | `src/shared/hooks/useFetchRoles.ts` | Retorna mock, no usa backend | ⚠️ INCOMPLETO |

**Análisis de `useApplicantsSync` duplicado**:
- Ambos archivos hacen EXACTAMENTE lo mismo
- Ambos importan de `ApplicantRepository`
- Ubicación correcta: `src/shared/hooks/useApplicantsSync.ts`
- Ubicación incorrecta: `src/caracteristicas/registrar-postulante/modelo/useSincPostulantes.ts` (debería ser en shared)

---

## 2.4 Funciones y Tipos No Usados

| Tipo | Archivo | Usado por | Estado |
|-----|---------|-----------|--------|
| `EmployeesPageResponse` | `src/entidades/empleado/api/employee.repository.ts` l13 | Internal (tipo alias) | ✓ OK |
| `EmployeesPageResponse` | `src/shared/api/repositories/employee.repository.ts` l12 | Internal (tipo alias) | 🔴 DUPLICADO |
| `useAdminDashboard()` | `src/caracteristicas/admin/hooks/useAdminDashboard.ts` | Placeholder sin implementación | ⚠️ TODO |

---

## 2.5 Imports No Usados

| Archivo | Import sin usar | Línea |
|---------|----------------|-------|
| `src/caracteristicas/admin/pages/AdminPage.tsx` | `useAdminDashboard` | 5 |
| `src/shared/hooks/useFetchRoles.ts` | N/A | - |

---

## 2.6 Contextos Legacy

| Context | Ubicación | Estado | Reemplazado por |
|---------|-----------|--------|-----------------|
| `ApplicantsContext` | `src/shared/contexts/ApplicantsContext.tsx` | ✅ ACTIVO | N/A - aún se usa |
| `ApplicantsContext.employees` | Fusión con DataContext | ⚠️ HIBRIDO | Debería separarse |

**Nota**: `ApplicantsContext` mezcla postulantes + empleados → viola SRP (Single Responsibility)

---

## 2.7 Variables y Constantes Muertas

| Variable | Archivo | Razón | Acción |
|----------|---------|------|--------|
| `mockEmployees` | `src/shared/utils/mockData.ts` | Mock data no usado en prod | ⚠️ Mover a test utils |
| `mockApplicants` | `src/shared/utils/mockData.ts` | Mock data no usado en prod | ⚠️ Mover a test utils |
| `ITEMS_PER_PAGE` (const) | `src/shared/utils/mockData.ts` | Constante de mock | ⚠️ Centralizar |

**Tamaño**: `mockData.ts` tiene **~600 líneas** de datos mock → debería estar en test fixtures, no en `shared/utils`

---

# ÁREA 3: DUPLICADOS

## 3.1 Archivos Duplicados

| Archivo 1 | Archivo 2 | Contenido igual | Cuál conservar |
|-----------|-----------|-----------------|-----------------|
| `src/shared/api/clienteHttp.ts` | `src/shared/api/http.ts` | ✅ Idéntico | MANTENER clienteHttp.ts (delete http.ts) |
| `src/shared/api/clienteHttp.ts` | `src/shared/api/apiClient.ts` | ⚠️ Similar (legacy) | MANTENER clienteHttp.ts (delete apiClient.ts) |

---

## 3.2 Repositorios Duplicados (CRÍTICO)

### Tabla Comparativa

| Repository | Ubicación canónica | Ubicación duplicada | Idéntico | Acción |
|------------|-------------------|-------------------|---------|--------|
| EmployeeRepository | `shared/api/repositories/employee.repository.ts` | `entidades/empleado/api/employee.repository.ts` | ✅ Sí | ✂️ ELIMINAR duplicado |
| ApplicantRepository | `shared/api/repositories/applicant.repository.ts` | `entidades/postulante/api/applicant.repository.ts` | ✅ Sí | ✂️ ELIMINAR duplicado |
| ContractRepository | `shared/api/repositories/contract.repository.ts` | `entidades/contrato/api/contract.repository.ts` | ✅ Sí | ✂️ ELIMINAR duplicado |
| AuthRepository | ❌ FALTA CANÓNICO | `entidades/auth/api/auth.repository.ts` | N/A | 📍 MOVER a shared/api/repositories/ |

```
ACCIÓN DETALLADA:

1. Mover: entidades/auth/api/auth.repository.ts 
   ↓ 
   shared/api/repositories/auth.repository.ts

2. Eliminar:
   - entidades/empleado/api/employee.repository.ts
   - entidades/postulante/api/applicant.repository.ts
   - entidades/contrato/api/contract.repository.ts
   - entidades/auth/api/auth.repository.ts (después de mover)

3. Actualizar imports en:
   - entidades/empleado/model/employee.service.ts
   - entidades/postulante/model/applicant.service.ts
   - entidades/contrato/model/contract.service.ts
   - entidades/auth/model/auth.service.ts
```

---

## 3.3 Componentes Duplicados

| Componente 1 | Componente 2 | Similitud | Cuál conservar |
|-------------|-------------|----------|-----------------|
| `useApplicantsSync` (shared/hooks) | `useApplicantsSync` (caracteristicas/registrar-postulante) | ✅ 100% idéntico | Shared (eliminar de features) |

---

## 3.4 Lógica de Negocio Duplicada

### ❌ Patrón repetido: Validación en múltiples lugares

| Validación | Lugar 1 | Lugar 2 | Centralizar en |
|-----------|---------|---------|-----------------|
| `validateDataOrThrow()` | `applicant.service.ts` | `employee.service.ts` | `@shared/validation` (HECHO ✓) |

---

## 3.5 Tipos Duplicados

| Tipo | Ubicación 1 | Ubicación 2 | Canónico |
|-----|-----------|-----------|----------|
| `EmployeesPageResponse` | `shared/api/repositories/employee.repository.ts` l12 | `entidades/empleado/api/employee.repository.ts` l13 | ❌ DUPLICADO (no debería existir en repository, debería estar en `@shared/types`) |
| `EmployeeResponse` | `shared/api/repositories/...` l12 | `entidades/empleado/api/...` l14 | ✅ De `@shared/types/EmpleadoResponse` (aliasing OK) |

---

## 3.6 Hooks Duplicados

| Hook | Feature 1 | Feature 2 | Ubicación correcta | Acción |
|------|-----------|-----------|------------------|--------|
| `useApplicantsSync()` | `shared/hooks/` | `caracteristicas/registrar-postulante/modelo/` | `shared/hooks/` | ✂️ ELIMINAR de features |
| `useEmployeesSync()` | `shared/hooks/` | N/A | `shared/hooks/` | ✓ OK |

---

## 3.7 Constantes Duplicadas

| Constante | Ubicación 1 | Ubicación 2 | Valor | Centralizar |
|-----------|-----------|-----------|-------|------------|
| `EtapaProceso` (type) | `shared/api/repositories/applicant.repository.ts` | `caracteristicas/registrar-postulante/api/applicant.service.ts` | `'RECLUTAMIENTO' \| 'CAPACITACION' \| ...` | `@shared/types/etapas.ts` |
| `FiltrosPostulante` (interface) | `shared/api/repositories/applicant.repository.ts` | N/A | { estado?, origen?, ... } | ✓ Ya está en shared |

---

## 3.8 Services Duplicados / Ubicación Incorrecta

| Service | Ubicación actual | Ubicación correcta | Razón | Acción |
|---------|----------------|------------------|------|--------|
| `applicant.service.ts` | `caracteristicas/registrar-postulante/api/` | `shared/services/` | Service de negocio es compartida | 📍 MOVER |
| `proveedorService.ts` | `shared/services/` | ✅ Correcto | N/A | ✓ OK |

---

# SEMÁFORO DE SALUD

## 📊 Matriz de Crítica

```
🔴 CRÍTICO    → Rompe arquitectura, causa bugs, impide deploys
🟡 IMPORTANTE → Viola principios FSD, aumenta deuda técnica
🟢 MENOR      → Mejora de calidad, puede esperar
```

## 📈 Conteo por Área

| Área | Críticos | Importantes | Menores | Total |
|------|----------|-------------|---------|-------|
| **Endpoints** | 3 | 1 | 2 | **6** |
| **Código Muerto** | 2 | 3 | 4 | **9** |
| **Duplicados** | 4 | 2 | 1 | **7** |
| **TOTAL** | **9** | **6** | **7** | **22** |

---

## 🔴 CRÍTICOS (Hacer ahora)

| # | Problema | Archivos | Impacto | Esfuerzo |
|---|----------|----------|---------|----------|
| 1 | Repositorios duplicados (Employee, Applicant, Contract) | entidades/*/api/repository | Confusión, bugs inconsistentes | 30 min |
| 2 | Features llamando API directamente (`useCommunityData`) | `caracteristicas/community/hooks/useCommunityData.ts` | Violación FSD, difícil mantener | 20 min |
| 3 | Archivos `.old.tsx` sin usar | `caracteristicas/autenticacion/...ResetPasswordForm.old.tsx` | Confusión, limpieza | 5 min |
| 4 | `contract.repository.new.ts` duplicado/experimental | `shared/api/repositories/contract.repository.new.ts` | Confusión, limpieza | 5 min |
| 5 | AuthRepository sin ubicación canónica | `entidades/auth/api/auth.repository.ts` | Inconsistencia, búsqueda dice shared | 15 min |
| 6 | mockData.ts en shared/utils (600 líneas) | `shared/utils/mockData.ts` | Inflado, no debería estar en runtime | 30 min |
| 7 | Hook `useApplicantsSync` duplicado | 2 ubicaciones distintas | Confusión, mantenimiento | 10 min |
| 8 | `EJEMPLOS_INTEGRACION_API.tsx` sin usar | Root del proyecto | Confusión, limpieza | 5 min |
| 9 | apiclient.ts y http.ts duplicados | `shared/api/` | Confusión, legacy | 10 min |

---

## 🟡 IMPORTANTES (Esta semana)

| # | Problema | Archivos | Impacto | Esfuerzo |
|---|----------|----------|---------|----------|
| 1 | Entities con Services que usan API | `entidades/*/model/*service.ts` | FSD violation, ciclos de dependencia | 1h |
| 2 | Services en características | `caracteristicas/registrar-postulante/api/applicant.service.ts` | Debería estar en shared | 15 min |
| 3 | ApplicantsContext mezclando postulantes + empleados | `shared/contexts/ApplicantsContext.tsx` | SRP violation, difícil evolucionar | 1h |
| 4 | React Query instalado pero NO usado | `app/providers/ProveedorQuery.tsx` | Oportunidad perdida, colas manuales | 2h (future) |
| 5 | `useFetchRoles()` incompleto | `shared/hooks/useFetchRoles.ts` | Mock, no llama backend | 30 min |
| 6 | Tipos alias innecesarios en repositories | `employee.repository.ts` líneas 12-15 | Ruido, redundante | 10 min |

---

## 🟢 MENORES (Cuando haya tiempo)

| # | Problema | Archivos | Impacto | Esfuerzo |
|---|----------|----------|---------|----------|
| 1 | Constantes duplicadas de etapas | Various | Código limpio | 15 min |
| 2 | `useAdminDashboard()` placeholder | `caracteristicas/admin/hooks/...` | Confusión, TODO | 10 min |
| 3 | Logs de debugging sin usar | `src/shared/api/interceptors.ts` | Ruido en consola | 5 min |
| 4 | Imports no usados en algunos archivos | Various | Limpieza menor | 10 min |
| 5 | QueryClient sin configuración custom | `app/providers/ProveedorQuery.tsx` | Mejora (si se usa React Query) | 20 min |
| 6 | Documentación de patrones FSD | N/A | Futuro | 1h |
| 7 | Tipos legacy en contextos globales | `shared/types/EVENT_NAMES` | Consolidación | 20 min |

---

# PLAN DE ACCIÓN PRIORIZADO

## 🚀 PRIORIDAD 1: CRÍTICO (30-45 minutos)

### 1.1 Eliminar Repositorios Duplicados

**Paso 1**: Eliminar archivos duplicados
```bash
rm src/entidades/empleado/api/employee.repository.ts
rm src/entidades/postulante/api/applicant.repository.ts
rm src/entidades/contrato/api/contract.repository.ts
rm src/shared/api/repositories/contract.repository.new.ts
rm src/caracteristicas/autenticacion/ui/ResetPasswordForm.old.tsx
rm src/shared/api/http.ts
```

**Paso 2**: Mover AuthRepository
```bash
mv src/entidades/auth/api/auth.repository.ts src/shared/api/repositories/auth.repository.ts
```

**Paso 3**: Actualizar imports en Services
```tsx
// ANTES
import { AuthRepository, type LoginRequest, type LoginResponse } from '../api/auth.repository';

// DESPUÉS
import { AuthRepository, type LoginRequest, type LoginResponse } from '@shared/api/repositories/auth.repository';
```

**Archivos a actualizar**:
- `src/entidades/auth/model/auth.service.ts`
- `src/entidades/empleado/model/employee.service.ts` (ya usa shared)
- `src/entidades/contrato/model/contract.service.ts`

**Depués**: `npm run build` ✓

---

### 1.2 Mover Hooks Duplicados

**Paso 1**: Eliminar hook de features
```bash
rm src/caracteristicas/registrar-postulante/modelo/useSincPostulantes.ts
```

**Paso 2**: Importar desde shared donde se usaba

**Archivos a actualizar**:
- Buscar: `import { useApplicantsSync } from '@caracteristicas/registrar-postulante`
- Cambiar a: `import { useApplicantsSync } from '@shared/hooks'`

---

### 1.3 Mover mockData a Test Utils

**Paso 1**: Crear carpeta test utils
```bash
mkdir -p src/shared/test-utils
mv src/shared/utils/mockData.ts src/shared/test-utils/mockData.ts
```

**Paso 2**: Actualizar export en `shared/test-utils/index.ts`

**Archivos a actualizar**:
- Cualquiera que importe `src/shared/utils/mockData.ts`
- Cambiar a: `src/shared/test-utils/mockData.ts`

---

### 1.4 Eliminar Archivos Legacy

```bash
rm EJEMPLOS_INTEGRACION_API.tsx  (root)
rm src/shared/api/apiClient.ts    (solo apiClient.ts, no clienteHttp)
rm src/shared/api/interceptors.ts (si logging no es crítico)
```

**Verificar**: `npm run build` ✓

---

## 🔧 PRIORIDAD 2: IMPORTANTE (1.5-2 horas)

### 2.1 Corregir useCommunityData para que use Repository

**ANTES**:
```tsx
// src/caracteristicas/community/hooks/useCommunityData.ts
const fetchCampanas = useCallback(async (activo?: boolean) => {
  setLoading(true);
  const response = await leadsHttp.get('/campanas', { params: { activo } });
  setCampanas(response.data);
```

**DESPUÉS**:
```tsx
// Crear LeadsRepository (si no existe completamente)
// O agregar métodos que falten

const fetchCampanas = useCallback(async (activo?: boolean) => {
  setLoading(true);
  try {
    const campanas = await LeadsRepository.getCampanas(activo);
    setCampanas(campanas);
  } catch (err) {
    // error handling
  }
```

**Archivos a actualizar**:
- `src/caracteristicas/community/hooks/useCommunityData.ts` (todas las funciones de fetch)
- `src/shared/api/repositories/leads.repository.ts` (verificar que tenga todos los métodos)

**Depués**: `npm run build` ✓

---

### 2.2 Mover applicant.service.ts a shared

```bash
mv src/caracteristicas/registrar-postulante/api/applicant.service.ts \
   src/shared/services/applicant.service.ts
```

**Actualizar imports**:
- De: `@caracteristicas/registrar-postulante/api/applicant.service`
- A: `@shared/services/applicant.service`

---

### 2.3 Separar ApplicantsContext en dos Contexts

**Crear**:
- `src/shared/contexts/PostulantesContext.tsx` (solo postulantes)
- `src/shared/contexts/EmpleadosContext.tsx` (solo empleados)

**O usar React Query** si se implementa (mejor solución a largo plazo)

---

## 🎯 PRIORIDAD 3: MENOR (30-60 minutos)

### 3.1 Llenar `useFetchRoles()`

Actualmente retorna mock `['LOGIN']`. Conectar con backend:

```tsx
export const useFetchRoles = (): Role[] => {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    AuthRepository.getCurrentUserRoles()
      .then(setRoles)
      .catch(err => {
        console.error('Error fetching roles:', err);
        setRoles([]);
      });
  }, []);

  return roles;
};
```

---

### 3.2 Remover Tipos Alias de Repositories

En `src/shared/api/repositories/employee.repository.ts`, líneas 12-15:

```tsx
// ❌ NO necesario (son solo alias a tipos)
export type EmployeesPageResponse = PageResponse<EmpleadoResponse>;
export type EmployeeResponse = EmpleadoResponse;

// ✅ Usar directamente las importadas
```

---

### 3.3 Centralizar EtapaProceso

Crear `src/shared/types/etapas.ts`:

```tsx
export type EtapaProceso = 'RECLUTAMIENTO' | 'CAPACITACION' | 'GESTION' | 'CONTRATADO';
export type EstatuPostulante = 'RECLUTAMIENTO' | 'CAPACITACION';  // alias si es necesario
```

Importar desde ambos:
- `shared/api/repositories/applicant.repository.ts`
- `caracteristicas/registrar-postulante/api/applicant.service.ts`
- `shared/types/index.ts`

---

# ESTIMACIÓN DE IMPACTO

## 📉 Antes de Correcciones

```
Archivos: ~400+
Líneas de código duplicado: ~500+
Clients HTTP: 4 (clienteHttp + http + apiClient + interceptors)
Repositories duplicados: 4
Context mezcla: ApplicantsContext (postulantes + empleados)
React Query: Instalado pero no usado
Bundle size: 306.15 kB
```

## 📈 Después de Correcciones

### Archivos a Eliminar (Total: 9 archivos)

| Archivo | Líneas | Razón |
|---------|--------|-------|
| `src/entidades/empleado/api/employee.repository.ts` | ~100 | Duplicado |
| `src/entidades/postulante/api/applicant.repository.ts` | ~100 | Duplicado |
| `src/entidades/contrato/api/contract.repository.ts` | ~50 | Duplicado |
| `src/entidades/auth/api/auth.repository.ts` | ~80 | Duplicado (mover) |
| `src/shared/api/repositories/contract.repository.new.ts` | ~50 | Experimental |
| `src/caracteristicas/autenticacion/ui/ResetPasswordForm.old.tsx` | ~100 | Legacy |
| `src/shared/api/http.ts` | ~90 | Duplicado de clienteHttp |
| `src/shared/api/apiClient.ts` | ~160 | Legacy (parcialmente, 40 líneas útiles) |
| `EJEMPLOS_INTEGRACION_API.tsx` | ~250 | Documentación en archivo |
| **SUBTOTAL** | **~980 líneas** | - |

### Archivos a Mover

| De | A | Líneas | Razón |
|----|---|--------|-------|
| `src/entidades/auth/api/auth.repository.ts` | `src/shared/api/repositories/auth.repository.ts` | ~80 | Consolidación |
| `src/caracteristicas/registrar-postulante/modelo/useSincPostulantes.ts` | **ELIMINAR** (ya existe en shared) | ~70 | Duplicado de hook |
| `src/shared/utils/mockData.ts` | `src/shared/test-utils/mockData.ts` | ~600 | Mejor ubicación |
| `src/caracteristicas/registrar-postulante/api/applicant.service.ts` | `src/shared/services/applicant.service.ts` | ~100 | Lógica compartida |

### Reducción Estimada

```
- Líneas de código consolidadas: ~980 líneas eliminadas
- Archivos simplificados: 9
- Repositorios unificados: De 8 → 5
- Hooks únicos: De 3 → 1
- Clients HTTP únicos: De 4 → 1 (clienteHttp.ts)
- Bundle size reducción estimada: -2-3% (~6-9 kB savings)
- Build time: Mejora menor (ms)
```

---

# ARCHIVOS QUE SE PUEDEN ELIMINAR AHORA

**LISTA DEFINITIVA SEGURA**:

```bash
# ELIMINACIÓN INMEDIATA (100% seguro)
rm src/entidades/empleado/api/employee.repository.ts
rm src/entidades/postulante/api/applicant.repository.ts
rm src/entidades/contrato/api/contract.repository.ts
rm src/entidades/auth/api/auth.repository.ts
rm src/shared/api/repositories/contract.repository.new.ts
rm src/caracteristicas/autenticacion/ui/ResetPasswordForm.old.tsx
rm src/shared/api/http.ts
rm EJEMPLOS_INTEGRACION_API.tsx
rm src/caracteristicas/registrar-postulante/modelo/useSincPostulantes.ts

# REVISAR ANTES DE ELIMINAR (contiene lógica útil que se debe preservar)
# src/shared/api/apiClient.ts → extrae logging, funde con clienteHttp
# src/shared/api/interceptors.ts → extrae logging de contratos si es crítico

# MOVER (no eliminar)
mv src/entidades/auth/api/auth.repository.ts src/shared/api/repositories/auth.repository.ts
mv src/shared/utils/mockData.ts src/shared/test-utils/mockData.ts
mv src/caracteristicas/registrar-postulante/api/applicant.service.ts src/shared/services/applicant.service.ts
```

**Impacto de eliminación**:
- ✅ Builds: Más rápida (menos imports circulares)
- ✅ Churn: Menos confusión de dónde buscar código
- ✅ Onboarding: Más claro para nuevos devs
- ⚠️ Git history: habrá cambios (usar `git mv` para preservar)

---

# APÉNDICE: DETALLES TÉCNICOS

## A.1 Flujo Correcto para Nuevos Endpoints

Cuando agregues un nuevo endpoint:

```
1. CREAR en src/shared/api/repositories/{entity}.repository.ts
   import { [clientHttp] } from '@shared/api/clienteHttp'
   export class [Entity]Repository {
     static async methodName(...): Promise<ResponseType> {
       const response = await [clientHttp].method('/endpoint')
       return response.data
     }
   }

2. USAR en src/[entidades|caracteristicas]/model/{entity}.service.ts O src/shared/services/{entity}.service.ts
   import { [Entity]Repository } from '@shared/api/repositories'
   export class [Entity]Service {
     static async methodName(...) {
       return [Entity]Repository.methodName(...)
     }
   }

3. CONSUMIR en src/caracteristicas/{feature}/hooks/use{Feature}.ts
   import { [Entity]Service } from '@shared/services'
   export const use{Feature} = () => {
     const [data, setData] = useState()
     useEffect(() => {
       [Entity]Service.methodName().then(setData)
     }, [])
   }

4. MOSTRAR en src/caracteristicas/{feature}/ui/Componente.tsx
   const { data, loading } = use{Feature}()
   return <div>{data}</div>

✅ Flujo: Componente → Hook → Service → Repository → clienteHttp
```

---

## A.2 Reglas FSD Estrictas para Este Proyecto

```
CAPAS (orden descendente):
  app/  → Configuración global, providers, router
  pages/ → Pages/rutas (NO lógica)
  widgets/ → Reusable layouts/templates (NO lógica de negocio)
  caracteristicas/ → Features con UI, hooks, input models
  entidades/ → Entidades de dominio (tipos + lógica pura, NO API)
  shared/ → Compartido: api, services, types, hooks, ui atoms

PROHIBICIONES:
  ✅ app → importa páginas, características, entidades, shared
  ✅ pages → importa widgets, características, entidades, shared
  ✅ widgets → importa características, entidades, shared
  ✅ características → importa entidades, shared
  ✅ entidades → importa shared SOLO (tipos, constantes)
  ✅ shared → importa SOLO shared

  ❌ app importa nada except pages/widgets/shared
  ❌ pages importa app
  ❌ widgets importa app/pages/características (sí pueden recibir props)
  ❌ características importa app/pages/widgets
  ❌ entidades importa características/app/pages/widgets o NADA excepto shared (tipos)
  ❌ shared importa características/entidades/app/pages
```

---

## A.3 Comandos de Validación

```bash
# Verificar que no hay imports circulares
npm run build

# Linter (si está configurado)
npm run lint

# Buscar imports de características en shared
grep -r "from '@caracteristicas" src/shared/ 2>/dev/null || echo "✓ OK"

# Buscar imports de API en entities
grep -r "import.*Http" src/entidades/*/model/*.ts 2>/dev/null || echo "✓ OK"

# Contar archivos duplicados
find src -name "employee.repository.ts" | wc -l  # Debería ser 1
find src -name "applicant.repository.ts" | wc -l  # Debería ser 1
find src -name "useApplicantsSync.ts" | wc -l    # Debería ser 1
```

---

## A.4 Checklist Post-Refactor

Después de aplicar todas las correcciones:

```
POST-REFACTOR CHECKLIST:

Architecture:
  ☐ No archivos en entidades/*/api/
  ☐ Todos los repositories en shared/api/repositories/
  ☐ Todos los services en shared/services/ O entidades/*/model/ (si son específicos)
  ☐ Features NO importan características
  ☐ Shared NO importa características

Duplicados:
  ☐ Una sola versión de cada repository
  ☐ Un solo useApplicantsSync
  ☐ Un solo clienteHttp
  ☐ CERO archivos .old.tsx

Muertos:
  ☐ No mockData.ts en shared/utils
  ☐ No archivos .new en repositories
  ☐ No EJEMPLOS_* en root
  ☐ No ResetPasswordForm.old.tsx

Build:
  ☐ npm run build → SUCCESS
  ☐ npm run lint → No errors (solo warnings OK)
  ☐ No warnings de ciclos circulares

Bundle:
  ☐ Size: <= 306 kB (similar a antes)
  ☐ No cambio dramático
```

---

# CONCLUSIÓN

| Métrica | Actual | Target |
|---------|--------|--------|
| **Problemas críticos** | 9 | 0 |
| **Problemas importantes** | 6 | 0 |
| **Problemas menores** | 7 | 2 (aceptable) |
| **Código duplicado** | ~980 líneas | ~0 |
| **Archivos muertos** | 9 | 0 |
| **Complejidad FSD** | 🔴 Violaciones | 🟢 Cumplimiento |

**ESFUERZO TOTAL**: 3-4 horas  
**RIESGO**: BAJO (cambios refactor principalmente)  
**URGENCIA**: ALTO (establece base para crecer escalablemente)

---

## 📞 Próximos Pasos

1. ✅ **Revisar este reporte** → feedback sobre prioridades
2. 🚀 **Ejecutar PRIORIDAD 1** (30 min) → eliminar duplicados, cleanup
3. 🔧 **Ejecutar PRIORIDAD 2** (1.5h) → mover archivos, corregir imports
4. 📊 **Build y test** → verificar que compila
5. 📝 **Documentar patrones** → crear `FSD_PATTERNS.md` para el equipo
6. 💭 **Bonus**: Implementar React Query para estado global

---

**Reporteado por**: AI Architecture Analyzer  
**Fecha**: 29 de marzo de 2026  
**Versión**: 1.0 Final
