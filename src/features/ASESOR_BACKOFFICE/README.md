# ASESOR_BACKOFFICE - PREVENTAS COMPLETAS

## 📋 Descripción

Interfaz minimalista y escalable para que los asesores backoffice tipifiquen leads de **PREVENTA COMPLETA** después de realizar llamadas. 

### Características principales:
- ✅ **Split View**: Lista de leads + Panel de detalles y tipificación
- ✅ **Tipificación jerárquica**: 4 bloques de resultados con múltiples opciones cada uno
- ✅ **Búsqueda inteligente**: Por nombre, teléfono
- ✅ **Filtros por bloque**: Visualizar solo leads con tipificaciones específicas
- ✅ **Flujo optimizado**: Guardar + siguiente automáticamente
- ✅ **Estados visuales**: Pendientes / Tipificadas con badges e iconos

---

## 🏗️ Arquitectura (Atomic Design)

```
src/
├── components/
│   ├── atoms/
│   │   ├── LeadListItem/           # Item compacto de lead en lista
│   │   └── TipificationOption/     # Radio button customizado para opciones
│   │
│   ├── molecules/
│   │   ├── LeadDetailCard/         # Tarjeta con detalles del lead
│   │   └── TipificationBlockPanel/ # Panel expandible de bloque de tipificación
│   │
│   └── organisms/
│       ├── LeadsListPanel/         # Panel izquierdo con lista de leads
│       └── TipificationPanel/      # Panel derecho con detalle + opciones
│
├── features/
│   └── ASESOR_BACKOFFICE/
│       ├── pages/
│       │   └── BackofficeAdvisorDashboard.tsx  # Página principal
│       └── components/
│
├── hooks/
│   ├── useBackofficeLeads.ts       # Gestión de leads y filtros
│   └── useTipification.ts          # Gestión de selección de tipificación
│
├── shared/
│   └── types/
│       └── tipification.types.ts   # Tipos de tipificación
│
└── utils/
    └── tipificationConstants.ts    # Bloques y constantes de tipificación
```

---

## 🎯 Bloques de Tipificación

### 1. ✅ CONVERSIÓN EXITOSA
- Venta Cerrada
- Venta Mes Siguiente

### 2. ⏸️  REQUIERE SEGUIMIENTO
- Agendado para... (con fecha)
- Consultar con Familia
- Llamada Interrumpida
- Gestión x Chat

### 3. ❌ RECHAZO
- Zona F
- VC Desaprobada
- No Desea
- No Califica

### 4. 📲 SIN CONTACTO
- No Contesta
- Nº Equivocado
- Buzón
- Fuera de Servicio

---

## 🪝 Hooks Principales

### `useBackofficeLeads(initialLeads)`
Gestiona estado de leads:
```typescript
const manager = useBackofficeLeads(mockLeads);

// Métodos disponibles:
manager.selectLead(leadId);
manager.setSearchTerm(term);
manager.setFilter({ blockId: 'conversion' });
manager.clearFilter();
manager.tipifyLead(leadId, blockId, optionId);
manager.getNextLead();

// Estados:
manager.selectedLead;        // Lead actual seleccionado
manager.pendingLeads;        // Leads sin tipificar
manager.completedLeads;      // Leads tipificados
manager.filteredLeads;       // Leads filtrados
manager.stats;               // { pending, inProgress, completed }
```

### `useTipification()`
Gestiona selección de tipificación:
```typescript
const tipification = useTipification();

// Métodos disponibles:
tipification.selectBlock(blockId);
tipification.selectOption(optionId);
tipification.setScheduledDate(date);
tipification.setNotes(notes);
tipification.clear();
tipification.isValid();
await tipification.submit(onSubmit);

// Estados:
tipification.selectedBlockId;    // Bloque actual
tipification.selectedOptionId;   // Opción seleccionada
tipification.scheduledDate;      // Fecha si aplica
tipification.notes;              // Notas adicionales
tipification.isSubmitting;       // Flag de envío
tipification.error;              // Mensaje de error
```

---

## 🎨 Componentes Principales

### LeadListItem (Atom)
```tsx
<LeadListItem
  lead={lead}
  isSelected={true}
  tipificationStatus="pending"
  tipificationLabel="Venta Cerrada"
  onClick={() => selectLead(lead.id)}
/>
```

### TipificationOption (Atom)
```tsx
<TipificationOption
  id="venta_cerrada"
  label="Venta Cerrada"
  description="Cliente compró en el momento"
  isSelected={true}
  onClick={() => selectOption('venta_cerrada')}
/>
```

### TipificationBlockPanel (Molecule)
```tsx
<TipificationBlockPanel
  block={TIPIFICATION_BLOCKS[0]}
  selectedOptionId="venta_cerrada"
  onSelectOption={(optionId) => handleSelectOption(optionId)}
  onFilterByBlock={() => applyFilter('conversion')}
/>
```

### LeadDetailCard (Molecule)
```tsx
<LeadDetailCard lead={selectedLead} />
```

### LeadsListPanel (Organism)
```tsx
<LeadsListPanel
  leads={filteredLeads}
  selectedLeadId={selectedLeadId}
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  onLeadSelect={selectLead}
/>
```

### TipificationPanel (Organism)
```tsx
<TipificationPanel
  selectedLead={selectedLead}
  selectedBlockId={selectedBlockId}
  selectedOptionId={selectedOptionId}
  isSubmitting={isSubmitting}
  onSelectBlock={selectBlock}
  onSelectOption={selectOption}
  onSaveAndNext={handleSaveAndNext}
/>
```

---

## 📱 UI/UX

### Color Scheme
- **Conversión**: Verde (#10B981)
- **Seguimiento**: Ámbar (#F59E0B)
- **Rechazo**: Rojo (#EF4444)
- **Sin Contacto**: Gris (#6B7280)

### Iconografía
- ✅ Conversión exitosa
- ⏸️ Requiere seguimiento
- ❌ Rechazo
- 📲 Sin contacto

### Layout
- **Izquierda (320px)**: Lista de leads con filtros
- **Derecha (flex)**: Detalle + tipificación
- **Header**: Estadísticas en tiempo real

---

## 🚀 Uso en Router

```tsx
import BackofficeAdvisorDashboard from '@features/ASESOR_BACKOFFICE/pages';

// En tu router:
<Route path="/asesor-backoffice" element={<BackofficeAdvisorDashboard />} />
```

---

## 📝 Mock Data

El componente incluye mock data con leads de ejemplo. En producción, reemplazar:

```typescript
// Antes (mock):
const leads = MOCK_LEADS;

// Después (API real):
const { data: leads } = await leadsService.getPreventasCompletas();
```

---

## 🔄 Flujo de Usuario

1. **Selecciona lead** de la lista izquierda ➜ Se carga el detail panel
2. **Lee información** del lead (datos, dirección, plan, promo)
3. **Hace llamada** (fuera de la interfaz)
4. **Realiza tipificación** seleccionando un bloque y opción
5. **Guarda y siguiente** ➜ Se tipifica, se mueve a completadas, carga siguiente
6. **Repite** hasta tipificar todos los leads

---

## ✅ Checklist de Implementación

- [x] tipos TypeScript (tipification.types.ts)
- [x] Constantes de tipificación (tipificationConstants.ts)
- [x] Atoms (LeadListItem, TipificationOption)
- [x] Molecules (LeadDetailCard, TipificationBlockPanel)
- [x] Organisms (LeadsListPanel, TipificationPanel)
- [x] Hooks (useBackofficeLeads, useTipification)
- [x] Página principal (BackofficeAdvisorDashboard)
- [x] Estilos CSS (archivos .css)

---

## 🎓 Notas Técnicas

### Performance
- Uso de `useMemo` para filtrados y búsquedas
- Uso de `useCallback` para evitar re-renders innecesarios
- Virtualización de lista (si hay >500 leads, considerar react-window)

### Accesibilidad
- Radio buttons con labels
- Atributos `aria-expanded` en paneles expandibles
- Navegable con teclado (Enter/Space)

### Escalabilidad
- Estructura permite agregar más bloques sin cambiar componentes
- Hooks separados facilitan testing
- Tipos centralizados en shared/types

---

## 🛠️ Próximos Pasos

1. **Integración API**: Conectar con backend para obtener leads reales
2. **Grabación de llamadas**: Integrar con servicio de grabación
3. **Exportación de reportes**: Generar reportes diarios de tipificaciones
4. **Notificaciones**: Toast de éxito/error en tiempo real
5. **Sincronización**: Actualizar lista sin recargar página
