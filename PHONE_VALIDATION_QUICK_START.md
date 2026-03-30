# 🚀 Guía Rápida: Activar Phone Validation Feature

## ⚡ En 3 pasos

### Paso 1: Configurar .env

```bash
# Si no existe, copiar archivo ejemplo
cp .env.example .env

# Editar .env y agregar tu clave de Numverify
VITE_NUMVERIFY_ACCESS_KEY=tu_clave_aqui
```

**Obtén clave gratuita (100 validaciones/mes):**
1. Ir a: https://numverify.com/
2. Sign up gratuito
3. Panel → API Keys
4. Copiar "Access Key"
5. Pegar en VITE_NUMVERIFY_ACCESS_KEY

### Paso 2: Agregar ruta (opcional)

Si quieres acceder a la página de demostración en `http://localhost:5173/validador`:

```typescript
// src/app/router/routes.ts

// Agregar al import
import PhoneValidationPage from '@pages/PhoneValidationPage';

// Agregar a la lista de rutas
export const routes = [
  // ... rutas existentes
  
  {
    path: '/validador',
    element: <PhoneValidationPage />,
    // Agregar permisos si usa RequireRole
    // requiredRoles: ['ADMIN', 'SUPERVISOR'],
  },
];
```

### Paso 3: Iniciar y probar

```bash
# 1. Reiniciar servidor dev (importante: recarga variables .env)
npm run dev

# 2. Abrir navegador
# http://localhost:5173/validador

# 3. Ingresar número, ej: +34628123456
# 4. Click en "Validar"
# 5. Ver resultados
```

---

## 🧪 Probar en tu código

### Uso minimalista

```typescript
import { usePhoneValidation, PhoneNumberInput, PhoneValidationResult } from '@caracteristicas/phone-validation';

export function MiComponente() {
  const { data, loading, error, validate, reset } = usePhoneValidation();

  return (
    <div>
      <PhoneNumberInput onValidate={validate} isLoading={loading} error={error} />
      <PhoneValidationResult data={data} isLoading={loading} error={error} onReset={reset} />
    </div>
  );
}
```

### Con formulario

```typescript
import { useForm } from 'react-hook-form';
import { usePhoneValidation } from '@caracteristicas/phone-validation';

export function FormularioConTelefono() {
  const { register, watch } = useForm();
  const { validate, data, error } = usePhoneValidation();

  const phoneNumber = watch('phone');

  const handleValidate = async () => {
    await validate(phoneNumber);
  };

  return (
    <div>
      <input {...register('phone')} placeholder="Teléfono" />
      <button onClick={handleValidate}>Validar</button>
      {data?.valid && <p>✓ {data.country_name}</p>}
      {error && <p>✗ {error}</p>}
    </div>
  );
}
```

---

## 📋 Números de prueba

| País | Número | Formato |
|------|--------|---------|
| 🇪🇸 España | `+34628123456` | +CC + 9 dígitos |
| 🇺🇸 USA | `+12025550173` | +CC + 10 dígitos |
| 🇦🇷 Argentina | `+5491112345678` | +CC + 10 dígitos |
| 🇲🇽 México | `+525555123456` | +CC + 10 dígitos |
| 🇨🇴 Colombia | `+573001234567` | +CC + 10 dígitos |

O sin prefijo:
- País: `ES`, Número: `628123456`
- País: `US`, Número: `2025550173`

---

## 🐛 Troubleshooting

### "VITE_NUMVERIFY_ACCESS_KEY no está definida"
```bash
# Solución: 
# 1. Verificar .env existe
# 2. Reiniciar servidor: npm run dev
# 3. No olvidar: VITE_ prefix es obligatorio en Vite
```

### "Invalid API key"
```bash
# Solución:
# 1. Verifica clave en https://numverify.com/dashboard
# 2. Copia exactamente (sin espacios)
# 3. Reinicia servidor dev
```

### "CORS error"
```bash
# Solución:
# - Planes free pueden requerir proxy
# - Alternativa: Usar servidor backend como intermediario
# - O: Cambiar plan en numverify.com
```

### El número es válido pero muestra error
```bash
# Probable causa:
# - Número mal formateado
# - Prefijo país incorrecto
# - Número no activo/inexistente

# Prueba:
# - Agregar país en select
# - Usar formato internacional: +XX...
```

---

## 📚 Documentación Completa

Leer [PHONE_VALIDATION_RESUMEN.md](./PHONE_VALIDATION_RESUMEN.md) y [src/caracteristicas/phone-validation/README.md](./src/caracteristicas/phone-validation/README.md)

---

## ✅ Checklist

- [ ] .env configurado con VITE_NUMVERIFY_ACCESS_KEY
- [ ] Servidor dev reiniciado (`npm run dev`)
- [ ] Página accesible en `/validador`
- [ ] Número ingresado y validado
- [ ] Resultado muestra prefijo, país, operador
- [ ] Hook importado correctamente desde `@caracteristicas/phone-validation`
- [ ] Componentes reutilizables en tus páginas

---

**¡Listo! La feature está operativa. ¡Feliz validación! 🎉**
