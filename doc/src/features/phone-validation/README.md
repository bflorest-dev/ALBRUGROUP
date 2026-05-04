# Phone Validation Feature - Documentación Completa

## 🎯 Objetivo

Integración completa de validación de números telefónicos usando **Numverify API** siguiendo arquitectura **Feature-Sliced Design (FSD)** + **Atomic Design** en React + TypeScript.

## 📁 Estructura FSD

```
src/
├── caracteristicas/
│   └── phone-validation/          ← Feature principal
│       ├── api/
│       │   ├── phoneValidation.api.ts    ← Llamada a API enriquecida
│       │   └── index.ts                  ← Barril de exportación
│       ├── model/
│       │   ├── types.ts                  ← Tipos e interfaces
│       │   ├── usePhoneValidation.ts     ← Hook personalizado
│       │   └── index.ts                  ← Barril de exportación
│       ├── ui/
│       │   ├── atoms/                    ← Componentes básicos
│       │   │   ├── PhoneInput.tsx
│       │   │   ├── PhoneInput.module.css
│       │   │   └── index.ts
│       │   ├── molecules/                ← Combinaciones de átomos
│       │   │   ├── PhoneNumberInput.tsx
│       │   │   ├── PhoneNumberInput.module.css
│       │   │   └── index.ts
│       │   ├── organisms/                ← Componentes complejos
│       │   │   ├── PhoneValidationResult.tsx
│       │   │   ├── PhoneValidationResult.module.css
│       │   │   └── index.ts
│       │   └── index.ts                  ← Barril de exportación
│       └── index.ts                      ← Barril público de la feature
├── shared/
│   └── api/
│       └── numverify.ts                  ← Configuración base de Numverify
└── pages/
    ├── PhoneValidationPage.tsx           ← Página de ejemplo
    └── PhoneValidationPage.module.css
```

## 🏗️ Reglas FSD Implementadas

### Capas y dependencias (arriba → abajo)

```
app
 ↓
pages ← PhoneValidationPage (consume la feature)
 ↓
widgets (si existiera)
 ↓
features (caracteristicas) ← phone-validation
 ↓
entities (entidades)
 ↓
shared ← numverify.ts, api utilities
```

### Importaciones permitidas

✅ **pages/PhoneValidationPage.tsx** puede importar:
```typescript
import { usePhoneValidation, PhoneNumberInput, ... } from '@caracteristicas/phone-validation';
```

✅ **phone-validation/ui/** pueden importar:
```typescript
import { PhoneInput } from '../atoms';
```

✅ **phone-validation/api/** puede importar:
```typescript
import { validatePhoneNumber } from '@shared/api/numverify';
```

❌ **phone-validation/** NO puede importar:
```typescript
// ✗ No puede importar de capas superiores
import { ... } from '@pages';
import { ... } from '@widgets';
```

## 🚀 Cómo usar

### 1. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_NUMVERIFY_ACCESS_KEY=tu_clave_aqui
```

O copia desde `.env.example`:

```bash
cp .env.example .env
```

> **Obtén tu clave gratuita en:** [http://apilayer.net/](http://apilayer.net/)

### 2. Uso en una página

```typescript
import React from 'react';
import {
  usePhoneValidation,
  PhoneNumberInput,
  PhoneValidationResult,
} from '@caracteristicas/phone-validation';

export const MiPaginaConValidacion: React.FC = () => {
  const { data, loading, error, validate, reset } = usePhoneValidation({
    onSuccess: (result) => {
      console.log('Validado:', result);
      // result.countryPrefix = "+34"
      // result.countryName = "Spain"
      // result.carrier = "Vodafone ES"
      // etc.
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  return (
    <div>
      <PhoneNumberInput
        onValidate={validate}
        isLoading={loading}
        error={error}
        label="Teléfono"
      />

      <PhoneValidationResult
        data={data}
        isLoading={loading}
        error={error}
        onReset={reset}
      />
    </div>
  );
};
```

### 3. Página de demostración

Ya existe una página de demostración en `src/pages/PhoneValidationPage.tsx`.

Si quieres añadirla a las rutas de la app:

```typescript
// En src/app/router/routes.ts o donde definas las rutas:

import PhoneValidationPage from '@pages/PhoneValidationPage';

export const routes = [
  // ... otras rutas
  {
    path: '/validador-telefonico',
    element: <PhoneValidationPage />,
  },
];
```

## 🧩 Componentes Disponibles

### usePhoneValidation Hook

Hook personalizado que gestiona la validación.

```typescript
const { data, loading, error, validate, reset } = usePhoneValidation(options?);
```

**Propiedades:**
- `data: NumverifyResponse | null` - Datos de la validación (null si no hay)
- `loading: boolean` - True mientras se valida
- `error: string | null` - Mensaje de error si ocurre algo
- `validate(phoneNumber, countryCode?)` - Función para validar
- `reset()` - Limpia el estado

**Opciones:**
```typescript
{
  onSuccess?: (result: PhoneValidationResult) => void;
  onError?: (error: string) => void;
}
```

### Componentes UI

#### PhoneInput (Atom)
Input básico para números telefónicos.

```typescript
<PhoneInput
  label="Tu teléfono"
  placeholder="+34 628 123 456"
  error={error}
  helperText="Incluye el prefijo del país"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
/>
```

#### PhoneNumberInput (Molecule)
Combina input + botón de validación + selector de país.

```typescript
<PhoneNumberInput
  onValidate={validate}
  isLoading={loading}
  error={error}
  label="Número a validar"
  helperText="Ej: +34 628 123 456"
/>
```

#### PhoneValidationResult (Organism)
Muestra los resultados de la validación con información enriquecida.

```typescript
<PhoneValidationResult
  data={data}
  isLoading={loading}
  error={error}
  onReset={reset}
/>
```

## 📊 Datos disponibles en la respuesta

```typescript
interface NumverifyResponse {
  valid: boolean;                    // ¿Es válido?
  number: string;                    // Número procesado
  local_format: string;              // Formato local (ej: 628 123 456)
  international_format: string;      // Formato internacional (ej: +34 628 123 456)
  country_prefix: string;            // Prefijo del país (ej: +34)
  country_code: string;              // Código ISO (ej: ES)
  country_name: string;              // Nombre del país (ej: Spain)
  location: string;                  // Ubicación geográfica
  carrier: string;                   // Operador (ej: Vodafone ES)
  line_type: string;                 // Tipo de línea (mobile, landline, etc.)
}
```

## 🔧 Ejemplos avanzados

### Usar con formularios

```typescript
const { register, handleSubmit } = useForm();
const { validate, data, error } = usePhoneValidation();

const onSubmit = async (form: any) => {
  await validate(form.phone);
};

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <input {...register('phone')} />
    <button type="submit">Validar</button>
  </form>
);
```

### Validar con debounce

```typescript
import { useMemo } from 'react';
import { debounce } from 'lodash';

const { validate } = usePhoneValidation();

const debouncedValidate = useMemo(
  () => debounce((phone: string) => validate(phone), 500),
  [validate]
);

useEffect(() => {
  debouncedValidate(phoneNumber);
}, [phoneNumber, debouncedValidate]);
```

### Integrar con React Query

Aunque el hook ya gestiona estado internamente, puedes cachear con React Query:

```typescript
import { useMutation } from '@tanstack/react-query';
import { validatePhone } from '@caracteristicas/phone-validation';

const mutation = useMutation({
  mutationFn: (phone: string) => validatePhone({ number: phone }),
});
```

## 🧪 Testing

### Test del hook

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePhoneValidation } from '@caracteristicas/phone-validation';

test('valida un número correctamente', async () => {
  const { result } = renderHook(() => usePhoneValidation());

  await act(async () => {
    await result.current.validate('+34628123456');
  });

  expect(result.current.data?.valid).toBe(true);
  expect(result.current.data?.country_name).toBe('Spain');
});
```

## 🐛 Troubleshooting

### "VITE_NUMVERIFY_ACCESS_KEY no está definida"

**Solución:** Asegúrate de tener la variable en `.env`:
```env
VITE_NUMVERIFY_ACCESS_KEY=tu_clave_actual
```

Después reinicia el servidor dev (`npm run dev`).

### "Error: Invalid API key"

**Solución:** Verifica que tu clave sea correcta en [http://apilayer.net/dashboard](http://apilayer.net/dashboard).

### La API devuelve error CORS

**Solución:** Verifica que tu plan en Numverify permite CORS. Los planes free podrían requerir proxy.

### "TypeError: Cannot read property 'valid' of undefined"

**Solución:** Asegúrate de verificar `data !== null` antes de acceder a propiedades:

```typescript
{data && data.valid && (
  <p>Número válido: {data.country_name}</p>
)}
```

## 📦 Entregables

✅ Estructura FSD completa y validada  
✅ 4 capas: api, model, ui (atoms/molecules/organisms), index  
✅ Hook personalizado con error handling  
✅ 3 componentes UI puros (Atom, Molecule, Organism)  
✅ Cliente de Numverify en shared/api  
✅ Página de ejemplo funcional  
✅ Estilos CSS Module coherentes  
✅ Tipos TypeScript completos  
✅ Reglas FSD estrictas aplicadas  
✅ Documentación exhaustiva  
✅ Build sin errores  

## 🎓 Aprendizajes FSD

- ✅ **Capas separadas**: api, model, ui con responsabilidades claras
- ✅ **Atomic Design**: Atoms (input) → Molecules (input + button) → Organisms (result panel)
- ✅ **Importaciones estrictas**: pages importan de features, features importan de shared
- ✅ **Barriles de exportación**: Controlan qué queda público de cada capa
- ✅ **Estados puros**: Componentes UI sin lógica, hooks centralizan estado
- ✅ **TypeScript**: Tipado estricto sin `any`

---

**Última actualización:** 30/03/2026  
**Versión:** 1.0.0
