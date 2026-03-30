# Matriz de Acceso - ALBRUGROUP

## Resumen de Roles y Rutas

| Ruta | Login | ADMINISTRADOR | RRHH | Reclutamiento | Capacitación | Community | GTR | Asesor Ventas |
|------|-------|---------------|------|---------------|--------------|-----------|-----|---------------|
| /login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| /panel | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| /rrhh | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| /reclutamiento | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| /capacitacion | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| /community | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| /gtr | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| /asesores | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| /no-autorizado | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Descripción de Roles

### ADMINISTRADOR
- **Descripción**: Acceso completo a todos los módulos
- **Rutas permitidas**: `/panel`, `/rrhh`, `/reclutamiento`, `/capacitacion`, `/community`, `/gtr`, `/asesores`
- **Acceso**: Todas las funcionalidades

### RRHH
- **Descripción**: Gestión de Recursos Humanos
- **Rutas permitidas**: `/rrhh`
- **Acceso**: Módulo de RRHH

### RECLUTAMIENTO
- **Descripción**: Procesos de Reclutamiento
- **Rutas permitidas**: `/reclutamiento`
- **Acceso**: Módulo de Reclutamiento

### CAPACITACIÓN
- **Descripción**: Gestión de Capacitación
- **Rutas permitidas**: `/capacitacion`
- **Acceso**: Módulo de Capacitación

### COMMUNITY
- **Descripción**: Gestión de Community
- **Rutas permitidas**: `/community`
- **Acceso**: Módulo de Community

### GTR
- **Descripción**: Gestor de Transferencias de Recursos
- **Rutas permitidas**: `/gtr`
- **Acceso**: Módulo de GTR

### ASESOR_DE_VENTAS
- **Descripción**: Asesores de Ventas
- **Rutas permitidas**: `/asesores`
- **Acceso**: Módulo de Asesores de Ventas

### LOGIN
- **Descripción**: Usuario autenticado genérico
- **Rutas permitidas**: `/login`, `/no-autorizado`
- **Acceso**: Sin acceso a módulos específicos

## Jerarquía de Roles

El rol **ADMINISTRADOR** implícitamente otorga acceso a todos los roles menores. Esta jerarquía se implementa en `src/app/router/RoleHierarchy.ts` mediante la función `canUserAccess()`.

### Lógica de Autorización

```typescript
if (userRoles.includes('ADMINISTRADOR')) {
  // ADMINISTRADOR tiene acceso a todo
  return true;
}
// Revisar si el usuario tiene alguno de los roles permitidos
return userRoles.some(role => allowedRoles.includes(role));
```

## Estructura de Implementación

### Archivos Clave

- **`src/app/router/RequireRole.tsx`**: Componente que protege rutas basado en roles
- **`src/app/router/RequireAuth.tsx`**: Componente que protege rutas que requieren autenticación
- **`src/app/router/RoleHierarchy.ts`**: Define la lógica de jerarquía de roles
- **`src/app/router/routes.ts`**: Define todas las rutas del sistema

### Flujo de Autorización

1. Usuario intenta acceder a una ruta protegida
2. `RequireAuth` verifica si el usuario está autenticado
   - ❌ No autenticado → Redirige a `/login`
3. `RequireRole` verifica si el usuario tiene los roles permitidos
   - ✅ Es ADMINISTRADOR → Permite acceso
   - ✅ Tiene uno de los roles permitidos → Permite acceso
   - ❌ No tiene permiso → Redirige a `/no-autorizado`

## Fuerza de Seguridad

- ✅ **ADMINISTRADOR bypass**: El rol ADMINISTRADOR puede acceder a cualquier ruta
- ✅ **Multi-rol**: Un usuario puede tener múltiples roles
- ✅ **Role-based Protection**: Cada ruta define sus roles permitidos
- ✅ **Session Persistence**: La autenticación se mantiene en localStorage

## Notas Técnicas

- Las rutas se definen en `src/app/router/routes.ts` con sus `allowedRoles`
- El componente `AppRoutes` en `src/app/router/AppRoutes.tsx` envuelve cada ruta protegida
- El contexto `AuthContext` mantiene el estado de autenticación
- `useAuth()` hook para acceder al contexto desde cualquier componente
