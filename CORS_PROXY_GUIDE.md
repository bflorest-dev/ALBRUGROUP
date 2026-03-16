# CORS & Proxy Configuration Guide

## 🔴 Problema Original: CORS Error

```
Access to XMLHttpRequest at 'http://localhost:8082/auth/login' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

### ¿Por qué ocurre?

```
Frontend Origin:  http://localhost:5173 (Vite)
Backend Origin:   http://localhost:8082 (Backend API)
                  ↓
              DIFERENTES → Cross-Origin
                  ↓
         Navegador bloquea por seguridad
```

### Flujo del Error:

```
1. LoginForm.submit()
   ↓
2. AuthService.login(credentials)
   ↓
3. axios.post('/api/auth/login')  ← A http://localhost:8082 directamente
   ↓
4. Navegador hace preflight OPTIONS
   ↓
5. Backend no responde con CORS headers
   ↓
6. ❌ Navegador BLOQUEA la solicitud
   ↓
7. Axios captura error de red
   ↓
8. HTTP Interceptor: NETWORK_ERROR
   ↓
9. AuthService.catch(): "Error de conexión"
   ↓
10. LoginPage.catch(): Mostrar error al usuario
```

---

## ✅ Solución: Vite Proxy

### Cómo Funciona

```
Frontend Request:
POST /api/auth/login
   ↓
Vite Proxy (vite.config.ts)
   ↓
Rewrite path: /api/auth/login → /auth/login
   ↓
Forward to: http://localhost:8082/auth/login
   ↓
Boot.Response
   ↓
Return to frontend as if it was http://localhost:5173
   ↓
✅ Same origin → No CORS error
```

### Configuración en vite.config.ts

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8082',        // Backend URL
      changeOrigin: true,                     // Cambiar header Origin
      rewrite: (path) => path.replace(/^\/api/, ''), // /api/auth/login → /auth/login
      secure: false,                          // Permitir HTTP en dev
    },
  },
}
```

### Configuración en src/config/env.ts

```typescript
// Desarrollo: usa /api (proxy)
// Producción: usa URL completa si está en VITE_API_URL

API_URL: import.meta.env.VITE_API_URL || (isDev ? '/api' : 'http://localhost:8082')
```

---

## 🚀 Cómo Usar

### En Desarrollo

```bash
# Terminal 1: Iniciar Vite dev server
npm run dev
# → Listening on http://localhost:5173
# → Proxy activo: /api → http://localhost:8082

# Terminal 2: Iniciar backend (si es necesario)
# Tu backend debe estar en http://localhost:8082
```

### Flujo de Solicitud en Desarrollo

```
Browser Request to /api/auth/login
  ↓
http://localhost:5173/api/auth/login (mismo origen)
  ↓
Vite Proxy intercepta /api
  ↓
Redirecciona a http://localhost:8082/auth/login
  ↓
Backend responde
  ↓
✅ No hay CORS error (mismo origen desde perspectiva del navegador)
```

### En Producción

Debes proporcionar la URL completa del backend via variable de entorno:

```bash
# .env.production o en deploy
VITE_API_URL=https://api.tudominio.com

# O si es mismo servidor:
VITE_API_URL=/api
# (y configurar tu servidor para redirigir /api al backend)
```

---

## 🔍 Debugging: Verificar que funciona

### En DevTools

1. **Abre Console** (F12)
2. **Busca el log**:
   ```
   [Env Config] Development mode - using proxy: /api → http://localhost:8082
   ```
3. **En Network tab**:
   - Click en login
   - Busca POST request
   - URL debe ser: `http://localhost:5173/api/auth/login`
   - No debe ser: `http://localhost:8082/auth/login`

### Logs Esperados en Consola

```javascript
// Al cargar la app
[Env Config] Development mode - using proxy: /api → http://localhost:8082

// Al intentar login
[LoginPage] Conectando...
[AuthService.login] POST /api/auth/login
// Respuesta exitosa:
[LoginPage] Login exitoso: {username: 'admin', nombreCompleto: '...', roles: [...]}
```

---

## ❌ Errores Comunes y Soluciones

### Error: "Cannot GET /api/auth/login"

**Causa**: Backend no está corriendo en http://localhost:8082

**Solución**: 
```bash
# Verificar que backend está activo
curl http://localhost:8082/auth/login
# Si falla, iniciar backend primero
```

### Error: "Proxy error"

**Causa**: Typo en vite.config.ts

**Solución**:
```bash
# Reiniciar dev server
npm run dev
```

### CORS error persiste

**Causa**: Cache o configuración antigua

**Solución**:
```bash
# Limpiar cache
rm -rf node_modules/.vite
# Reiniciar dev server
npm run dev
```

---

## 🎯 Comparación: Soluciones CORS

| Solución | Ventajas | Desventajas | Cuándo usar |
|----------|----------|----------|----------|
| **Vite Proxy** | ✅ Sin cambios backend, Simple, Rápido | ❌ Solo en desarrollo | Development |
| **Backend CORS** | ✅ Funciona en prod, Estándar | ❌ Requiere config backend | Production |
| **Mismo servidor** | ✅ Sin CORS, Simple | ❌ Acoplamiento frontend-backend | Deploy final |
| **JSONP** | ✅ Antiguo pero funciona | ❌ Seguridad, No recomendado | Nunca |

**Recomendación**: 
- **Desarrollo**: Vite Proxy (ya configurado ✅)
- **Producción**: Backend con CORS headers + Nginx/reverse proxy

---

## ✅ Checklist

- [x] vite.config.ts: Proxy `/api` → `http://localhost:8082`
- [x] env.ts: API_URL = `/api` en dev
- [x] AuthService: POST /api/auth/login
- [x] HTTP Interceptor: Auto-inject Bearer token
- [ ] Backend: Verificar que /auth/login responde correctamente
- [ ] Login: Probar con credenciales del backend

---

## 📚 Referencias

- [Vite Server Proxy Guide](https://vitejs.dev/config/server-options.html#server-proxy)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [HTTP Preflight Requests](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)
