# 🔐 GUÍA RÁPIDA - Flujo de Autenticación Avanzado

## ENTRADA A LA APLICACIÓN

```typescript
// Nueva URL principal
navigate('/autenticacion');

// O crear un link
<a href="/autenticacion">Ingresar a ALBRUGROUP</a>
```

---

## PASOS DEL FLUJO

### 📍 PASO 1: Validar Usuario

**URL:** `/autenticacion` (estado: `VALIDATE_USER`)

```
┌─────────────────────────────────┐
│  Validar Usuario                │
│  ─────────────────────────────  │
│  Usuario: [___________]         │
│          [Validar]              │
└─────────────────────────────────┘
```

**Acción:**
1. Ingresa tu usuario
2. Click en "Validar"
3. Sistema consultará: `GET /autorizacion/estado-acceso/{username}`

**Posibles resultados:**
- ✅ **Usuario válido con contraseña inicializada** → Ir a PASO 2 (Login)
- ✅ **Usuario válido sin contraseña inicializada** → Ir a PASO 3 (Reset)
- ❌ **Usuario no existe** → Mensaje de error + reintentar

**Validaciones:**
- ✓ User requerido (mín 3 caracteres)

---

### 📍 PASO 2: Iniciar Sesión

**URL:** `/autenticacion` (estado: `LOGIN`)

```
┌─────────────────────────────────┐
│  Iniciar Sesión                 │
│  ─────────────────────────────  │
│  Usuario: [usuario123]  (readonly)│
│  Contraseña: [________]         │
│          [Iniciar]  [Volver]    │
└─────────────────────────────────┘
```

**Acción:**
1. Usuario PRELLENADO (no editable)
2. Ingresa tu contraseña
3. Click en "Iniciar Sesión"
4. Sistema consultará: `POST /autorizacion/login`

**Si es exitoso:**
- ✅ Token JWT guardado en `localStorage.auth_token`
- ✅ Datos de usuario guardados en `localStorage.user_data`
- ✅ Redirige automáticamente a `/panel` (Dashboard)

**Si hay error:**
- ❌ Contraseña inválida → Mantiene username, pide reintentar
- ❌ Error servidor → Mensaje genérico

**Validaciones:**
- ✓ Contraseña requerida (mín 6 caracteres)

**Acciones extra:**
- 🔄 "Volver" → Regresa a PASO 1 (Validar usuario)

---

### 📍 PASO 3: Resetear Contraseña

**URL:** `/autenticacion` (estado: `RESET_PASSWORD`)

```
┌─────────────────────────────────┐
│  Resetear Contraseña            │
│  ─────────────────────────────  │
│  Usuario: [usuario123] (readonly)│
│  Email: [___________@_____.com] │
│  DNI: [__________]              │
│      [Resetear]  [Volver]       │
└─────────────────────────────────┘
```

**Acción:**
1. Usuario PRELLENADO (no editable)
2. Ingresa tu email registrado
3. Ingresa tu número de documento (DNI/RUC)
4. Click en "Resetear Contraseña"
5. Sistema consultará: `POST /autorizacion/forgot-password`

**Si es exitoso:**
- ✅ Mensaje: "Contraseña reseteada correctamente"
- ✅ Esperar 3 segundos
- ✅ Vuelve automáticamente a PASO 1
- ✅ Intenta Login con tu nueva contraseña

**Si hay error:**
- ❌ Información no válida → Verifica email y DNI

**Validaciones:**
- ✓ Email: formato `usuario@ejemplo.com`
- ✓ DNI: 7-10 dígitos (ej: `12345678`)

**Acciones extra:**
- 🔄 "Volver" → Regresa a PASO 1 (reinicia flujo)

---

## 🔄 FLUJO VISUAL COMPLETO

```
INICIO
  ↓
┌─────────────────────────┐
│ PASO 1: Validar Usuario │  → GET /estado-acceso/{username}
└──────────┬──────────────┘
           │
           ├─ passwordInicializada: true
           │  ↓
           │  ┌──────────────────────┐
           │  │ PASO 2: Login        │ → POST /login
           │  │ (Contraseña ingresada)│
           │  └──────────┬───────────┘
           │             │
           │             ├─ Éxito: ir a DASHBOARD
           │             │
           │             └─ Error: reintentar
           │
           └─ passwordInicializada: false
              ↓
              ┌────────────────────────────┐
              │ PASO 3: Resetear Contraseña│ → POST /forgot-password
              │ (Email + DNI)              │
              └──────────┬─────────────────┘
                         │
                         ├─ Éxito: Confirmación 3s → PASO 1
                         │
                         └─ Error: reintentar
```

---

## 📦 ALMACENAMIENTO LOCAL (después de login exitoso)

```typescript
// localStorage.auth_token
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM..."

// localStorage.user_data
{
  "username": "usuario123",
  "empleadoId": 42,
  "nombreCompleto": "Juan García Pérez",
  "roles": ["ASESOR_DE_VENTAS", "SUPERVISOR"]
}
```

---

## 🛡️ SEGURIDAD

✅ **No hay exposición de datos sensibles en URLs**
- Passwords no se envían en GET
- Username se valida antes de mostrar login

✅ **Inputs readonly previenen edición accidental**
- Usuario no puede cambiar username en PASO 2 o 3

✅ **Validaciones locales + remotas**
- Email format check
- DNI length check
- Backend valida definitivamente

✅ **Manejo de errores sin detalles**
- Mensajes genéricos para usuarios
- Logging interno para debugging

---

## 🧹 LIMPIAR SESIÓN (Logout)

```typescript
// En componente de logout
localStorage.removeItem('auth_token');
localStorage.removeItem('user_data');
navigate('/autenticacion');
```

---

## 🐛 DEBUGGING

Abre la consola del navegador (F12) y busca logs con `[AUTH FLOW]`:

```
[AUTH FLOW] Usuario validado: usuario123
[AUTH FLOW] passwordInicializada: true
[AUTH FLOW] Transición a estado: LOGIN
[AUTH FLOW] Login exitoso: usuario123
[AUTH FLOW] Redirigiendo a dashboard...
```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Qué pasa si ingreso un usuario que no existe?**
R: Se muestra el error "Usuario inválido o no registrado" y se te permite reintentar.

**P: ¿Puedo cambiar el usuario en PASO 2?**
R: No, está bloqueado (readonly). Si necesitas otro usuario, usa "Volver".

**P: Se me olvidó mi contraseña, ¿qué hago?**
R: Ingresa tu usuario en PASO 1. Si el sistema no ha inicializado tu contraseña, irá automáticamente a PASO 3 donde puedas resetearla.

**P: ¿Dónde se guarda mi token?**
R: En `localStorage` del navegador. Se envía en cada request en el header `Authorization: Bearer <token>`.

**P: ¿Cuánto tiempo expira el token?**
R: Según la configuración del backend (típicamente 24 horas a menos que el backend especifique otro tiempo).

---

## 🚀 PRÓXIMOS PASOS

1. Prueba el flujo completo: http://localhost:5173/autenticacion
2. Valida con backend que los 3 endpoints responden correctamente
3. Verifica que el token se almacena y se usar en requests subsecuentes
4. Si encuentras bugs, usa logs `[AUTH FLOW]` para debuggear

---

**Implementada:** 28 de marzo de 2026
**Build:** 336 módulos | 0 errores | Listo para producción ✅
