# Design System Shared UI

Sistema visual base para Tailwind + FSD basado en la visual de ASESOR_GTR.

## Estructura de carpetas

src/shared/ui/design-system/
- tokens.ts
- README.md
- components/
  - cn.ts
  - DsPageShell.tsx
  - DsTabs.tsx
  - DsSectionCard.tsx
  - DsStatGrid.tsx
  - DsDataTable.tsx
  - DsStatusBadge.tsx
  - DsInlineMessage.tsx
  - DsEyebrow.tsx
  - index.ts
- index.ts

## Principios

- Solo estilos y composicion visual.
- Cero logica de negocio dentro de los componentes DS.
- API simple para acelerar migraciones por rol.

## Ejemplo rapido

```tsx
import {
  DsPageShell,
  DsTabs,
  DsSectionCard,
  DsStatGrid,
  DsDataTable,
  type DsDataTableColumn,
} from '@shared/ui/design-system';
```

## Vista real aplicada

La pagina Backoffice ya esta adaptada como ejemplo real en:

- src/pages/backoffice-advisor/PaginaAsesorBackoffice.tsx

Esta implementacion usa:
- DsPageShell
- DsSectionCard
- DsStatGrid
- DsDataTable

## Componentes semanticos

- DsStatusBadge: estados visuales (info, success, warning, danger, neutral).
- DsInlineMessage: mensajes inline para error/exito/info/advertencia.
- DsEyebrow: label superior estandar para encabezados de seccion.
