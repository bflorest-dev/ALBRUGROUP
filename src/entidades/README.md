# 🏛️ Capa: ENTIDADES

**Responsabilidad:** Tipos de dominio + UI **específica** de cada entidad.

## 📖 Descripción

Las entidades representan el **dominio de negocio** con componentes UI específicos:

- `postulante/` - Tipo + UI de postulante
- `empleado/` - Tipo + UI de empleado
- `lead/` - Tipo + UI de lead
- `tipificacion/` - Tipo + UI de tipificación
- `asesor/` - Tipo + UI de asesor
- `usuario/` - Tipo + UI de usuario

### 🔑 DIFERENCIA CON ARQUITECTURA CLEAN

**A DIFERENCIA de Clean Architecture:**

```
✅ entidades/{entidad}/ui/ ESTÁ PERMITIDO
   - LeadListItem.tsx
   - LeadDetailCard.tsx
   - TipificationOption.tsx

❌ En Clean Arch, las entidades NO tienen UI
```

## 🔗 Relaciones

**Importa de:**
```
@compartido       → UI genérica + utils + tipos comunes
```

**NO importa de:**
```
❌ @paginas
❌ @widgets
❌ @caracteristicas
❌ @entidades/{OTRA}
❌ @app
```

## 📁 Patrón de Archivo

```
entidades/{entidad}/
├── modelo/
│   ├── {entidad}.tipos.ts          ← Tipos base
│   ├── {entidad}.enums.ts          ← Enums (opcional)
│   └── indice.ts                   ← Exportación
├── ui/
│   ├── {Entidad}Card.tsx           ← Componentes específicos
│   ├── {Entidad}Form.tsx           ← (Solo si UI específica)
│   └── indice.ts                   ← Exportación
└── indice.ts                       ← Exportación raíz
```

## ✅ Ejemplos de imports CORRECTOS

```typescript
// entidades/lead/modelo/lead.tipos.ts
export interface Lead {
  id: string;
  nombre: string;
  estado: LeadEstado;
  fuente: LeadFuente;
}

export enum LeadEstado {
  ABIERTO = 'abierto',
  CONTACTADO = 'contactado',
  CERRADO = 'cerrado',
}
```

```typescript
// entidades/lead/ui/LeadListItem.tsx
import { Lead } from '../modelo/lead.tipos';
import { Insignia } from '@compartido/ui/insignia';

export interface LeadListItemProps {
  lead: Lead;
  onSelect?: (lead: Lead) => void;
}

export function LeadListItem({ lead, onSelect }: LeadListItemProps) {
  return (
    <div onClick={() => onSelect?.(lead)}>
      <h3>{lead.nombre}</h3>
      <Insignia estado={lead.estado} />
    </div>
  );
}
```

## 📋 Contenido típico por carpeta

### `modelo/`
- **Tipos TypeScript** para la entidad
- **Enums** si aplica
- **Interfaces** de contrato
- **Constantes** de la entidad (StatusBadge mapping, etc)

### `ui/`
- **Componentes visuales** específicos de la entidad
- **Formas de presentación** (Card, List Item, etc)
- **Badges/Labels** específicos

## ⚠️ Validación

Cada entidad DEBE:
- ✅ Definir sus tipos en `modelo/`
- ✅ Exportar tipos públicamente via `indice.ts`
- ✅ Componentes UI ser **específicos** del dominio
- ✅ NO importar de características
- ✅ NO importar de otras entidades
- ✅ Mantener independencia de negocio

## 🚫 ANTI-PATRONES

```typescript
// ❌ PROHIBIDO: Componente genérico en entidades
export function GenericButton() {}

// ❌ PROHIBIDO: Importar de características
import { useRegistrar } from '@caracteristicas/registrar-postulante';

// ❌ PROHIBIDO: Importar de otra entidad
import { Empleado } from '@entidades/empleado';

// ✅ CORRECTO: Componente específico del dominio
export function LeadCard({ lead }: { lead: Lead }) {
  return <div>{lead.nombre}</div>;
}
```

---

*Parte de FSD en Español - Ver: ARQUITECTURA_FSD_ESPANOL.md*
