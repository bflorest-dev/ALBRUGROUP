# Estructura Completa del Directorio src/

## 📋 ÍNDICE DE CONTENIDO
1. [Archivos Raíz Principales](#archivos-raíz-principales)
2. [Estructura por Tipos](#estructura-por-tipos)
3. [Arquitectura de Componentes UI (Diseño Atómico)](#arquitectura-de-componentes-ui-diseño-atómico)
4. [Servicios y APIs](#servicios-y-apis)
5. [Entidades](#entidades)
6. [Características (Caracteristicas)](#características)
7. [Migraciones (Features)](#migraciones-features)
8. [Widgets](#widgets)
9. [Convenciones de Imports](#convenciones-de-imports)

---

## ARCHIVOS RAÍZ PRINCIPALES

```
src/
├── App.tsx                    ✅ Componente raíz principal
├── main.tsx                   ✅ Punto de entrada - Renderiza <App />
├── RouterByRole.tsx           ⚠️  LEGADO - Redirige a app/RouterByRole.tsx
├── App.css                    - Estilos de App
├── index.css                  - Estilos globales
├── setupTests.ts              - Configuración de pruebas
├── architecture.md            - Documentación de arquitectura
```

### Ubicaciones Clave
- **App.tsx**: [src/App.tsx](src/App.tsx) - Envuelve MainLayout, ApplicantsProvider, ErrorBoundary, AuthService
- **main.tsx**: [src/main.tsx](src/main.tsx) - Importa clearAllStorage desde @compartido/lib
- **RouterByRole.tsx (activo)**: [src/app/RouterByRole.tsx](src/app/RouterByRole.tsx) - Placeholder para migración FSD
- **RouterByRole.tsx (legado)**: [src/RouterByRole.tsx](src/RouterByRole.tsx) - Re-exporta desde app/

---

## ESTRUCTURA POR TIPOS

```
src/
├── api/                       📡 Configuración HTTP global
│   ├── http.ts                - Cliente HTTP base (Axios)
│   └── index.ts               - Exports
│
├── config/                    ⚙️ Configuración de entorno
│   ├── env.ts                 - Variables de entorno
│   └── index.ts               - Exports
│
├── contexts/                  🎭 Context API global
│   ├── ApplicantsContext.tsx
│   ├── DataContext.tsx
│   ├── DevRoleContext.tsx
│   ├── NotificationContext.tsx
│   ├── SidebarContext.tsx
│   ├── useNotification.ts
│   └── hooks/
│
├── hooks/                     🪝 Custom Hooks reutilizables
│   ├── index.ts
│   ├── useApplicantsSync.ts
│   ├── useApplicantsTable.ts
│   ├── useBackofficeLeads.ts
│   ├── useCommonPatterns.ts
│   ├── useEmployeesSync.ts
│   ├── useErrorHandler.ts
│   ├── useFormValidation.ts
│   ├── usePagination.ts
│   └── useTipification.ts
│
├── services/                  🔧 Servicios de negocio
│   ├── applicant.service.ts
│   ├── auth.service.ts
│   ├── base.service.ts
│   ├── contract.service.ts
│   ├── employee.service.ts
│   ├── errorLogger.ts
│   └── index.ts
│
├── repositories/              💾 Capa de repositories
│   ├── applicant.repository.ts
│   ├── contract.repository.ts
│   ├── employee.repository.ts
│   └── index.ts
│
├── types/                     📝 Tipos globales
│   ├── events.ts
│   └── index.ts
│
├── validation/                ✔️ Esquemas de validación
│   ├── applicant.schemas.ts
│   ├── schemas.ts
│   └── form-example.tsx
│
├── utils/                     🛠️ Utilidades
│   ├── constants.ts
│   ├── localStorage.ts
│   ├── mockData.ts
│   ├── phoneValidation.ts
│   ├── rateLimiting.ts
│   ├── sanitization.ts
│   ├── secureErrorHandling.ts
│   └── tipificationConstants.ts
│
├── styles/                    🎨 Estilos globales
│   ├── atoms.css              - Clases CSS atómicas
│   └── tokens.css             - Tokens de diseño
│
├── dev/                       👨‍💻 Utilidades de desarrollo
│   ├── DevRoleSwitcher.tsx    - Selector de roles en dev
│   └── DevRoleSwitcher.css
│
├── assets/                    📦 Recursos estáticos
│
└── shared/                    📚 Helpers compartidos
    └── CONSISTENCY_GUIDE.ts
```

---

## ARQUITECTURA DE COMPONENTES UI (DISEÑO ATÓMICO)

### 📍 RUTA: `src/compartido/ui/`

```
compartido/ui/
├── index.ts                   - Exports de todos los componentes
├── base/                      - Componentes base/wrapper
├── base/
│   ├── .gitkeep
│   └── (componentes base si existen)
│
├── atomos/                    🔵 ÁTOMOS (Componentes más pequeños)
│   ├── index.ts               - Exports
│   ├── Badge.ts
│   ├── Button.ts
│   ├── botones/
│   │   ├── .gitkeep
│   │   └── index.ts
│   ├── campos/                📝 Campos de entrada
│   │   ├── .gitkeep
│   │   └── index.ts
│   ├── espaciado/             ↔️ Clases de espaciado
│   │   └── (utilidades CSS)
│   ├── etiquetas/             🏷️ Labels/Tags
│   ├── iconos/                🎨 Iconografía
│   │   ├── .gitkeep
│   │   └── index.ts
│   ├── indicadores/           📊 Estados/Spinners
│   └── tipografia/            🔤 Estilos de texto
│
├── moleculas/                 🟢 MOLÉCULAS (Componentes compuestos)
│   ├── index.ts               - Exports
│   ├── DataTable.ts           - Tabla de datos reusable
│   ├── formularios/           📋 Formularios compuestos
│   │   ├── .gitkeep
│   │   └── index.ts
│   ├── navegacion/            🧭 Componentes de navegación
│   ├── tablas/                📊 Tablas y variantes
│   │   └── index.ts           - Tabla, TablaEmpleados, TablaPomtuantes
│   └── tarjetas/              🎴 Cards y variantes
│
├── organismos/                🔴 ORGANISMOS (Componentes complejos)
│   ├── index.ts               - Exports
│   ├── contenedores/          📦 Layouts y contenedores
│   ├── Layout/                🎭 Layouts principales
│   ├── modales/               🪟 Diálogos y modales
│   └── navegadores/           🗺️ Navegadores y sidebars
│
├── limitadorErrores/          ⚠️ ERROR BOUNDARIES
│   ├── ErrorBoundary.tsx      - Component ErrorBoundary
│   └── (otros wrappers de error)
│
└── selectorFecha/             📅 Selector de fecha
    └── (componentes de fecha)
```

---

## SERVICIOS Y APIS

### 📍 RUTA: `src/services/`
```
services/
├── applicant.service.ts       - Gestión de postulantes
├── auth.service.ts            - Autenticación y sesión
├── base.service.ts            - Clase base para todos los servicios
├── contract.service.ts        - Gestión de contratos
├── employee.service.ts        - Gestión de empleados
├── errorLogger.ts             - Logging de errores
└── index.ts                   - Exports
```

### 📍 RUTA: `src/repositories/`
```
repositories/
├── applicant.repository.ts    - Queries/mutations de postulantes
├── contract.repository.ts     - Queries/mutations de contratos
├── employee.repository.ts     - Queries/mutations de empleados
└── index.ts                   - Exports
```

### 📍 RUTA: `src/compartido/api/`
```
compartido/api/
├── clienteHttp.ts             - Configuración HTTP avanzada
├── servicioBase.ts            - Clase base extendida
└── index.ts                   - Exports
```

### 📍 RUTA: `src/api/`
```
api/
├── http.ts                    - Cliente HTTP principal (Axios)
└── index.ts                   - Exports
```

---

## ENTIDADES

### 📍 RUTA: `src/entidades/`

Patrón: Cada entidad tiene `modelo/`, `ui/`, y potencialmente `api/`

```
entidades/
├── empleado/                  💼 EMPLEADOS
│   ├── .gitkeep
│   ├── index.ts               - Exports
│   ├── modelo/                📝 Tipos y lógica
│   │   ├── .gitkeep
│   │   └── index.ts
│   └── ui/                     🎨 Componentes
│       ├── .gitkeep
│       └── index.ts
│
├── postulante/                👨‍💼 POSTULANTES
│   ├── .gitkeep
│   ├── index.ts
│   ├── modelo/
│   │   ├── .gitkeep
│   │   └── index.ts
│   └── ui/
│       ├── .gitkeep
│       └── index.ts
│
├── candidato/                 🎯 CANDIDATOS
│   ├── .gitkeep
│   ├── index.ts
│   ├── modelo/
│   │   ├── .gitkeep
│   │   └── index.ts
│   └── ui/
│       ├── .gitkeep
│       └── index.ts
│
├── lead/                      📞 LEADS
│   ├── .gitkeep
│   ├── index.ts
│   ├── modelo/
│   └── ui/
│
├── asesor/                    👨‍🏫 ASESORES
│   ├── .gitkeep
│   ├── index.ts
│   ├── modelo/
│   └── ui/
│
├── usuario/                   👤 USUARIOS
│   ├── .gitkeep
│   ├── index.ts
│   ├── modelo/
│   └── ui/
│
├── tipificacion/              🏷️ TIPIFICACIONES
│   ├── .gitkeep
│   ├── index.ts
│   ├── modelo/
│   └── ui/
│
├── index.ts                   - Exports centralizados
└── README.md                  - Documentación
```

---

## CARACTERÍSTICAS

### 📍 RUTA: `src/caracteristicas/`

Patrón: Agrupa funcionalidades por rol/área con `api/`, `hooks/`, `modelo/`, `ui/`

```
caracteristicas/
├── admin/                     🛡️ ADMINISTRADOR
│   ├── .gitkeep
│   ├── api/
│   │   └── admin.service.ts   - Servicios adminutración
│   ├── hooks/
│   │   ├── .gitkeep
│   │   └── useAdminDashboard.ts
│   ├── index.ts
│   ├── modelo/                - Tipos específicos admin
│   ├── ui/
│   │   ├── .gitkeep
│   │   ├── AdicionalesSection.tsx
│   │   ├── PlansSection.tsx
│   │   ├── PromotionsSection.tsx
│   │   └── index.ts
│   └── (structure unclear - need exploration)
│
├── autenticacion/             🔐 AUTENTICACIÓN
│   ├── .gitkeep
│   ├── api/
│   │   └── (servicios de auth)
│   ├── hooks/
│   ├── index.ts
│   ├── modelo/
│   └── ui/
│
├── community/                 👥 COMMUNITY
│   ├── .gitkeep
│   ├── hooks/
│   │   ├── .gitkeep
│   │   └── index.ts
│   ├── index.ts
│   ├── modelo/
│   └── ui/
│       ├── .gitkeep
│       ├── AdvertiserAccountCard.tsx
│       ├── CampaignCard.tsx
│       ├── CampaignsSection.tsx
│       ├── CompanyCard.tsx
│       ├── DashboardSection.tsx
│       ├── LeadsManagementSection.tsx
│       ├── ModalsSection.tsx
│       └── index.ts
│
├── baja-empleado/             ❌ BAJA DE EMPLEADOS
│   ├── .gitkeep
│   ├── api/
│   ├── hooks/
│   ├── index.ts
│   ├── modelo/
│   └── ui/
│
├── desarrollador/             👨‍💻 DESARROLLADOR
│   ├── .gitkeep
│   ├── (estructura en construcción)
│
├── editar-postulante/         ✏️ EDITAR POSTULANTE
│   ├── .gitkeep
│   ├── (estructura en construcción)
│
├── gestion-leads/             📊 GESTIÓN LEADS
│   ├── .gitkeep
│   ├── (estructura en construcción)
│
├── registrar-empleado/        ➕ REGISTRAR EMPLEADO
│   ├── .gitkeep
│   ├── (estructura en construcción)
│
├── registrar-postulante/      ➕ REGISTRAR POSTULANTE
│   ├── .gitkeep
│   ├── (estructura en construcción)
│
├── index.ts                   - Exports centralizados
└── README.md                  - Documentación
```

---

## MIGRACIONES (FEATURES)

### 📍 RUTA: `src/features/`

Fase de migración moderna FSD - estructura experimental

```
features/
├── COMMUNITY/                 👥 Community (en construcción)
│   ├── sections/              - VACÍO
│   ├── utils/                 - VACÍO
│   └── (aún sin contenido principal)
│
└── SUPERVISOR_GTR/            👔 Supervisor GTR (en construcción)
    ├── hooks/                 - VACÍO
    └── (aún sin contenido principal)
```

**ESTADO**: Estructura preparada pero no implementada aún. Parece ser la nueva estructura FSD siendo migrada.

---

## COMPARTIDO (SHARED)

### 📍 RUTA: `src/compartido/`

Recursos compartidos reutilizables en toda la app

```
compartido/
├── api/                       🔌 API compartida
│   ├── .gitkeep
│   ├── clienteHttp.ts         - Cliente HTTP extendido
│   ├── servicioBase.ts        - Clase base para servicios
│   └── index.ts
│
├── configuracion/             ⚙️ CONFIGURACIÓN
│   ├── .gitkeep
│   ├── constantes.ts          - Constantes globales
│   └── index.ts
│
├── ganchos/                   🪝 CUSTOM HOOKS COMPARTIDOS
│   ├── .gitkeep
│   ├── index.ts
│   ├── useManejadorError.ts   - Manejo de errores
│   ├── usePaginacion.ts       - Paginación
│   ├── usePatronesComunes.ts  - Patrones comunes
│   └── useValidacionFormulario.ts - Validaciones
│
├── lib/                       📚 LIBRERÍAS Y UTILIDADES
│   ├── .gitkeep
│   ├── almacenamientoLocal.ts - LocalStorage helpers
│   ├── contextos.ts           - Context helpers
│   ├── index.ts               - Exports (clearAllStorage, etc)
│   ├── lazyLoad.tsx           - Lazy loading util
│   ├── sanitizacion.ts        - Sanitización HTML
│   ├── servicios.ts           - Service helpers
│   ├── utilidades.ts          - General utilities
│   └── validacionTelefono.ts  - Phone validation
│
├── servicios/                 🔧 SERVICIOS COMPARTIDOS
│   ├── .gitkeep
│   └── (actualmente vacío)
│
├── tipos/                     📝 TIPOS COMPARTIDOS
│   ├── .gitkeep
│   ├── community.ts           - Tipos de Community
│   ├── comun.ts               - Tipos comunes
│   ├── enums.ts               - Enumeraciones globales
│   ├── eventos.ts             - Tipos de eventos
│   ├── index.ts               - Exports
│   └── indice.ts              - Índice de tipos
│
├── ui/                        🎨 COMPONENTES UI (Ver diseño atómico arriba)
│   ├── atomos/                - Componentes pequeños
│   ├── moleculas/             - Componentes compuestos
│   ├── organismos/            - Componentes complejos
│   ├── limitadorErrores/      - Error boundaries
│   └── base/                  - Componentes base
│
├── validacion/                ✔️ ESQUEMAS DE VALIDACIÓN
│   ├── .gitkeep
│   ├── esquemas.ts            - Schemas Zod/Yup
│   └── index.ts
│
└── README.md                  - Documentación compartida
```

---

## WIDGETS (COMPONENTES DE PÁGINA)

### 📍 RUTA: `src/widgets/`

Componentes complejos y layouts específicos de funcionalidad

```
widgets/
├── barra-lateral/            🧭 SIDEBAR
│   ├── .gitkeep
│   ├── index.ts
│   └── ui/                    - Componentes del sidebar
│
├── community/                 👥 COMMUNITY WIDGETS
│   ├── .gitkeep
│   ├── index.ts
│   └── ui/
│
├── encabezado/                🎯 HEADER/TOP BAR
│   ├── .gitkeep
│   ├── index.ts
│   └── ui/                    - Componentes del header
│
├── layout-principal/          🎭 MAIN LAYOUT
│   ├── .gitkeep
│   ├── index.ts
│   └── ui/
│       ├── MainLayout.tsx     - Layout principal
│       ├── SidebarLayout.tsx  - Versión con sidebar
│       └── index.ts
│
├── panel-leads/               📊 LEADS PANEL
│   ├── .gitkeep
│   ├── index.ts
│   └── ui/
│
├── panel-tipificacion/        📋 TIPIFICACIÓN PANEL
│   ├── .gitkeep
│   ├── index.ts
│   └── ui/
│
├── supervisor-gtr/            👔 SUPERVISOR GTR
│   ├── .gitkeep
│   ├── index.ts
│   └── ui/
│
├── tabla-empleados/           📊 TABLA EMPLEADOS
│   ├── .gitkeep
│   ├── index.ts
│   └── ui/
│
├── tabla-postulantes/         📊 TABLA POSTULANTES
│   ├── .gitkeep
│   ├── index.ts
│   └── ui/
│
├── index.ts                   - Exports centralizados
└── README.md                  - Documentación
```

---

## PÁGINAS

### 📍 RUTA: `src/paginas/`

Plantillas de página por rol

```
paginas/
├── admin/                     🛡️ ADMIN
├── asesor-backoffice/         🖥️ ASESOR BACKOFFICE
├── asesor-ventas/             💼 ASESOR VENTAS
├── capacitacion/              🎓 CAPACITACIÓN
├── community/                 👥 COMMUNITY
├── desarrollador/             👨‍💻 DESARROLLADOR
├── login/                     🔐 LOGIN
├── reclutamiento/             📋 RECLUTAMIENTO
├── rrhh/                      👥 RRHH
├── supervisor-gtr/            👔 SUPERVISOR GTR
├── index.ts                   - Exports
└── README.md                  - Documentación
```

---

## CONVENCIONES DE IMPORTS

### ✅ ALIAS DE IMPORTACIÓN (tsconfig.json o vite.config.ts)

```typescript
// Convenciones de alias activas en el proyecto:

@ compartido/       → src/compartido/
@caracteristicas/   → src/caracteristicas/
@entidades/         → src/entidades/
@paginas/           → src/paginas/
@widgets/           → src/widgets/
@hooks/             → src/hooks/
@services/          → src/services/
@types/             → src/types/
@utils/             → src/utils/
@config/            → src/config/
@api/               → src/api/
@validation/        → src/validation/
@repositories/      → src/repositories/
@styles/            → src/styles/
```

### 📋 EJEMPLOS DE IMPORTACIÓN

```typescript
// ✅ COMPARTIDO (ui, tipos, lib, hooks)
import { Button } from '@compartido/ui/atomos/botones'
import { ErrorBoundary } from '@compartido/ui/limitadorErrores/ErrorBoundary'
import { useManejadorError } from '@compartido/ganchos'
import { clearAllStorage } from '@compartido/lib'
import type { Role } from '@compartido/tipos'
import { DevRoleProvider } from '@compartido/lib'

// ✅ CARACTERÍSTICAS
import { AuthService } from '@caracteristicas/autenticacion/api'
import { useAdminDashboard } from '@caracteristicas/admin/hooks'

// ✅ SERVICIOS
import { AuthService } from '@services/auth.service'
import { ApplicantService } from '@services/applicant.service'

// ✅ CONTEXTOS GLOBALES
import { ApplicantsProvider } from '@compartido/lib'
import { useDevRole } from '@compartido/lib'

// ✅ WIDGETS
import { MainLayout } from '@widgets/layout-principal/ui/MainLayout'

// ✅ HOOKS GLOBALES
import { useApplicantsSync } from '@hooks/useApplicantsSync'
import { useFormValidation } from '@hooks/useFormValidation'

// ✅ TIPOS
import { ApplicantType } from '@types'
import type { ErrorInfo } from 'react'

// ✅ UTILS
import { constants } from '@utils/constants'
```

### 📋 PATRONES DE ESTRUCTURA

**Patrón COMPARTIDO:**
```
@compartido/[tipo]/[subdir]/[componente]
- ui/atomos/, moleculas/, organismos/
- tipos/
- ganchos/
- lib/
- api/
- validacion/
```

**Patrón ENTIDAD:**
```
@entidades/[nombre]/[modelo|ui|api]
- empleado/modelo/
- postulante/ui/
```

**Patrón CARACTERÍSTICA:**
```
@caracteristicas/[nombre]/[api|hooks|ui|modelo]
- autenticacion/api/
- admin/ui/
```

---

## 📊 RESUMEN DE ORGANIZACIÓN

| Categoría | Ubicación | Propósito |
|-----------|-----------|----------|
| **Entrada** | `App.tsx`, `main.tsx` | Punto de inicio |
| **Rutas** | `app/RouterByRole.tsx` | Enrutamiento por rol |
| **Contextos** | `contexts/` | Estado global React |
| **Servicios** | `services/` | Lógica de negocio |
| **Repos** | `repositories/` | Acceso a datos |
| **API HTTP** | `api/`, `compartido/api/` | Cliente HTTP |
| **UI Atómica** | `compartido/ui/` | Componentes reutilizables |
| **Características** | `caracteristicas/` | Funcionalidad por rol |
| **Entidades** | `entidades/` | Modelos de dominio |
| **Widgets** | `widgets/` | Componentes complejos |
| **Páginas** | `paginas/` | Templates de página |
| **Tipos** | `compartido/tipos/`, `types/` | TypeScript types |
| **Hooks** | `hooks/`, `compartido/ganchos/` | Custom hooks |
| **Validación** | `compartido/validacion/` | Esquemas Zod/Yup |
| **Utils** | `utils/`, `compartido/lib/` | Helpers |

---

## 🔍 ARCHIVOS CONFIGURACIÓN PRINCIPALES

- **tsconfig.json** - TypeScript config con aliases
- **vite.config.ts** - Configuración de build
- **vitest.config.ts** - Configuración de tests
- **eslint.config.js** - Linting rules

---

## ⚠️ NOTAS IMPORTANTES

1. **Duplicación Estructural**: Existe paralelismo entre `caracteristicas/` y `features/` (migración FSD en progreso)
2. **RouterByRole.tsx**: Existe en dos ubicaciones - `src/RouterByRole.tsx` (legado) y `src/app/RouterByRole.tsx` (activa)
3. **Migración FSD**: Directorio `features/` preparado pero sin implementación - migración en progreso
4. **Español/English**: Nombres mixtos - `compartido/` (español) y `shared/` (english paradoxo), `ganchos/` (hooks en español), `tipos/` (types en español)
5. **Servicios Actualizados**: `services/`, `repositories/`, y `compartido/api/` - considerar consolidación
6. **DevRoleContext**: Disponible en `contexts/DevRoleContext.tsx` y reimportable desde `@compartido/lib`

---

**Generado**: 24 de marzo 2026
**Estado**: Estructura mixta en transición - híbrido entre arquitectura antigua y FSD moderna
