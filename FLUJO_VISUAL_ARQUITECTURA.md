# 📐 Flujo Visual - Autenticación + RBAC + API Configuration

## Arquitectura Abstracta

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│                      localhost:5173                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐                                                  │
│  │   LOGIN      │                                                  │
│  │   URL: /login│                                                  │
│  └──────────────┘                                                  │
│        │                                                            │
│        ├─→ [STEP 1] ValidateUserForm                              │
│        │   └─→ GET /api/auth/autorizacion/estado-acceso/{user}    │
│        │        (vía AuthRepository)                               │
│        ↓                                                            │
│        ├─→ [STEP 2] LoginForm                                      │
│        │   └─→ POST /api/auth/autorizacion/login {user, pass}    │
│        │        (vía AuthService)                                  │
│        │   ├─→ Save JWT to localStorage                           │
│        │   ├─→ Sync AuthContext.currentUser (via useAuth)        │
│        │   ├─→ Extract role from response.usuario.rol or JWT     │
│        │   └─→ Normalize: "ASESOR_DE_VENTAS" → "ASESOR_VENTAS"  │
│        ↓                                                            │
│        └─→ [STEP 3] ResetPasswordForm (if password not init'd)    │
│            └─→ POST /api/auth/autorizacion/forgot-password        │
│                 (vía AuthRepository)                               │
│                                                                    │
│  ┌──────────────────────────────────────────────────────┐          │
│  │ RBAC DASHBOARD REDIRECTION (getDestinationByRole)    │          │
│  ├──────────────────────────────────────────────────────┤          │
│  │ COMMUNITY           → /community/dashboard           │          │
│  │ ASESOR_GTR, GTR     → /gtr/dashboard                 │          │
│  │ ASESOR_VENTAS, ...  → /ventas/dashboard              │          │
│  │ ASESOR_BACKOFFICE   → /backoffice/dashboard          │          │
│  │ ADMINISTRADOR       → /panel                         │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                    │
└──────────────────────────────────────────────────────────────────────┘
        │
        │ [Vite Proxy - Dev Mode]
        │ Rewrite: /api/* → :8080
        ↓
┌──────────────────────────────────────────────────────────────────────┐
│                    VITE DEV SERVER PROXY                             │
│                      localhost:5173                                  │
├──────────────────────────────────────────────────────────────────────┤
│  /api/auth/autorizacion/login → http://localhost:8080/...     ✓    │
│  /api/rrhh/postulantes        → http://localhost:8080/...     ✓    │
│  /api/leads/campanas          → http://localhost:8080/...     ✓    │
└──────────────────────────────────────────────────────────────────────┘
        │
        │ [Network Request]
        ↓
┌──────────────────────────────────────────────────────────────────────┐
│                       BACKEND (Node.js)                              │
│                      localhost:8080                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ POST /autorizacion/login                                │        │
│  ├─────────────────────────────────────────────────────────┤        │
│  │ Request:  { username, password }                        │        │
│  │ Response: {                                             │        │
│  │   token: "eyJhbGciOiJIUzI1NiIs...",                    │        │
│  │   usuario: {                                            │        │
│  │     id: 123,                                            │        │
│  │     nombreCompleto: "Leonardo",                         │        │
│  │     rol: "ASESOR_GTR",        ← frontend reads this    │        │
│  │   },                                                    │        │
│  │   roles: ["ASESOR_GTR"]                                │        │
│  │ }                                                       │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ GET /autorizacion/estado-acceso/{username}              │        │
│  ├─────────────────────────────────────────────────────────┤        │
│  │ Response: { passwordInicializada: true/false }          │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ POST /autorizacion/forgot-password                      │        │
│  ├─────────────────────────────────────────────────────────┤        │
│  │ Request:  { username, email, dni, newPassword? }       │        │
│  │ Response: {                                             │        │
│  │   success: true,                                        │        │
│  │   password: "GeneratedPwd123"    ← shown to user       │        │
│  │ }                                                       │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ Con JWT en header: Authorization: Bearer {token}        │        │
│  │ Interceptor automático inyecta JWT  (clienteHttp)       │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Flujo Paso a Paso - Login exitoso

```
START: User visits /login
│
├─ [VALIDATE_USER] ────────────────────────────────
│   │
│   ├─ UI: Show "Ingresa Usuario" form
│   │
│   └─ User enters: "leonardo_test"
│      │
│      └─→ handleValidateUser("leonardo_test")
│         │
│         └─→ GET /api/auth/autorizacion/estado-acceso/leonardo_test
│            │
│            Console: "[AUTH FLOW] 🔍 Validando usuario: leonardo_test"
│            Console: "[AUTH FLOW] 🌐 GET /api/auth/autorizacion/..."
│            │
│            ├─ Response: { passwordInicializada: true }
│            │  │
│            │  └─→ setFlowState(state: 'LOGIN')
│            │
│            └─ Response: { passwordInicializada: false }
│               │
│               └─→ setFlowState(state: 'RESET_PASSWORD')
│
├─ [LOGIN] ─────────────────────────────────────
│  (Only if passwordInicializada === true)
│  │
│  ├─ UI: Show password field + "¿Olvidaste tu contraseña?" button
│  │
│  └─ User enters: password = "securePass123"
│     │
│     └─→ handleLogin({ username, password })
│        │
│        ├─ AuthService.login({ username, password })
│        │  │
│        │  ├─ POST /api/auth/autorizacion/login {user, pass}
│        │  │  │
│        │  │  Console: "[AUTH FLOW] 🌐 POST /api/auth/autorizacion/login"
│        │  │  Console: "[AUTH FLOW] ✅ Login successful"
│        │  │  │
│        │  │  └─ Response: { token, usuario: { rol: "ASESOR_GTR" } }
│        │  │
│        │  ├─ localStorage.setItem('auth_token', response.token)
│        │  │  │
│        │  │  Console: "[AUTH FLOW] 💾 Token guardado"
│        │  │
│        │  └─ rrhhHttp/leadsHttp interceptor sets:
│        │     Header: Authorization: Bearer {token}
│        │
│        └─→ await authLogin()  ← CRITICAL: synchronize AuthContext
│           │
│           ├─ AuthContext.login({user, password})
│           │  │
│           │  └─ setCurrentUser({
│           │       id,
│           │       name,
│           │       roles: ["ASESOR_GTR"]
│           │     })
│           │
│           └─ Console: "[AUTH FLOW] 📝 AuthContext sincronizado"
│
├─ [EXTRACT ROLE] ────────────────────────────────
│  │
│  ├─ From response: response.usuario.rol = "ASESOR_GTR"
│  │  OR from JWT: AuthService.getRoleFromToken(token)
│  │  (Fallback: response.role, response.roles[0], JWT auth[0])
│  │
│  ├─ Normalize: "ASESOR_GTR".toUpperCase().replace(/\s+/g, '_')
│  │  Result: "ASESOR_GTR"
│  │
│  └─ Console: "[AUTH FLOW] 👤 Rol detectado: ASESOR_GTR"
│
├─ [RBAC MAPPING] ──────────────────────────────────
│  │
│  ├─ Look up roleRoutes[role]
│  ├─ roleRoutes["ASESOR_GTR"] = "/gtr/dashboard"
│  │
│  └─ destination = "/gtr/dashboard"
│
├─ [REDIRECT] ──────────────────────────────────────
│  │
│  ├─ navigate(destination, { replace: true })
│  │
│  ├─ URL changes: /login → /gtr/dashboard
│  │
│  └─ Console: "[AUTH FLOW] 🎯 Redirigiendo a: /gtr/dashboard"
│
└─ [DASHBOARD RENDER] ────────────────────────────
   │
   ├─ RequireAuth guard checks: currentUser !== null ✓
   │  (Porque lo sincronizamos con authLogin())
   │
   ├─ RequireRole guard checks: canUserAccess(currentUser.roles, [...])) ✓
   │
   └─ Dashboard component renderizada ✓
      User can now interact with dashboard
      │
      └─ API requests to /api/rrhh/* automatically include JWT header
         (via rrhhHttp interceptor)
```

---

## Estructura de Archivos - Dependencias

```
src/
│
├── app/
│   ├── config/
│   │   └── env.ts  ←─ VITE_AUTH_BASE_URL = '/api/auth'
│   │
│   └── router/
│       ├── RequireAuth.tsx  ← Check currentUser !== null
│       ├── RequireRole.tsx  ← Check canUserAccess()
│       └── AppRoutes.tsx    ← /gtr/dashboard route definition
│
├── caracteristicas/
│   └── autenticacion/
│       ├── pages/
│       │   └── PaginaAutenticacionAvanzada.tsx  ← State machine + logs
│       │       ├── handleValidateUser()
│       │       ├── handleLogin()  ← Calls AuthService + authLogin()
│       │       └── handleResetPassword()
│       │
│       └── ui/
│           ├── LoginForm.tsx
│           ├── ValidateUserForm.tsx
│           └── ResetPasswordForm.tsx
│
├── entidades/
│   └── auth/
│       └── model/
│           └── auth.service.ts  ← AuthService.login(), .getRoleFromToken()
│
└── shared/
    ├── api/
    │   ├── config.ts  ✨ NEW - API_CONFIG with endpoints
    │   ├── helpers.ts ✨ NEW - apiRequest() wrapper + logging
    │   ├── clienteHttp.ts  ← authHttp, rrhhHttp, leadsHttp
    │   ├── index.ts  ← Exports
    │   └── repositories/
    │       └── auth.repository.ts  ← AuthRepository.login(), obtenerEstadoAcceso()
    │
    ├── auth/
    │   ├── AuthContext.tsx  ← currentUser state, login/logout
    │   └── useAuth.ts  ← Hook to use AuthContext
    │
    └── types/
        └── backend.ts  ← AuthLoginResponse, ForgotPasswordResponse
```

---

## Flujo de Datos - Login

```
User Input (LoginForm)
    │
    ├─ { username, password }
    │
    ├─ handleLogin()
    │   │
    │   ├─ AuthService.login()
    │   │   │
    │   │   ├─ AuthRepository.login()
    │   │   │   │
    │   │   │   └─ axios.post(
    │   │   │        baseURL: '/api/auth',
    │   │   │        '/autorizacion/login',
    │   │   │        { username, password }
    │   │   │      )
    │   │   │
    │   │   ├─ Response: { token, usuario, roles }
    │   │   │
    │   │   ├─ localStorage.setItem('auth_token', token)
    │   │   │
    │   │   └─ return { token, usuario, roles }
    │   │
    │   └─ await authLogin() ← useAuth hook
    │       │
    │       └─ AuthContext.login()
    │           │
    │           └─ setCurrentUser({
    │                id, 
    │                name,
    │                roles: ["ASESOR_GTR"]
    │              })
    │
    ├─ Extract role
    │   └─ response.usuario.rol or JWT
    │
    ├─ getDestinationByRole(role)
    │   └─ roleRoutes[role]
    │
    └─ navigate(destination, { replace: true })
        │
        └─ Dashboard renders ✓
            │
            └─ RequireRole checks currentUser
```

---

## Logging Output - Console

```
🔐 API_CONFIG ACTIVO
🌐 AUTH_BASE_URL: /api/auth
🌐 RRHH_BASE_URL: /api/rrhh  
🌐 LEADS_BASE_URL: /api/leads

🔒 Endpoints autenticación:
  POST /autorizacion/login
  GET /autorizacion/estado-acceso/:username
  POST /autorizacion/forgot-password

✅ Proxy vite activo en desarrollo:
  /api/auth → http://localhost:8080
  /api/rrhh → http://localhost:8080
  /api/leads → http://localhost:8080

───────────────────────────────────────

[AUTH FLOW] 🔍 Validando usuario: leonardo_test
[AUTH FLOW] 🌐 GET /api/auth/autorizacion/estado-acceso/leonardo_test
[AUTH FLOW] ✅ Respuesta de validación: { passwordInicializada: true }
[AUTH FLOW] ✨ Usuario validado: leonardo_test
[AUTH FLOW] 🔑 passwordInicializada: true
[AUTH FLOW] → Transición a estado: LOGIN

───────────────────────────────────────

[AUTH FLOW] 🔓 Iniciando login para usuario: leonardo_test
[AUTH FLOW] 🌐 POST /api/auth/autorizacion/login
[AUTH FLOW] ✅ Login successful, response: {
  username: 'leonardo_test',
  token: 'present',
  roles: ['ASESOR_GTR']
}
[AUTH FLOW] 📝 AuthContext sincronizado
[AUTH FLOW] 🔑 Role resolution: {
  responseRole: 'ASESOR_GTR',
  tokenRole: 'ASESOR_GTR',
  finalRole: 'ASESOR_GTR'
}
[AUTH FLOW] ✨ Login exitoso: leonardo_test
[AUTH FLOW] 👤 Rol detectado: ASESOR_GTR
[AUTH FLOW] 🎯 Redirigiendo a: /gtr/dashboard
[AUTH FLOW] 💾 Token guardado en localStorage (auth_token)

────────────────────────────────────────

[✓] Authenticated successfully
[✓] Redirected to dashboard
[✓] JWT persisted in localStorage
[✓] AuthContext.currentUser synced
```

---

## Error Scenarios

### ❌ Escenario 1: Backend no disponible
```
[AUTH FLOW] 🌐 POST /api/auth/autorizacion/login
[API] ❌ POST /api/auth/autorizacion/login | Error: Failed to fetch
[API] 🚨 No hay conexión con el servidor
[AUTH FLOW] 🚨 No hay conexión con el servidor
[AUTH FLOW] 🔧 Verifica que el backend esté corriendo en http://localhost:8080
```

### ❌ Escenario 2: Credenciales inválidas
```
[AUTH FLOW] 🌐 POST /api/auth/autorizacion/login
[AUTH FLOW] ✅ Login successful (pero backend returns 401)
[API] ❌ POST /api/auth/autorizacion/login | Error: Credenciales inválidas
[AUTH FLOW] ❌ Login error: Credenciales inválidas
```

### ❌ Escenario 3: Rol no mapeado
```
[AUTH FLOW] 👤 Rol detectado: ROL_NO_MAPEADO
[AUTH FLOW] ❌ Rol no reconocido o sin ruta: ROL_NO_MAPEADO
[AUTH FLOW] Error: "Rol no reconocido o no tiene ruta asignada"
```

### ❌ Escenario 4: Usuario sin rol
```
[AUTH FLOW] ✅ Login successful
[AUTH FLOW] 🔑 finalRole: ""  ← Empty!
[AUTH FLOW] ❌ No role found in response or token
[AUTH FLOW] Error: "Usuario sin rol asignado"
```

---

## Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│ ¿Dónde está...?                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Configuración de URLs          → src/shared/api/config.ts       │
│ Helper con logs                → src/shared/api/helpers.ts      │
│ Clientes HTTP                  → src/shared/api/clienteHttp.ts  │
│ Estado de autenticación        → src/shared/auth/AuthContext.tsx│
│ Máquina de estados del login   → caracteristicas/autenticacion/ │
│                                  pages/PaginaAutenticacionAvanzada.tsx
│ Rutas y permisos               → src/app/router/AppRoutes.tsx   │
│ RBAC mapping (dashboards)      → roleRoutes object en           │
│                                  PaginaAutenticacionAvanzada.tsx│
│ JWT handling                   → src/entidades/auth/model/      │
│                                  auth.service.ts                │
│ Types del backend              → src/shared/types/backend.ts    │
└─────────────────────────────────────────────────────────────────┘
```

---

**Version:** 1.0 | **Last Updated:** 28 de marzo de 2026 | **Status:** ✅ Active

