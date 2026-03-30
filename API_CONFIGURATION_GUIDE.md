# 🔐 Guía de Configuración de APIs

## Estado Actual de Endpoints

### ✅ Endpoints SIN cambios (EXACTOS)

```
POST   /autorizacion/login
GET    /autorizacion/estado-acceso/{username}
POST   /autorizacion/forgot-password
```

**NO agregar prefijo `/api`** a estos endpoints.

---

## Arquitectura de URLs

### 🌐 En DESARROLLO (con proxy vite)

```
Cliente                 Proxy vite              Backend
────────────────────────────────────────────────────────────
POST /api/auth/autorizacion/login
                    ──────────────→    http://localhost:8080/autorizacion/login

GET /api/rrhh/postulantes
                    ──────────────→    http://localhost:8080/rrhh/postulantes

GET /api/leads/campanas
                    ──────────────→    http://localhost:8080/leads/campanas
```

**Proxy configurado en `vite.config.ts`:**
```javascript
'/api/auth': {
  target: 'http://localhost:8080',
  rewrite: (path) => path.replace(/^\/api/, ''),
},
```

### 🔒 En PRODUCCIÓN (sin proxy)

```
Cliente                                 Backend
─────────────────────────────────────────────────
POST http://localhost:8081/autorizacion/login  ← URL DIRECTA, sin /api
```

---

## Estructura de Clientes HTTP

### `src/shared/api/clienteHttp.ts`

Tres clientes especializados:

```typescript
// 1. Autenticación (sin JWT)
export const authHttp = axios.create({
  baseURL: '/api/auth',  // Proxy → http://localhost:8080
  timeout: 10000,
});

// 2. RRHH (con JWT)
export const rrhhHttp = axios.create({
  baseURL: '/api/rrhh',
  timeout: 10000,
});
// + Interceptor JWT automático

// 3. Leads (con JWT)
export const leadsHttp = axios.create({
  baseURL: '/api/leads',
  timeout: 10000,
});
// + Interceptor JWT automático
```

### Interceptores Activos

```
1. authHttp + rrhhHttp + leadsHttp:
   ✅ addErrorInterceptor() → Manejo global de errores
   
2. rrhhHttp + leadsHttp SOLAMENTE:
   ✅ addAuthInterceptor() → Inyecta "Authorization: Bearer {token}"
   
3. authHttp:
   ❌ SIN JWT (login no requiere token)
```

---

## Cómo se Usan Actualmente

### Login (AuthRepository)

```typescript
import { authHttp } from '@shared/api/clienteHttp';

// POST /autorizacion/login (sin JWT)
authHttp.post('/autorizacion/login', {
  username: 'user',
  password: 'pass'
})
```

**URL final:** `/api/auth/autorizacion/login` → vite proxy → `http://localhost:8080/autorizacion/login`

### Postulantes (LeadsRepository)

```typescript
import { leadsHttp } from '@shared/api/clienteHttp';

// GET /campanas (con JWT automático vía interceptor)
leadsHttp.get('/campanas')
```

**URL final:** `/api/leads/campanas` → vite proxy → `http://localhost:8080/campanas`
**Header:** `Authorization: Bearer {token}`

---

## Configuración de Variables de Entorno

### `.env` Actual

```ini
# Proxy en desarrollo descomentado
# En producción: cambiar a URL directa

VITE_AUTH_BASE_URL=/api/auth
VITE_RRHH_BASE_URL=/api/rrhh
VITE_LEADS_BASE_URL=/api/leads
```

### Variables en `src/app/config/env.ts`

```typescript
export const env = {
  AUTH_BASE_URL: (import.meta.env.VITE_AUTH_BASE_URL as string) || '/api/auth',
  RRHH_BASE_URL: (import.meta.env.VITE_RRHH_BASE_URL as string) || '/api/rrhh',
  LEADS_BASE_URL: (import.meta.env.VITE_LEADS_BASE_URL as string) || '/api/leads',
};
```

---

## ✅ Checklist de Validación

- [x] Endpoints POST /autorizacion/login → sin cambios
- [x] Endpoints GET /autorizacion/estado-acceso/{username} → sin cambios
- [x] Endpoints POST /autorizacion/forgot-password → sin cambios
- [x] URLs base incluyen `/api` en desarrollo (manejado por proxy)
- [x] URLs base en producción: http://localhost:8080 (sin /api)
- [x] authHttp sin JWT (login no requiere token)
- [x] rrhhHttp + leadsHttp con JWT automático
- [x] Interceptor de errores en todos los clientes
- [x] localStorage.getItem('auth_token') usado por JWT interceptor

---

## 🔍 Debug

Agregar logs en `authentication/pages/PaginaAutenticacionAvanzada.tsx`:

```typescript
console.log('[AUTH FLOW] Login exitoso:', response.username, 'rol:', role);
console.log('[AUTH FLOW] Redirigiendo a:', destination);
console.log('[AUTH] Token guardado en localStorage');
console.log('[AUTH] AuthContext.currentUser sincronizado');
```

Verificar en DevTools:
1. Network tab: POST /api/auth/autorizacion/login
2. Response: { token, usuario: { rol, nombreCompleto }, ... }
3. Application > localStorage: auth_token presente
4. Console: "[AUTH FLOW]" logs visibles

---

## 🚨 Troubleshooting

### "Failed to fetch" en login

**Causa:** Backend not running

```bash
# Verificar que :8080 esté escuchando
curl http://localhost:8080/autorizacion/login -X POST
```

### "Cannot find module '@shared/api/clienteHttp'"

**Causa:** Import inválido

```typescript
// ❌ MALO
import { authHttp } from '../../../shared/api/clienteHttp';

// ✅ BUENO
import { authHttp } from '@shared/api/clienteHttp';
```

### JWT no se inyecta automáticamente

**Causa:** Token no guardado en localStorage con clave `auth_token`

```typescript
// Verificar en DevTools:
localStorage.getItem('auth_token')  // debe retornar token

// AuthService.login() lo guarda:
localStorage.setItem('auth_token', response.token);
```

---

## 🔗 Archivos de Referencia

- `vite.config.ts` → Proxy rules
- `src/app/config/env.ts` → Variables base
- `src/shared/api/clienteHttp.ts` → Clientes centralizados
- `src/shared/api/repositories/auth.repository.ts` → Login/forgot-password
- `src/entidades/auth/model/auth.service.ts` → JWT handling
- `src/caracteristicas/autenticacion/pages/PaginaAutenticacionAvanzada.tsx` → Flow manager

