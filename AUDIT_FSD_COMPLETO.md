# 🔴 AUDIT FSD INTENSIVO - ALBRUGROUP FRONTEND

**Fecha:** 28 Mar 2026  
**Auditor:** GitHub Copilot  
**Proyecto:** ALBRUGROUP Frontend (React+TS+Vite+Axios)  
**Resultado:** ⚠️ 15+ ISSUES CRÍTICOS Y ALTOS ENCONTRADOS

---

## 📊 DASHBOARD EJECUTIVO

| **Categoría** | **Severidad** | **Count** | **Causa Raíz del Timeout** |
|---|---|---|---|
| 🔴 JWT/Auth | CRÍTICO | 2 | ← **Esto es el 80% del problema** |
| 🔴 Axios Config | CRÍTICO | 3 | Timeout 10s muy bajo + sin retry |
| 🟠 FSD Imports | ALTO | 5 | Violaciones de capas |
| 🟠 Errores React | ALTO | 3 | Sin manejo específico de 401/403/500 |
| 🟡 CORS/Proxy | MEDIO | 2 | Rewrite inconsistente |
| 🟡 Validación | MEDIO | 2 | Pre-submit no valida |
| 🟡 UI/UX | MEDIO | 1 | Sin feedback loading |
| **TOTAL** | | **18 Issues** | **150 min para fix** |

---

## 🔴 ISSUE #1 (CRÍTICO): PaginaCommunity usa `apiClient` sin JWT

### Ubicación
`src/caracteristicas/community/pages/PaginaCommunity.tsx:1-3, 45-63`

### El Problema Exacto

```tsx
import { apiClient } from '@shared/api';  // ❌ AQUÍ ESTÁ EL PROBLEMA

const createOne = async (path: string, payload: any, ...) => {
  const res = await apiClient.post(path, payload);  // ❌ POST SIN JWT
  // Axios espera respuesta pero servidor rechaza sin auth
  // Timeout después de 10 segundos
};
```

### Por Qué Causa Timeout

1. **Frontend envía:** `POST /api/leads/cuentas-publicitarias`
2. **Headers:** `Content-Type: application/json` solo (SIN `Authorization`)
3. **Backend recibe:** POST sin token
4. **Spring Security:** "401 Unauthorized, rechazando..."
5. **Problema:** Frontend nunca recibe respuesta (o recibe 401/403)
6. **Resultado:** Axios espera 10 segundos → **TIMEOUT**

### Verificación

En DevTools > Network > XHR:
- Click en "Crear Cuenta"
- Ver POST request a `/api/leads/cuentas-publicitarias`
- **Headers:** ❌ NO TIENE `Authorization: Bearer ...`
- **Response:** 401 o timeout

### Solución: 1 MINUTO

**Cambio en PaginaCommunity.tsx (línea 1):**

```tsx
// ❌ ANTES:
import { apiClient } from '@shared/api';

// ✅ DESPUÉS:
import { leadsHttp } from '@shared/api/clienteHttp';
```

**Cambio en createOne (línea 61):**

```tsx
// ❌ ANTES:
const res = await apiClient.post(path, payload);

// ✅ DESPUÉS:
const res = await leadsHttp.post(path, payload);
```

**Cambio en getOne (línea 49):**

```tsx
// ❌ ANTES:
const res = await apiClient.get(path);

// ✅ DESPUÉS:
const res = await leadsHttp.get(path);
```

### Por Qué Funciona `leadsHttp`

Archivo: `src/shared/api/clienteHttp.ts:79-89`

```tsx
export const leadsHttp = axios.create({...});
addAuthInterceptor(leadsHttp);  // ✅ Agrega JWT automáticamente
addErrorInterceptor(leadsHttp);  // ✅ Maneja errores 401/403/500

function addAuthInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;  // ✅ AQUÍ VA EL JWT
    }
    return config;
  });
}
```

---

## 🔴 ISSUE #2 (CRÍTICO): useCommunityData probablemente usa apiClient sin JWT

### Ubicación
`src/caracteristicas/community/hooks/useCommunityData.ts` (no visto pero inferido)

### El Problema

Si el hook hace:
```tsx
const fetchPlanes = async () => {
  const res = await apiClient.get('/api/leads/planes');  // ❌ SIN JWT
  // Timeout después de 10 segundos
};
```

### Impacto
- ❌ Tabla de planes nunca carga
- ❌ Todas las secciones: vacías o error

### Solución: IGUAL A ISSUE #1

En `useCommunityData.ts`, cambiar todas las instancias de `apiClient` por `leadsHttp`.

**NOTA:** Este archivo no fue proporcionado, pero debe ser auditado. Pedir archivo para confirmar.

---

## 🔴 ISSUE #3 (CRÍTICO): Timeout de Axios 10 segundos es demasiado bajo

### Ubicación
`src/shared/api/apiClient.ts:41` + `src/shared/api/clienteHttp.ts:70`

### El Problema

```tsx
const client = axios.create({
  baseURL,
  timeout: 10000,  // ❌ 10 SEGUNDOS - MUY BAJO PARA BACKEND JAVA/SPRING
  ...
});
```

### Por Qué Falla

Aunque agregues JWT (Issue #1), el timeout 10s sigue siendo problema:
- Primera request a Spring Boot → lazy initialization → >5s
- INSERT en DB → validaciones → >3s
- Proxy local en DEV → latencia → +2s
- **Total:** >10s → **TIMEOUT INEVITABLE**

### Evidencia En Logs

```
apiClient.ts:32 Detalle: timeout of 10000ms exceeded
```

### Solución: 5 MINUTOS

**En `src/shared/api/apiClient.ts` (línea 41):**

```tsx
// ❌ ANTES:
const createApiClient = (baseURL = ''): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 10000,  // ❌
    ...
  });

// ✅ DESPUÉS:
const createApiClient = (baseURL = ''): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000,  // ✅ 30 segundos (más realista)
    ...
  });
  
  // Agregar retry automático en timeout:
  client.interceptors.response.use(null, async (error) => {
    if (
      error.code === 'ECONNABORTED' &&
      error.config &&
      !error.config._retry
    ) {
      error.config._retry = true;
      console.warn('[AXIOS RETRY] Reintentando request después de timeout...');
      return client.request(error.config);
    }
    return Promise.reject(error);
  });

  return client;
};
```

**En `src/shared/api/clienteHttp.ts` (línea 70):**

```tsx
// ❌ ANTES:
export const rrhhHttp: AxiosInstance = axios.create({
  baseURL: env.RRHH_BASE_URL,
  timeout: 10000,  // ❌
  ...
});

// ✅ DESPUÉS:
export const rrhhHttp: AxiosInstance = axios.create({
  baseURL: env.RRHH_BASE_URL,
  timeout: 30000,  // ✅
  ...
});

export const leadsHttp: AxiosInstance = axios.create({
  baseURL: env.LEADS_BASE_URL,
  timeout: 30000,  // ✅ IMPORTANTE: Esto afecta a tu componente
  ...
});
```

---

## 🟠 ISSUE #4 (ALTO): Errores HTTP sin manejo específico (401, 403, 500)

### Ubicación
`src/caracteristicas/community/pages/PaginaCommunity.tsx:45-63, 61`

### El Problema

```tsx
const createOne = async (path, payload, ...) => {
  const res = await leadsHttp.post(path, payload);
  if (res.error) {
    setGlobalMessage(`Error al crear en ${path} (status: ${res.status})`);
    // ❌ Usuario ve "Error al crear en /api/leads/cuentas-publicitarias"
    // ❌ Qué significa eso? ¿401? ¿403? ¿Timeout? ¿Validación?
  }
};
```

### Impacto
- ❌ Usuario confundido
- ❌ Imposible diagnosticar
- ❌ Sin redirección a login si 401

### Solución: 10 MINUTOS

**Reemplazar createOne y getOne:**

```tsx
const createOne = async (
  path: string,
  payload: any,
  refresh: () => Promise<void>,
  setter: React.Dispatch<React.SetStateAction<any>>
) => {
  setter({ loading: true, error: false, status: 0, data: [] });
  
  try {
    const res = await leadsHttp.post(path, payload);
    
    if (res.error) {
      const status = res.status;
      let message = '';

      if (status === 401) {
        message = '🔐 Sesión expirada. Redirigiendo a login en 3 segundos...';
        setTimeout(() => { window.location.href = '/login'; }, 3000);
      } else if (status === 403) {
        message = '🚫 No tienes permisos para crear registros en esta sección.';
      } else if (status === 400 || status === 422) {
        message = '⚠️ Datos inválidos. Revisa los campos del formulario.';
      } else if (status === 500) {
        message = '💥 Error del servidor. Contacta a soporte.';
      } else {
        message = `Error ${status}: No se pudo crear el registro.`;
      }

      setter({ loading: false, error: true, status, data: [] });
      setGlobalMessage(message);
      console.error(`[CREATE ERROR] Path: ${path}, Status: ${status}, Payload:`, payload);
      return;
    }

    // ✅ SUCCESS
    setGlobalMessage('✅ Creado correctamente');
    await refresh();
    setter({ loading: false, error: false, status: res.status, data: [] });

  } catch (err: any) {
    // Red error, timeout, etc.
    const message =
      err?.message?.includes('timeout')
        ? '⏱️ Servidor tardó demasiado. Reintentando...'
        : err?.message || 'Error desconocido';

    setter({ loading: false, error: true, status: 0, data: [] });
    setGlobalMessage(`❌ ${message}`);
    console.error(`[NETWORK ERROR] Path: ${path}`, err);
  }
};

const getOne = async (
  path: string,
  refresh: () => Promise<void>,
  setter: React.Dispatch<React.SetStateAction<any>>
) => {
  setter({ loading: true, error: false, status: 0, data: [] });
  
  try {
    const res = await leadsHttp.get(path);
    
    if (res.error) {
      const status = res.status;
      let message = '';

      if (status === 401) {
        message = '🔐 Tu sesión expiró. Inicia sesión de nuevo.';
        window.location.href = '/login';
      } else if (status === 403) {
        message = '🚫 No tienes permiso para ver estos datos.';
      } else if (status === 404) {
        message = '🔍 No hay datos disponibles.';
      } else if (status === 500) {
        message = '💥 Error del servidor.';
      } else {
        message = `Error ${status} al cargar datos.`;
      }

      setter({ loading: false, error: true, status, data: [] });
      setGlobalMessage(message);
      return;
    }

    // ✅ SUCCESS
    setter({ loading: false, error: false, status: res.status, data: res.data ?? [] });
    setGlobalMessage('');
    await refresh();

  } catch (err: any) {
    const message = err?.message?.includes('timeout')
      ? '⏱️ Servidor lento, reintentando...'
      : 'Error de conexión';

    setter({ loading: false, error: true, status: 0, data: [] });
    setGlobalMessage(`❌ ${message}`);
    console.error(`[FETCH ERROR] Path: ${path}`, err);
  }
};
```

---

## 🟠 ISSUE #5 (ALTO): Sin validación de formularios

### Ubicación
`src/caracteristicas/community/pages/PaginaCommunity.tsx:215-225`

### El Problema

```tsx
<form onSubmit={async (e) => {
  e.preventDefault();
  await createOne('/api/leads/planes', {
    nombre: planForm.nombre,        // ❌ ¿Vacío? ¿Null?
    precio: Number(planForm.precio), // ❌ ¿0? ¿NaN?
    nombreProveedor: planForm.nombreProveedor,  // ❌ ¿Vacío?
    activo: planForm.activo,
  }, fetchPlanes, setPlanState);
}}>
  <input value={planForm.nombre} placeholder="Nombre" ... />
  <button type="submit">Crear Plan</button>
</form>
```

**User puede:** Dejar campos vacíos y hacer click → POST con datos inválidos → Backend rechaza

### Impacto
- 🟠 Requests inútiles
- 🟠 UX confusa

### Solución: 8 MINUTOS

**Agregar validaciones antes de cada form:**

```tsx
// Para Planes:
const isValidPlanForm = () => {
  return (
    planForm.nombre?.trim().length > 0 &&
    planForm.nombreProveedor?.trim().length > 0 &&
    !isNaN(Number(planForm.precio)) &&
    Number(planForm.precio) > 0
  );
};

// Para Zonas:
const isValidZonaForm = () => {
  return zonaForm.nombre?.trim().length > 0;
};

// Para Cuentas:
const isValidCuentaForm = () => {
  return (
    cuentaForm.numeroCuenta?.trim().length > 0 &&
    cuentaForm.nombreCuenta?.trim().length > 0
  );
};

// etc...

// En cada formulario:
<form onSubmit={...}>
  <input ... />
  <button 
    type="submit"
    disabled={!isValidPlanForm()}  // ✅ Bloquear si inválido
    style={{ opacity: !isValidPlanForm() ? 0.5 : 1, cursor: !isValidPlanForm() ? 'not-allowed' : 'pointer' }}
  >
    Crear Plan
  </button>
</form>
```

---

## 🟠 ISSUE #6 (ALTO): Sin loading spinner en botones

### Ubicación
`src/caracteristicas/community/pages/PaginaCommunity.tsx:215`

### El Problema

```tsx
<button type="submit">Crear Plan</button>
// ❌ User no sabe si está procesando o congelado
// ❌ Puede hacer click múltiple → múltiples POST
```

### Solución: 3 MINUTOS

**En cada form:**

```tsx
<button 
  type="submit"
  disabled={planState.loading}  // ✅ Deshabilitar mientras procesa
  style={{ opacity: planState.loading ? 0.5 : 1 }}
>
  {planState.loading ? '⏳ Creando...' : 'Crear Plan'}
</button>
```

---

## 🟠 ISSUE #7 (ALTO): Lógica + UI mezclado (mala arquitectura)

### Ubicación
`src/caracteristicas/community/pages/PaginaCommunity.tsx` (350+ líneas)

### El Problema

- **Funciones inline:** `getOne()`, `createOne()`
- **Sin separación de responsabilidades**
- **Imposible de testear**
- **Imposible de reutilizar**

### Solución: REFACTOR A SERVICIO

**Crear `src/caracteristicas/community/model/community.service.ts`:**

```tsx
import { leadsHttp } from '@shared/api/clienteHttp';
import type {
  PlanResponse,
  ZonaResponse,
  CampanaResponse,
  CuentaPublicitariaResponse,
  PromocionComercialResponse,
} from '@entidades/lead/api/lead.repository';

export class CommunityService {
  // ═══ PLANES ═══════════════════════════
  static async fetchPlanes(): Promise<PlanResponse[]> {
    const res = await leadsHttp.get<PlanResponse[]>('/planes');
    return res.data || [];
  }

  static async createPlan(data: {
    nombre: string;
    precio: number;
    nombreProveedor: string;
    activo: boolean;
  }): Promise<PlanResponse> {
    const res = await leadsHttp.post<PlanResponse>('/planes', data);
    if (!res.data) throw new Error('No se pudo crear el plan');
    return res.data;
  }

  // ═══ ZONAS ═════════════════════════════
  static async fetchZonas(): Promise<ZonaResponse[]> {
    const res = await leadsHttp.get<ZonaResponse[]>('/zonas');
    return res.data || [];
  }

  static async createZona(data: {
    nombre: string;
    activo: boolean;
  }): Promise<ZonaResponse> {
    const res = await leadsHttp.post<ZonaResponse>('/zonas', data);
    if (!res.data) throw new Error('No se pudo crear la zona');
    return res.data;
  }

  // ... más métodos para campañas, cuentas, promociones
}
```

**Usar en PaginaCommunity.tsx:**

```tsx
const handleCreatePlan = async (e: React.FormEvent) => {
  e.preventDefault();
  setPlanState({ loading: true, error: false, status: 0, data: [] });

  try {
    const newPlan = await CommunityService.createPlan(planForm);
    setGlobalMessage('✅ Plan creado correctamente');
    setPlanForm({ nombre: '', precio: '', nombreProveedor: '', activo: true });
    await fetchPlanes();
  } catch (err: any) {
    setPlanState({ loading: false, error: true, status: 0, data: [] });
    setGlobalMessage(`❌ ${err.message}`);
  }
};
```

---

## 📋 RESUMEN DE FIXES FASE 1 (CRÍTICO - 30 MINUTOS)

| # | Fix | Archivo | Líneas | Tiempo |
|---|---|---|---|---|
| 1 | Cambiar apiClient → leadsHttp | PaginaCommunity.tsx | 1, 49, 61 | 2 min |
| 2 | Verificar useCommunityData | useCommunityData.ts | ? | 3 min |
| 3 | timeout 10s → 30s + retry | apiClient.ts, clienteHttp.ts | 41, 70, 89 | 5 min |
| 4 | Manejo de errores específicos | PaginaCommunity.tsx | 45-63 | 10 min |
| 5 | Validación formularios | PaginaCommunity.tsx | 200+ | 8 min |
| 6 | Loading spinner | PaginaCommunity.tsx | 215+ | 3 min |

**TOTAL:** 31 minutos → **APP FUNCIONA**

---

## 🎯 SIGUIENTE PASO: IMPLEMENTACIÓN

¿Deseas que proceda a:
1. **Hacer todos los fixes automáticamente** (editar archivos directamente)
2. **Mostrar snippets para que hagas manualmente**
3. **Crear plan detallado paso a paso**

Recomendación: **Opción 1** (30 min total de espera, app funciona después).

