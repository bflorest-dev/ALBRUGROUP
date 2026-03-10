# 📊 Jerarquía de Componentes - Atomic Design

## Diagrama de Dependencias (Estado Actual)

```
                    ┌─────────────────────────────────┐
                    │   FEATURE PAGES                 │
                    │ (ApplicantsDashboard, etc)      │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
        ┌───────────▼──────────────┐    ┌────────────▼──────────┐
        │ FEATURE ORGANISMS        │    │ GLOBAL MOLECULES      │
        │ (Feature-specific)       │    │ StatCard, Modal,      │
        │ - Forms                  │    │ Card, Alert, etc.     │
        │ - Tables                 │    └────────────┬──────────┘
        │ - Layouts                │                 │
        └───────────┬──────────────┘                 │
                    │                                 │
                    └────────────────┬────────────────┘
                                     │
                        ┌────────────▼──────────┐
                        │ GLOBAL ATOMS          │
                        │ Button, Input, Badge, │
                        │ Label, Select, etc.   │
                        └───────────────────────┘
```

## Clasificación Actual de Componentes

### ✅ ÁTOMOS (src/components/atoms/)
Componentes básicos, sin lógica, reutilizables

| Componente | Descripción | Instancias |
|------------|-------------|-----------|
| Button | Botón estándar | Usado en todas las páginas |
| Input | Campo de texto | Formularios |
| Label | Etiqueta | Formularios |
| Badge | Distintivo pequeño | Tablas, listas |
| Select | Dropdown | Filtros, formularios |
| Spinner | Indicador de carga | Modal, tablas |
| IconButton | Botón con ícono | Headers, barras |
| RoleBadge | Badge de rol | Tablas de empleados |
| Divider | Separador | Páginas |

---

### ✅ MOLÉCULAS (src/components/molecules/)
Combinaciones de átomos, lógica simple, reutilizables

| Componente | Composición | Uso |
|------------|-------------|-----|
| StatCard | Átomo(span) + Estilo | RRHH, GTR, SALES |
| Card | Contenedor + styles | RECLUTAMIENTO, TRAINING |
| Modal | Button + Estructura | Todos (crear, editar, borrar) |
| Alert | Badge + Mensaje | Notificaciones |
| Pagination | Button + Input | Tablas (ApplicantsTable) |
| ApplicantForm | Input + Select + Button | RRHH (Alta de postulantes) |
| DatePicker | Input + Calendario | Filtros de fecha |
| Toast | Alert estilizado | Sistema de notificaciones |

---

### ⚠️ MOLÉCULAS NUEVAS (UBICADAS INCORRECTAMENTE ❌)

**MetricsPanel** (actual: features/COMMUNITY/components/, correcto: src/components/molecules/MetricsPanel)
```
Composición: span + div (Átomos)
Lógica: Map simple de métricas
Reutilizable: SÍ → RRHH, GTR, SALES, ADMINISTRADOR
Dependencias: CSS solo
```

**LeadsWidget** (actual: features/COMMUNITY/components/, correcto: src/components/molecules/LeadsWidget)
```
Composición: div + span (Átomos)
Lógica: Reduce para agrupar leads
Reutilizable: SÍ → RRHH, COMMUNITY, RECLUTAMIENTO
Dependencias: CSS solo
```

---

### ✅ ORGANISMOS (src/components/organisms/)
Combinaciones complejas de moléculas, con layouts

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| Header | Layout/ | Encabezado global con navegación |
| Layout | Layout/ | Layout principal de páginas |
| Sidebar | Layout/ | Barra lateral (en Header) |

---

### ✅ ORGANISMOS LOCALES (features/<role>/components/organisms/)
Específicos de cada feature, contienen lógica de negocio

| Feature | Componente | Propósito |
|---------|-----------|----------|
| RRHH | ApplicantsTable | Tabla con filtros y acciones de RRHH |
| RRHH | NewApplicantForm | Crear postulante |
| RRHH | EditApplicantForm | Editar postulante |
| RRHH | HireApplicantForm | Contratar postulante |
| Otros | < a definir > | Específicos de cada rol |

---

## Especificación de Reglas por Nivel

### ÁTOMOS
```
Reglas:
1. NO importan moléculas ni organismos
2. NO contienen lógica de negocio
3. NO conectan con servicios/APIs
4. Aceptan props simples (string, number, boolean)
5. Reutilizables al 100% en cualquier contexto
6. Estilo encapsulado en CSS

Ejemplo válido:
✅ Button.tsx
   - Props: label, onClick, disabled, variant
   - No tiene dependencias de negocio
   - Se usa en 50+ lugares

Ejemplo inválido:
❌ ApplicantButton.tsx
   - Específico de RRHH
   - Contiene lógica de hiring
   - Debería estar en features/RRHH
```

### MOLÉCULAS
```
Reglas:
1. Combina 2+ átomos
2. NO contiene lógica de negocio compleja
3. PUEDE procesar datos simples transform
4. NO conecta directamente con APIs
5. Props: Arrays simples, objetos simples
6. Reutilizable en múltiples contextos
7. Si es específica de una feature → va en features/<role>/molecules

Ejemplo válido:
✅ StatCard.tsx
   - Combina: span (Átomo) + estilos
   - Props: { label, value, percentage }
   - Usado en: RRHH, GTR, SALES, SUPERVISOR
   - Reutilizable: SÍ

Ejemplo inválido:
❌ ApplicantListItem.tsx (datos específicos de RRHH)
   - Props: { applicant: Applicant }
   - Lógica RRHH
   - Debería estar en features/RRHH/molecules
```

### ORGANISMOS
```
Reglas:
1. Combina 2+ moléculas
2. Puede contener lógica de presentación
3. Puede conectar con contextos/servicios
4. Props: Datos específicos y callbacks
5. Dos variantes:

A. GLOBALES (src/components/organisms/)
   - Layouts comunes (Header, Sidebar, etc)
   - Reutilizable en todas las features
   - No contiene lógica de dominio específica

B. LOCALES (features/<role>/organisms/)
   - Formas complejas con validaciones
   - Tablas con filtros específicos
   - Lógica de feature encapsulada

Ejemplo válido (Global):
✅ Header (src/organisms/Layout/)
   - Usado en todos los dashboards
   - No contiene lógica RRHH específica

Ejemplo válido (Local):
✅ ApplicantsTable (features/RRHH/organisms/)
   - Lógica paginación de RRHH
   - Conecta con ApplicantsContext
   - No reutilizable en otras features

Ejemplo inválido:
❌ ApplicantListItem en src/molecules/
   - Si contiene lógica RRHH
   - Debería estar en features/RRHH/
```

---

## Árbol de Dependencias Recomendado

```
src/components/
├── atoms/
│   ├── Button/
│   ├── Input/
│   ├── Label/
│   ├── Badge/
│   ├── Select/
│   └── ... (más átomos)
│
├── molecules/
│   ├── StatCard/                  (reutilizable globalmente)
│   ├── Card/                      (reutilizable globalmente)
│   ├── Modal/                     (reutilizable globalmente)
│   ├── Alert/                     (reutilizable globalmente)
│   ├── Pagination/                (reutilizable globalmente)
│   ├── ApplicantForm/             (reutilizable globalmente)
│   ├── DatePicker/                (reutilizable globalmente)
│   ├── MetricsPanel/              (DEBE MOVERSE AQUÍ)
│   ├── LeadsWidget/               (DEBE MOVERSE AQUÍ)
│   └── ... (más moléculas)
│
└── organisms/
    ├── Layout/
    │   ├── Header/
    │   ├── Sidebar/
    │   └── index.ts
    └── index.ts

features/
├── RRHH/
│   ├── types.ts
│   ├── services.ts
│   ├── pages/
│   │   └── ApplicantsDashboard.tsx
│   └── components/
│       ├── organisms/
│       │   ├── Tables/
│       │   │   └── ApplicantsTable.tsx
│       │   ├── Forms/
│       │   │   ├── NewApplicantForm.tsx
│       │   │   ├── EditApplicantForm.tsx
│       │   │   └── HireApplicantForm.tsx
│       │   └── index.ts
│       └── index.ts
│
├── COMMUNITY/
│   ├── types.ts
│   ├── services.ts
│   ├── pages/
│   │   └── CommunityDashboard.tsx   (importa MetricsPanel y LeadsWidget de @molecules)
│   └── components/
│       └── (específicos de COMMUNITY si hay)
│
└── ... (más features)
```

---

## Impacto de Cambios

### Cambio Propuesto
```
MOVER:
- MetricsPanel: features/COMMUNITY/components/ → src/components/molecules/MetricsPanel/
- LeadsWidget: features/COMMUNITY/components/ → src/components/molecules/LeadsWidget/
```

### Archivos Afectados
```
Crear:
✅ src/components/molecules/MetricsPanel/MetricsPanel.tsx
✅ src/components/molecules/MetricsPanel/MetricsPanel.css
✅ src/components/molecules/MetricsPanel/index.ts

✅ src/components/molecules/LeadsWidget/LeadsWidget.tsx
✅ src/components/molecules/LeadsWidget/LeadsWidget.css
✅ src/components/molecules/LeadsWidget/index.ts

Modificar:
✅ src/components/molecules/index.ts (agregar exports)
✅ src/features/COMMUNITY/pages/CommunityDashboard.tsx (actualizar imports)

Eliminar:
✅ src/features/COMMUNITY/components/MetricsPanel.tsx
✅ src/features/COMMUNITY/components/MetricsPanel.css
✅ src/features/COMMUNITY/components/LeadsWidget.tsx
✅ src/features/COMMUNITY/components/LeadsWidget.css
✅ src/features/COMMUNITY/components/index.ts (si queda vacío)
```

### Beneficios
```
✅ Consistencia de arquitectura
✅ Posible reutilización en RRHH, ADMINISTRADOR, etc.
✅ Imports simples con alias: `import { MetricsPanel } from '@molecules/MetricsPanel'`
✅ Estructura predecible y escalable
✅ Facilita testing e inversión de dependencias
```

---

## Regla de Oro

```
┌──────────────────────────────────────────────────────────┐
│  ¿Es reutilizable en 2+ features?                        │
│                                                           │
│  SÍ → src/components/molecules/ (GLOBAL)                │
│  NO → features/<role>/components/ (LOCAL)               │
└──────────────────────────────────────────────────────────┘
```

**MetricsPanel Analysis:**
- ¿Reutilizable en RRHH? → SÍ (mostrar métricas de postulantes)
- ¿Reutilizable en ADMINISTRADOR? → SÍ (métricas del sistema)
- ¿Reutilizable en GTR? → SÍ (métricas de gestión)
- **Decisión: GLOBAL** → src/components/molecules/

**LeadsWidget Analysis:**
- ¿Reutilizable en RRHH? → SÍ (estado de leads)
- ¿Reutilizable en RECLUTAMIENTO? → SÍ (leads por pipeline)
- ¿Reutilizable en COMMUNITY? → SÍ (ya lo usa)
- **Decisión: GLOBAL** → src/components/molecules/
