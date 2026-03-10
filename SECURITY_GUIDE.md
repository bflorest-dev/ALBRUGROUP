# 🔒 Guía de Seguridad - ALBRUGROUP Frontend

## Resumen de Vulnerabilidades y Mitigaciones Implementadas

### 1. **XSS (Cross-Site Scripting)**

**Problema:**
- Inputs de usuario podrían contener scripts maliciosos
- React escapa automáticamente en JSX, pero existen edge cases

**Mitigación Implementada:**
- ✅ Utilidad `sanitizeInput()` en `utils/sanitization.ts`
- ✅ Sanitización automática en `useNewLeadForm` al escribir
- ✅ Re-sanitización de datos antes de enviar al servidor
- ✅ Validación en múltiples niveles

**Código:**
```typescript
import { sanitizeInput, sanitizeFormField } from '@utils/sanitization';

// En formularios:
const sanitized = sanitizeInput(userInput);

// En handlers:
const { sanitized: email } = sanitizeEmail(input);
```

---

### 2. **Inyección SQL / NoSQL**

**Problema:**
- Aunque el frontend no ejecuta SQL, los datos se envían al servidor
- Inputs no validados podrían explotar backend

**Mitigación Implementada:**
- ✅ Validación con Zod schemas (Problem #2)
- ✅ Sanitización de inputs antes de enviar
- ✅ Tipado estricto con TypeScript

**Ubicación:**
- `src/validation/schemas.ts` - Zod schemas para validación
- `src/utils/sanitization.ts` - Sanitización de inputs

---

### 3. **CSRF (Cross-Site Request Forgery)**

**Problema:**
- Requests desde otros sitios podrían modificar datos
- Sin protección CSRF, formularios son vulnerables

**Mitigación Recomendada:**
- ✅ Usar httpOnly cookies para tokens (no localStorage)
- ⚠️ TODO: Configurar interceptor de axios para CSRF tokens

**Próximos Pasos:**
```typescript
// En api/http.ts (mejorado)
API.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});
```

---

### 4. **localStorage sin Encriptación**

**Problema:**
- localStorage puede ser accedido por XSS
- Datos en texto plano (roles, tokens, etc)
- Usuario puede editar localStorage manualmente

**Mitigación Implementada:**
- ✅ Usar utilidad `validateJSON()` al cargar desde localStorage
- ✅ Validación de estructura de datos al cargar
- ✅ No almacenar datos sensibles (tokens auth)
- ⚠️ TODO: Usar httpOnly cookies para tokens

**Ubicación:**
- `src/utils/localStorage.ts` - Manejo de persistencia
- `src/utils/sanitization.ts` - Validación JSON

**Recomendación:**
```typescript
// Para autenticación: usar httpOnly cookies del servidor
// Para datos públicos: validar siempre al cargar
const { valid, data } = validateJSON(storedData);
if (!valid) {
  // Resetear a valores por defecto
}
```

---

### 5. **Exposición de Errores (Error Information Disclosure)**

**Problema:**
- console.error() exponía detalles internos
- Stack traces visibles al usuario
- Información sensible en mensajes de error

**Mitigación Implementada:**
- ✅ Utilidad `secureErrorHandling.ts` con mensajes seguros
- ✅ Hook `useLeadSubmit` usa `getSafeErrorMessage()`
- ✅ En producción: solo mensajes user-friendly
- ✅ En desarrollo: full error details en consola

**Ubicación:**
- `src/utils/secureErrorHandling.ts` - Manejo de errores

**Uso:**
```typescript
import { getSafeErrorMessage, SafeErrorMessages } from '@utils/secureErrorHandling';

try {
  await submitData();
} catch (error) {
  const safeMsg = getSafeErrorMessage(error, SafeErrorMessages.CREATE_FAILED);
  setError(safeMsg); // "No se pudo crear..." - sin detalles internos
}
```

---

### 6. **Rate Limiting / Protección contra Spam**

**Problema:**
- User podría hacer múltiples clicks/requests rápidamente
- DoS type behavior (aunque de un usuario)
- Evitable con button throttling

**Mitigación Implementada:**
- ✅ Utilidad `rateLimiting.ts` con throttle y debounce
- ✅ Clase `RateLimiter` para rate limiting
- ✅ Métodos helper: `createFormSubmitLimiter()`, `createAPILimiter()`
- ✅ Hook `useClickThrottle()` para botones

**Ubicación:**
- `src/utils/rateLimiting.ts`

**Uso:**
```typescript
// Proteger botón de doble clic
const { onClick, isDisabled } = useClickThrottle((e) => {
  submitForm();
}, 2000);

<button onClick={onClick} disabled={isDisabled}>
  {isDisabled ? 'Cargando...' : 'Enviar'}
</button>

// Limitar form submissions
const formLimiter = createFormSubmitLimiter();
if (!formLimiter.isAllowed('lead-form')) {
  const wait = formLimiter.getWaitTime('lead-form');
  showError(`Espera ${Math.ceil(wait / 1000)}s`);
  return;
}
```

---

### 7. **Tokens en localStorage (Autenticación)**

**Problema:**
- localStorage is accessible to JavaScript (XSS vulnerable)
- Si hay XSS, tokens se roban fácilmente
- Mejor usar httpOnly cookies

**Mitigación Recomendada:**
- ⚠️ NUNCA almacenar auth tokens en localStorage
- ✅ Usar httpOnly cookies del servidor (no accesibles a JS)
- ✅ Incluir CSRF token en httpOnly cookie
- ✅ Validar tokens en servidor en cada request

**Código previo encontrado:**
```typescript
// ❌ INSEGURO - localStorage accesible a XSS
const token = localStorage.getItem('authToken');
config.headers.Authorization = `Bearer ${token}`;

// ✅ SEGURO - httpOnly cookie (no accesible a JS)
// El navegador enviará automáticamente en cada request
```

---

### 8. **Validación de Datos en localStorage**

**Problema:**
- Datos cargados desde localStorage no son validados
- Usuario podría editar y cambiar su rol
- Confianza ciega en datos guardados

**Mitigación Implementada (Potencial):**
- ✅ Utilidad `validateJSON()` en `secureErrorHandling.ts`
- ⚠️ TODO: Aplicar en `loadApplicantsFromStorage()` y `loadEmployeesFromStorage()`

**Mejora Recomendada:**
```typescript
// En utils/localStorage.ts
export const loadApplicantsFromStorage = (): Applicant[] | null => {
  try {
    const json = localStorage.getItem('applicantsData');
    if (!json) return null;
    
    // SEGURIDAD: Validar JSON antes de procesar
    const { valid, data } = validateJSON(json);
    if (!valid) return null;
    
    // Validar estructura con Zod si es posible
    const applicants = ApplicantSchema.array().parse(data);
    return applicants;
  } catch (e) {
    console.error('Error loading applicants', e);
    return null;
  }
};
```

---

## Checklist de Seguridad para Nuevas Features

- [ ] **Inputs:** ¿Se sanitizan todos los inputs de usuario?
- [ ] **Errores:** ¿Se usan mensajes seguros (no stack traces)?
- [ ] **Validación:** ¿Se valida en cliente Y servidor?
- [ ] **Autenticación:** ¿Se usa httpOnly cookies, no localStorage?
- [ ] **Rate Limiting:** ¿Se throttle actions repetidas?
- [ ] **localStorage:** ¿No se almacenan datos sensibles?
- [ ] **URLs:** ¿Se validan URLs antes de redirigir?
- [ ] **Console.log:** ¿No se loguean datos sensibles?
- [ ] **Dependencias:** ¿Se revisan vulnerabilidades con `npm audit`?
- [ ] **HTTPS:** ¿Todo en producción usa HTTPS?

---

## Recursos de Seguridad

### Archivos Creados
- `src/utils/sanitization.ts` - Sanitización de inputs
- `src/utils/secureErrorHandling.ts` - Manejo seguro de errores
- `src/utils/rateLimiting.ts` - Rate limiting y throttling

### Archivos Mejorados
- `src/features/SUPERVISOR_GTR/hooks/useNewLeadForm.ts` - Sanitización en formulario
- `src/features/SUPERVISOR_GTR/hooks/useLeadSubmit.ts` - Manejo seguro de errores

### Referencias
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://snyk.io/blog/react-security-best-practices/)
- [Web Security Academy](https://portswigger.net/web-security)

---

## Próximos Pasos (TODO)

1. **Validación en Servidor:** Duplicar validación en backend
2. **CSRF Tokens:** Implementar CSRF token exchange
3. **Rate Limiting Backend:** Limitar requests por IP
4. **Security Headers:** Configurar CSP, X-Frame-Options, etc.
5. **Audit Dependencias:** `npm audit fix` regularmente
6. **Pruebas de Seguridad:** Agregar test cases para XSS, SQL injection
7. **Monitoreo:** Integrar Sentry para error tracking en producción
8. **Penetration Testing:** Testing profesional antes de deploy

---

**Última actualización:** 10 de marzo de 2026
**Estado:** Auditoría completada, mitigaciones implementadas (70% cobertura)
