# ✨ Capa: CARACTERÍSTICAS

**Responsabilidad:** Lógica de negocio, servicios y hooks específicos de cada feature.

## 📖 Descripción

Las características encapsulan la **lógica de negocio** y las **APIs** asociadas:

- `autenticacion/` - Autenticación y sesión
- `registrar-postulante/` - Registro de nuevo postulante
- `editar-postulante/` - Edición de datos postulante
- `registrar-empleado/` - Registro de empleado
- `baja-empleado/` - Proceso de baja
- `gestion-leads/` - Gestión de leads
- `community/` - Gestión de community
- `admin/` - Panel admin

## 🔗 Relaciones

**Importa de:**
```
├── @entidades        → Tipos de dominio
├── @caracteristicas/{MISMA}/    → Módulos de la misma feature
└── @compartido       → UI genérica + utils + validación
```

**NO importa de:**
```
❌ @paginas
❌ @widgets
❌ @caracteristicas/{OTRA}     ← Características NO son islas
❌ @app
```

## 📁 Patrón de Archivo

```
caracteristicas/{feature}/
├── api/
│   └── {feature}.service.ts       ← Llamadas HTTP
├── modelo/
│   └── {feature}.tipos.ts         ← Tipos específicos
│   └── {feature}.schemas.ts       ← Validaciones Zod/Yup
├── hooks/  (opcional)
│   └── use{Feature}.ts            ← Lógica de hooks
├── ui/
│   └── {Feature}Form.tsx          ← Componente form
│   └── {Feature}Modal.tsx         ← Modales si aplica
└── index.ts                       ← Exportación pública
```

## ✅ Ejemplos de imports CORRECTOS

```typescript
// caracteristicas/registrar-postulante/ui/NewApplicantForm.tsx
import { Boton } from '@compartido/ui/boton';
import { Entrada } from '@compartido/ui/entrada';
import { useValidacionFormulario } from '@compartido/ganchos';
import { Postulante } from '@entidades/postulante/modelo';
import { crearPostulante } from '../api/postulante.service';
import { esquemaPostulante } from '../modelo/postulante.schemas';

export function NewApplicantForm() {
  // Lógica aquí
}
```

## 📋 Capas internas de Features

Cada feature puede tener:

| Carpeta | Contenido | Ejemplo |
|---------|----------|---------|
| `api/` | Servicios CRUD | `postulante.service.ts` |
| `modelo/` | Tipos + Validaciones | `postulante.tipos.ts`, `postulante.schemas.ts` |
| `hooks/` | Lógica reutilizable intra-feature | `useCommunityDashboard.ts` |
| `ui/` | Componentes de la feature | `NewApplicantForm.tsx` |

## ⚠️ Validación

Cada característica DEBE:
- ✅ Ser **independiente** (no depender de otra feature)
- ✅ Encapsular su lógica en `api/` + `modelo/`
- ✅ Exportar públicamente desde `index.ts`
- ✅ Validar inputs con Zod/Yup
- ✅ Usar tipos de `@entidades`

## 🚫 ANTI-PATRONES

```typescript
// ❌ PROHIBIDO: Importar de otra feature
import { useCompletar } from '@caracteristicas/admin/hooks';

// ❌ PROHIBIDO: Lógica en componentes
export function MyForm() {
  const [data] = useState();
  fetch('api/...');  // ← Debe estar en api/
}

// ✅ CORRECTO: Lógica encapsulada
export function MyForm() {
  const { data } = useFeatureData();
  return <form>...</form>;
}
```

---

*Parte de FSD en Español - Ver: ARQUITECTURA_FSD_ESPANOL.md*
