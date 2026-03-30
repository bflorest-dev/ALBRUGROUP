# 🧪 QA Checklist - API Configuration + Login

## Pre-Test Setup

```bash
# Terminal 1: Backend (puerto 8080)
cd ../ALBRUGROUP-backend
npm run dev

# Terminal 2: Frontend (puerto 5173)
cd ../ALBRUGROUP-frontend
npm run dev
```

---

## Test Suite 1: Configuration Layer ✓

### T1.1 - Verificar API_CONFIG en Console
- [ ] Abrir http://localhost:5173/login
- [ ] F12 → Console
- [ ] Esperar 1-2 segundos
- [ ] Buscar "[🔐 API_CONFIG ACTIVO]"
- [ ] Verificar URLs base mostradas:
  - [ ] AUTH_BASE_URL: /api/auth
  - [ ] RRHH_BASE_URL: /api/rrhh
  - [ ] LEADS_BASE_URL: /api/leads
- [ ] Verificar endpoint exactos listados:
  - [ ] POST /autorizacion/login
  - [ ] GET /autorizacion/estado-acceso/:username
  - [ ] POST /autorizacion/forgot-password

### T1.2 - Verificar Imports Funcionan
```typescript
// En src/* cualquier archivo
import { API_CONFIG, apiRequest, apiHelpers } from '@shared/api';

// Debe compilar sin errores
```
- [ ] npm run build exit code = 0

### T1.3 - Verificar Proxy Vite
- [ ] DevTools → Network tab
- [ ] Ingresar usuario en form
- [ ] Buscar primer request:
  - [ ] URL mostrada: /api/auth/autorizacion/estado-acceso/[usuario]
  - [ ] NO debe mostrar: http://localhost:8080/...
  - [ ] Status: 200 o 404 (ambos ok, depende backend)

---

## Test Suite 2: Validación de Usuario (PASO 1)

### T2.1 - Usuario válido, passwordInicializada=true
```
Usuario: [cualquier usuario válido con password ya iniciado]
```

**Steps:**
1. [ ] Ir a http://localhost:5173/login
2. [ ] Ingresa usuario en campo "Usuario"
3. [ ] Click "Siguiente" o Enter
4. [ ] En Console buscar logs:
   - [ ] "[AUTH FLOW] 🔍 Validando usuario: [usuario]"
   - [ ] "[AUTH FLOW] 🌐 GET /api/auth/autorizacion/estado-acceso/[usuario]"
5. [ ] **Esperado:** Transición a pantalla de LOGIN (paso 2)
6. [ ] Verificar console:
   - [ ] "[AUTH FLOW] ✨ Usuario validado: [usuario]"
   - [ ] "[AUTH FLOW] 🔑 passwordInicializada: true"
   - [ ] "[AUTH FLOW] → Transición a estado: LOGIN"

### T2.2 - Usuario válido, passwordInicializada=false
```
Usuario: [cualquier usuario válido SIN password iniciado]
```

**Steps:**
1. [ ] Ir a http://localhost:5173/login
2. [ ] Ingresa usuario SIN password
3. [ ] Click "Siguiente" o Enter
4. [ ] En Console buscar:
   - [ ] "[AUTH FLOW] 🔍 Validando usuario: [usuario]"
5. [ ] **Esperado:** Transición a pantalla RESET_PASSWORD (paso 3)
6. [ ] Verificar console:
   - [ ] "[AUTH FLOW] 🔑 passwordInicializada: false"
   - [ ] "[AUTH FLOW] → Transición a estado: RESET_PASSWORD"

### T2.3 - Usuario inválido
```
Usuario: invalidousuario@test.com
```

**Steps:**
1. [ ] Ingresa usuario que NO existe
2. [ ] Click "Siguiente"
3. [ ] **Esperado:** Mensaje de error en UI
4. [ ] En Console:
   - [ ] "[AUTH FLOW] ❌ Error al validar usuario: [mensaje]"

---

## Test Suite 3: Login (PASO 2)

### T3.1 - Credenciales válidas → RBAC Success
```
Usuario: asesor_gtr
Contraseña: password123
```

**Steps:**
1. [ ] Completar paso 1 (validación usuario)
2. [ ] En pantalla LOGIN ingresar contraseña
3. [ ] Click "Iniciar Sesión"
4. [ ] En Console buscar:
   - [ ] "[AUTH FLOW] 🔓 Iniciando login para usuario: [usuario]"
   - [ ] "[AUTH FLOW] 🌐 POST /api/auth/autorizacion/login"
   - [ ] "[AUTH FLOW] ✅ Login successful, response: {...}"
   - [ ] "[AUTH FLOW] 📝 AuthContext sincronizado"
   - [ ] "[AUTH FLOW] 👤 Rol detectado: [ROL_MAYUSCULA]"
   - [ ] "[AUTH FLOW] 🎯 Redirigiendo a: /gtr/dashboard"
5. [ ] **Esperado:** URL cambia a /gtr/dashboard (según rol)
6. [ ] **Esperado:** Dashboard renderizado, NO muestra unauthorized

### T3.2 - Credenciales inválidas
```
Usuario: asesor_gtr
Contraseña: wrongpassword
```

**Steps:**
1. [ ] Completar paso 1 (validación)
2. [ ] Meter contraseña incorrecta
3. [ ] Click "Iniciar Sesión"
4. [ ] **Esperado:** Mensaje de error: "Credenciales inválidas"
5. [ ] En Console:
   - [ ] "[AUTH FLOW] ❌ Login error: Credenciales inválidas"
6. [ ] **Esperado:** Se mantiene en pantalla LOGIN (puede reintentar)

### T3.3 - Backend no disponible
```
Condición: Detener backend (puerto 8080)
```

**Steps:**
1. [ ] Detener servidor backend (Ctrl+C en terminal backend)
2. [ ] Intentar login con credenciales válidas
3. [ ] **Esperado:** Error "Failed to fetch"
4. [ ] En Console:
   - [ ] "[API] ❌ POST /api/auth/autorizacion/login | Error: Failed to fetch"
   - [ ] "[API] 🚨 No hay conexión..."
   - [ ] "[AUTH FLOW] 🚨 No hay conexión con el servidor"
   - [ ] "[AUTH FLOW] 🔧 Verifica que el backend esté corriendo en http://localhost:8080"

---

## Test Suite 4: RBAC Redirection

### T4.1 - Usuario COMMUNITY → /community/dashboard
```
Usuario: community_user
Rol esperado: COMMUNITY
```

**Steps:**
1. [ ] Login exitoso
2. [ ] Verificar URL: http://localhost:5173/community/dashboard
3. [ ] En Console: "[AUTH FLOW] 🎯 Redirigiendo a: /community/dashboard"
4. [ ] Dashboard accesible

### T4.2 - Usuario ASESOR_GTR → /gtr/dashboard
```
Usuario: asesor_gtr
Rol esperado: ASESOR_GTR o GTR
```

**Steps:**
1. [ ] Login exitoso
2. [ ] Verificar URL: http://localhost:5173/gtr/dashboard
3. [ ] En Console: "[AUTH FLOW] 🎯 Redirigiendo a: /gtr/dashboard"

### T4.3 - Usuario ASESOR_VENTAS → /ventas/dashboard
```
Usuario: asesor_ventas
Rol esperado: ASESOR_VENTAS o ASESOR_DE_VENTAS
```

**Steps:**
1. [ ] Login exitoso
2. [ ] Verificar URL: http://localhost:5173/ventas/dashboard

### T4.4 - Usuario ASESOR_BACKOFFICE → /backoffice/dashboard
```
Usuario: asesor_backoffice
Rol esperado: ASESOR_BACKOFFICE
```

**Steps:**
1. [ ] Login exitoso
2. [ ] Verificar URL: http://localhost:5173/backoffice/dashboard

### T4.5 - Usuario ADMIN → /panel
```
Usuario: admin
Rol esperado: ADMINISTRADOR
```

**Steps:**
1. [ ] Login exitoso
2. [ ] Verificar URL: http://localhost:5173/panel

---

## Test Suite 5: JWT Token Handling

### T5.1 - Token guardado en localStorage
**Steps:**
1. [ ] Login exitoso
2. [ ] DevTools → Application → LocalStorage
3. [ ] Buscar clave: auth_token
4. [ ] [ ] Verificar token presente (empieza con "eyJ...")
5. [ ] [ ] Token no está vacío

### T5.2 - JWT persistencia (refresh)
**Steps:**
1. [ ] Login exitoso
2. [ ] Estás en dashboard
3. [ ] F5 (recargar página)
4. [ ] **Esperado:** Dashboard persiste, NO redirige a /login
5. [ ] localStorage.auth_token debe seguir presente

### T5.3 - JWT inyección en requests
**Steps:**
1. [ ] Login exitoso
2. [ ] Navegar a cualquier página que llame /api/rrhh/* (ej: postulantes)
3. [ ] DevTools → Network tab
4. [ ] Buscar por "postulantes"
5. [ ] [ ] Verificar Header: "Authorization: Bearer [token]"
6. [ ] **Esperado:** Request tiene JWT automáticamente

---

## Test Suite 6: Reset Password (PASO 3)

### T6.1 - Usuario Sin Password Inicializado
```
Usuario: new_user (passwordInicializada = false)
```

**Steps:**
1. [ ] Validar usuario (paso 1)
2. [ ] **Esperado:** Transición a RESET_PASSWORD
3. [ ] En Console:
   - [ ] "[AUTH FLOW] → Transición a estado: RESET_PASSWORD"
4. [ ] Imagen: Pantalla de "Reset Password" visible
5. [ ] [ ] Campo de email visible
6. [ ] [ ] Campo de DNI visible
7. [ ] [ ] Botón "Recuperar contraseña" visible

### T6.2 - Forgot Password Submit
**Steps:**
1. [ ] En pantalla Reset Password, ingresa email y DNI
2. [ ] Click "Recuperar contraseña"
3. [ ] En Console buscar:
   - [ ] "[API] POST /api/auth/autorizacion/forgot-password"
4. [ ] **Esperado:** Respuesta exitosa muestra contraseña generada
5. [ ] [ ] Botón "Ir a iniciar sesión" presente
6. [ ] [ ] NO auto-redirect (usuario controla navegación)

---

## Test Suite 7: NO-Breaking Changes

### T7.1 - Build sin errores
```bash
npm run build
```
- [ ] Exit code: 0
- [ ] No "error TS" en output
- [ ] Módulos transformados: 339+

### T7.2 - Endpoints exactos SIN cambios
- [ ] POST /autorizacion/login → SIN /api/api
- [ ] GET /autorizacion/estado-acceso/{username} → SIN cambios
- [ ] POST /autorizacion/forgot-password → SIN cambios

### T7.3 - URLs Base exactas SIN cambios
- [ ] AUTH_BASE_URL: /api/auth (con proxy)
- [ ] RRHH_BASE_URL: /api/rrhh (con proxy)
- [ ] LEADS_BASE_URL: /api/leads (con proxy)

### T7.4 - Clientes HTTP SIN cambios de lógica
- [ ] authHttp directamente desde caracteriticas/auth/pages
- [ ] rrhhHttp con JWT automático
- [ ] leadsHttp con JWT automático

---

## Test Suite 8: Error Handling

### T8.1 - Conexión perdida durante login
**Steps:**
1. [ ] En mitad del proceso de login, desconectar internet (dev tools)
2. [ ] O matar backend con Ctrl+C
3. [ ] **Esperado:** Error message en UI: "No hay conexión"
4. [ ] Console: "[API] 🚨 No hay conexión con el servidor"

### T8.2 - Token expirado (401 respuesta)
**Steps:**
1. [ ] Login exitoso
2. [ ] Esperar token expire (o simular manualmente)
3. [ ] Hacer request a /api/rrhh/*
4. [ ] **Esperado:** 401 response
5. [ ] **Esperado:** localStorage.auth_token eliminado
6. [ ] **Esperado:** Redirección a /login

### T8.3 - Rol desconocido
**Configuración:** Backend retorna rol: "ROL_NO_MAPEADO"

**Steps:**
1. [ ] Login con usuario que tenga rol no mapeado
2. [ ] **Esperado:** Error message: "Rol no reconocido o no tiene ruta asignada"
3. [ ] Console: "[AUTH FLOW] ❌ Rol no reconocido o sin ruta: ROL_NO_MAPEADO"
4. [ ] No redirige, se mantiene en login

---

## Debug Commands (si fallan tests)

### Ver todos los logs [AUTH FLOW]
```javascript
// Copy-paste en DevTools Console
console.log(
  Array.from(document.body.innerText.split('\n'))
    .filter(line => line.includes('[AUTH FLOW]'))
    .join('\n')
);
```

### Ver token JWT decodificado
```javascript
// Copy-paste en DevTools Console
const token = localStorage.getItem('auth_token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('JWT PAYLOAD:', payload);
} else {
  console.log('No token found');
}
```

### Ver todas las llamadas API
```javascript
// Copy-paste en DevTools Console
console.log(
  Array.from(document.body.innerText.split('\n'))
    .filter(line => line.includes('[API]'))
    .join('\n')
);
```

---

## Pass Criteria ✅

- [ ] Todas las tests en Test Suite 1-7 pasadas
- [ ] Build compila sin errores
- [ ] **Sin "Failed to fetch"** (si backend está corriendo)
- [ ] **Sin redirect loops**
- [ ] **Login → Dashboard según rol (RBAC funciona)**
- [ ] **JWT se persiste en localStorage**
- [ ] **Refresh después de login NO redirige a /login**
- [ ] **Todos los logs [AUTH FLOW] visibles en Console**

---

## Report Template

```
QA TEST RUN - API Configuration + Login
========================================

Date: [YYYY-MM-DD]
Tester: [nombre]
Environment: localhost:5173 + :8080

Backend Status: ☐ Running   ☐ Stopped
Build Status: ☐ OK   ☐ FAIL (errors: ___)

Test Suite Results:
  T1 (Configuration): ☐ PASS ☐ FAIL (detalles: ___)
  T2 (Validación): ☐ PASS ☐ FAIL (detalles: ___)
  T3 (Login): ☐ PASS ☐ FAIL (detalles: ___)
  T4 (RBAC): ☐ PASS ☐ FAIL (detalles: ___)
  T5 (JWT): ☐ PASS ☐ FAIL (detalles: ___)
  T6 (Reset): ☐ PASS ☐ FAIL (detalles: ___)
  T7 (No-Breaking): ☐ PASS ☐ FAIL (detalles: ___)
  T8 (Errors): ☐ PASS ☐ FAIL (detalles: ___)

Overall: ☐ PASS ☐ FAIL

Critical Issues: [si hay]
Notes: [observaciones]
```

---

**IMPORTANTE:** Ejecuta Tests en este orden: T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8

Si alguno falla antes de T3, no continúes (fix config primero).

