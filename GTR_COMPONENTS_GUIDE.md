# Implementación de Componentes GTR (Gestión de Leads)

## ✅ Estado: BUILD SUCCESS (0 errores)

Build realizado en **2.32s** con **0 errores TypeScript** - Arquitectura FSD completa y validada.

---

## 📋 Descripción General

Se han generado **componentes React/TypeScript funcionales** para la interfaz de **GTR (Gestión de Leads)** respetando:
- ✅ Arquitectura **Feature-Sliced Design (FSD)** estricta
- ✅ Control de **permisos por rol (ASESOR_GTR)**
- ✅ **React Query** para gestión de estado
- ✅ **Endpoints documentados** del backend
- ✅ **Validaciones y manejo de errores**
- ✅ **Componentes modulares y reutilizables**

---

## 🏗️ Estructura de Archivos Creada

```
src/
├── entidades/lead/
│   ├── types.ts              ← Tipos y permisosde Lead (LeadIntakeRequest, etc)
│   └── index.ts
│
├── caracteristicas/gtr/
│   ├── index.ts              ← Punto de acceso público de feature
│   ├── model/
│   │   ├── gtr.repo.ts       ← Repositorio con endpoints /leads/leads
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useGtrQueries.ts  ← React Query hooks + query keys
│   │   ├── useLeadGtr.ts     ← (existente, mantiene compat)
│   │   └── index.ts
│   ├── ui/
│   │   ├── AltaLead.tsx          ← Registrar nuevo lead (POST /leads/intake)
│   │   ├── AltaLead.module.css
│   │   ├── AsignacionLead.tsx    ← Asignar lead a asesor (PATCH /asignacion)
│   │   ├── AsignacionLead.module.css
│   │   ├── TablaLeadsGTR.tsx     ← Vista supervisión (GET /leads/gtr)
│   │   ├── TablaLeadsGTR.module.css
│   │   ├── TablaLeadsAsesorVentas.tsx  ← Bandeja asesor (GET /asesor-ventas)
│   │   ├── TablaLeadsAsesorVentas.module.css
│   │   └── index.ts
│   └── pages/
│       └── PaginaGTR.tsx     ← (existente, puede integrarse con nuevos componentes)
│
└── shared/
    └── ui/
        ├── form-input/
        │   ├── FormInput.tsx
        │   └── FormInput.module.css
        ├── form-select/
        │   ├── FormSelect.tsx
        │   └── FormSelect.module.css
        ├── utilities/
        │   ├── Utilities.tsx     ← Alert, Spinner, Badge, Button, TextArea
        │   └── Utilities.module.css
        └── index.ts
```

---

## 🎯 Componentes Principales

### 1. **AltaLead** - Registrar Nuevo Lead
**Ubicación:** `src/caracteristicas/gtr/ui/AltaLead.tsx`

**Endpoint:** `POST /leads/leads/intake`

**Funcionalidad:**
- Formulario para registrar lead con campos:
  - `prefijo` (texto, máx 10 caracteres)
  - `lead` (números solo)
  - `idCampana` (select con listado dinámico)
  - `base` (select: WHATSAPP, TELEFONO, EMAIL, SMS)
- Validaciones integradas
- Manejo de errores con mensajes claros
- Control de permiso: `CREATE_LEADS`

**Props:**
```typescript
interface AltaLeadProps {
  permisos: PermisosGTR;
  onSuccess?: () => void;  // Callback después de crear
}
```

**Uso:**
```tsx
import { AltaLead } from '@caracteristicas/gtr';

<AltaLead 
  permisos={userPermisos} 
  onSuccess={() => console.log('Lead creado')}
/>
```

---

### 2. **AsignacionLead** - Asignar Lead a Asesor
**Ubicación:** `src/caracteristicas/gtr/ui/AsignacionLead.tsx`

**Endpoint:** `PATCH /leads/{idLead}/asignacion`

**Funcionalidad:**
- Modal/formulario para asignar/reasignar lead
- Muestra asesor actual
- Select de asesores disponibles
- Visu previa de selección
- Control de permiso: `ASSIGN_LEADS`

**Props:**
```typescript
interface AsignacionLeadProps {
  idLead: number;
  nombreLeadActual?: string;
  asesorActual?: { id: number; nombre: string };
  asesoresDisponibles: Array<{ id: number; nombre: string }>;
  isLoading?: boolean;
  onSuccess?: (asesorNombre: string) => void;
  onCancel?: () => void;
  permisos: PermisosGTR;
}
```

**Uso:**
```tsx
import { AsignacionLead } from '@caracteristicas/gtr';

<AsignacionLead 
  idLead={123}
  nombreLeadActual="Juan Pérez"
  asesorActual={{ id: 5, nombre: "Carlos" }}
  asesoresDisponibles={asesores}
  permisos={userPermisos}
  onSuccess={(nombre) => alert(`Asignado a ${nombre}`)}
/>
```

---

### 3. **TablaLeadsGTR** - Supervisión de Todos los Leads
**Ubicación:** `src/caracteristicas/gtr/ui/TablaLeadsGTR.tsx`

**Endpoint:** `GET /leads/leads/gtr`

**Funcionalidad:**
- Tabla con columnas: ID, Fecha, Campaña, Proveedor, Base, Titular, Tipificación, Asesor, Estado, Reasignaciones
- **Búsqueda** por ID o nombre
- **Filtrado** por:
  - Campaña
  - Asesor
  - Estado de seguimiento
- **Paginación** (20 items por página, configurable)
- **Selección múltiple** de leads
- **Acciones inline:**
  - 🔄 Reasignar (si `ASSIGN_LEADS`)
  - ☎️ Contactar (si `CONTACT_LEADS`)
- Respons para móviles

**Props:**
```typescript
interface TablaLeadsGTRProps {
  permisos: PermisosGTR;
  onReasignarClick?: (lead: LeadGtrResponse, asesores: Array<...>) => void;
  filtros?: { campana?: string; asesor?: string; estado?: string };
  itemsPerPage?: number;  // default: 20
}
```

**Uso:**
```tsx
import { TablaLeadsGTR } from '@caracteristicas/gtr';

<TablaLeadsGTR 
  permisos={userPermisos}
  onReasignarClick={(lead, asesores) => abrirModal(lead)}
  itemsPerPage={25}
/>
```

---

### 4. **TablaLeadsAsesorVentas** - Bandeja de Asesor
**Ubicación:** `src/caracteristicas/gtr/ui/TablaLeadsAsesorVentas.tsx`

**Endpoint:** `GET /leads/leads/asesor-ventas`

**Funcionalidad:**
- Tabla de leads asignados al asesor actual
- Columnas: ID, Fecha Asignación, Teléfono, Titular, Email, Estado Seguimiento
- **Búsqueda** por ID, teléfono, nombre o email
- **Filtrado** por estado
- **Paginación**
- **Acciones:**
  - 👁️ Ver detalles
  - ✏️ Actualizar estado (si `UPDATE_LEADS_ASESOR`)
  - 🏷️ Tipificar (si `TYPIFY_LEADS`)
- Respons para móviles

**Props:**
```typescript
interface TablaLeadsAsesorVentasProps {
  permisos: PermisosGTR;
  idAsesor?: number;
  onLeadClick?: (lead: LeadAsesorVentasResponse) => void;
  itemsPerPage?: number;
}
```

**Uso:**
```tsx
import { TablaLeadsAsesorVentas } from '@caracteristicas/gtr';

<TablaLeadsAsesorVentas 
  permisos={userPermisos}
  idAsesor={currentUserId}
  onLeadClick={(lead) => mostrarDetalles(lead)}
/>
```

---

## 🎨 Componentes UI Reutilizables

### FormInput
Componente de input con validación
```tsx
import { FormInput } from '@shared/ui';

<FormInput
  label="Prefijo"
  name="prefijo"
  value={prefijo}
  onChange={setPrefijo}
  placeholder="Ej: +51"
  error={errors.prefijo}
  required
  maxLength={10}
/>
```

### FormSelect
Dropdown con validación
```tsx
import { FormSelect } from '@shared/ui';

<FormSelect
  label="Campaña"
  name="campaign"
  value={idCampana}
  onChange={setIdCampana}
  options={campaigns}
  placeholder="Selecciona..."
  isLoading={isLoading}
  error={errors.campaign}
/>
```

### Alert, Spinner, Badge, Button
```tsx
import { Alert, Spinner, Badge, Button } from '@shared/ui';

<Alert type="success" message="Lead creado" />
<Spinner size="medium" text="Cargando..." />
<Badge label="ACTIVO" variant="success" />
<Button variant="primary" size="large" isLoading={false}>
  Guardar
</Button>
```

---

## 🔗 Hooks React Query

### useLeadsGTR
```tsx
const { data, isPending, error, refetch } = useLeadsGTR({
  fecha: '2026-03-25'
});
```

### useLeadsAsesorVentas
```tsx
const { data, isPending } = useLeadsAsesorVentas({
  idAsesor: 123,
  estado: 'EN_SEGUIMIENTO',
  fechaDesde: '2026-01-01',
});
```

### Mutations
```tsx
// Crear lead
const createMutation = useCreateLeadMutation();
await createMutation.mutateAsync({
  prefijo: '+51',
  lead: '999888777',
  idCampana: 1,
  base: 'WHATSAPP',
});

// Asignar lead
const assignMutation = useAssignLeadMutation();
await assignMutation.mutateAsync({
  idLead: 123,
  data: { idAsesorAsignado: 45 },
});

// Tipificar
const typifyMutation = useTypifyLeadMutation();
await typifyMutation.mutateAsync({
  idLead: 123,
  data: {
    codigoTipificacion: 'T001',
    codigoSubtipificacion: 'S001',
  },
});
```

---

## 👮 Control de Permisos

Todos los componentes respetan los permisos del rol `ASESOR_GTR`:

```typescript
interface PermisosGTR {
  READ_CAMPANA: boolean;              // Ver campañas
  READ_ZONAS: boolean;                // Ver zonas
  READ_UBIGEO: boolean;               // Ver ubicaciones
  READ_PLANES: boolean;               // Ver planes
  READ_ADICIONALES: boolean;          // Ver adicionales
  READ_PROMOCIONES: boolean;          // Ver promociones
  READ_TIPIFICACIONES_PREVENTA: boolean;  // Ver tipificaciones
  CREATE_LEADS: boolean;              // ✅ Crear nuevo lead
  ASSIGN_LEADS: boolean;              // ✅ Asignar/reasignar
  READ_LEADS_ASESOR: boolean;         // ✅ Ver mis leads
  UPDATE_LEADS_ASESOR: boolean;       // ✅ Actualizar estado
  TYPIFY_LEADS: boolean;              // ✅ Tipificar
  CONTACT_LEADS: boolean;             // ✅ Contactar lead
  READ_LEADS_GTR: boolean;            // ✅ Ver tablero GTR
  READ_EVENTOS_LEADS: boolean;        // Ver historial
}
```

**Comportamiento:**
- Si permiso = false → componente muestra Alert de "No tienes permiso"
- Si permiso = true → muestra el componente funcional
- Botones se deshabilitan automáticamente si falta permiso

Ejemplo:
```tsx
// En AltaLead.tsx
if (!permisos.CREATE_LEADS) {
  return <Alert type="warning" message="No tienes permiso para crear leads" />;
}
```

---

## 📊 Validaciones Integradas

### FormInput (Números)
```tsx
// Filtra automáticamente caracteres no numéricos
<FormInput
  type="tel"
  value={value}
  onChange={(v) => setValue(v.replace(/\D/g, ''))}
/>
```

### Validación de Formularios
```tsx
// En AltaLead
const validateForm = (): boolean => {
  const errors: Record<string, string> = {};
  
  if (!prefijo) errors.prefijo = 'Requerido';
  if (!/^\d+$/.test(lead)) errors.lead = 'Solo números';
  if (!idCampana) errors.idCampana = 'Campaña requerida';
  
  return Object.keys(errors).length === 0;
};
```

---

## 🔄 Integración con React Query

Todos los componentes usan **React Query** para:
- **Caching automático**: 5 minutos stale time
- **Retry automático**: 2 intentos con backoff exponencial
- **Invalidación en mutaciones**: Refetch automático al crear/actualizar
- **Sincronización de estado**: Sin useState manual for data

Ejemplo de flow:
```
1. useLeadsGTR() → Query ejecuta → Data cacheada por 5 min
2. Usuario crea lead con useCreateLeadMutation()
3. Mutación se completa → queryClient.invalidateQueries()
4. Tabla se refetch automáticamente
5. Usuario ve dato nuevo sin refresh manual
```

---

## 📱 Responsive Design

- ✅ Tabla GTR oculta columnas en móvil < 640px
- ✅ Filtros en grid responsive
- ✅ Botones adaptados a pantalla
- ✅ Estilos mobile-first

---

## 🚀 Cómo Integrar en Página Principal

```tsx
// src/caracteristicas/gtr/pages/PaginaGTR.tsx
import { AltaLead, TablaLeadsGTR, AsignacionLead } from '../ui';
import { useCurrentUser } from '@shared/hooks';
import { useState } from 'react';

export function PaginaGTR() {
  const user = useCurrentUser();
  const [showAltaLead, setShowAltaLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  return (
    <div>
      <h1>GTR - Gestión de Leads</h1>
      
      <button onClick={() => setShowAltaLead(true)}>
        + Nuevo Lead
      </button>

      {showAltaLead && (
        <AltaLead
          permisos={user.permisos}
          onSuccess={() => {
            setShowAltaLead(false);
            // Tabla se refetch automáticamente
          }}
        />
      )}

      <TablaLeadsGTR
        permisos={user.permisos}
        onReasignarClick={(lead) => setSelectedLead(lead)}
      />

      {selectedLead && (
        <AsignacionLead
          idLead={selectedLead.id}
          permisos={user.permisos}
          onSuccess={() => setSelectedLead(null)}
          onCancel={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
}
```

---

## 📦 Exportación Pública

Todos los componentes están disponibles desde `@caracteristicas/gtr`:

```tsx
import {
  // Componentes UI
  AltaLead,
  AsignacionLead,
  TablaLeadsGTR,
  TablaLeadsAsesorVentas,
  
  // Hooks
  useLeadsGTR,
  useLeadsAsesorVentas,
  useCreateLeadMutation,
  useAssignLeadMutation,
  
  // Repositorio
  GtrRepository,
  
  // Tipos
  type LeadIntakeRequest,
  type PermisosGTR,
} from '@caracteristicas/gtr';
```

---

## ✅ FSD Compliance

**Validación de arquitectura:**
- ✅ `app` → imports de `pages`, `widgets`, `features`, `entities`, `shared`
- ✅ `pages` → imports de `widgets`, `features`, `entities`, `shared`
- ✅ `widgets` → imports de `features`, `entities`, `shared`
- ✅ `features/gtr` → imports de `entities`, `shared`
- ✅ `entities/lead` → imports de `shared`
- ✅ No hay imports circulares
- ✅ `tsconfig` aliases: `@caracteristicas`, `@entidades`, `@shared`

---

## 🧪 Testing (Próximo)

Se recomienda agregar tests para:
- Validaciones de formulario
- Permisos denegados
- Llamadas a API con error
- Paginación y filtrado

---

## 📊 Build Output

```
✓ Built in 2.32s
- 0 TypeScript errors
- 0 Import errors
- 308.04 kB (gzip: 100.18 kB)
- No size regression
```

---

## 🎓 Buenas Prácticas Aplicadas

1. **Composición**: Componentes pequeños y reutilizables
2. **Type Safety**: Tipos completos con TypeScript
3. **Error Handling**: Mensajes claros para users
4. **Validación**: Front-end + backend validation
5. **Performance**: React Query para caché + refetch selectivo
6. **Accesibilidad**: aria-labels, aria-describedby, error IDs
7. **Responsive**: Mobile-first con media queries
8. **FSD Compliance**: Arquitectura estricta por capas
9. **Modularidad**: Imports limpios vía index.ts

