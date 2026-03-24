# 🏗️ ARQUITECTURA FSD + ATOMIC DESIGN EN ESPAÑOL

**Decisión:** Opción B - Feature-Sliced Design Puro  
**Lenguaje:** 100% Español  
**Efectivo desde:** 23 Marzo 2026  
**Estado:** LISTA PARA FASE 0

---

## 📊 ESTRUCTURA FINAL

```
src/
│
├── app/                                    # 🎯 Shell + Routing
│   ├── App.tsx
│   ├── main.tsx
│   ├── RouterByRole.tsx
│   └── proveedores/
│       ├── ProveedorQuery.tsx
│       └── ProveedorAuth.tsx
│
├── paginas/                                # 📄 PÁGINAS (por rol)
│   ├── login/
│   │   └── LoginPage.tsx
│   ├── admin/
│   │   └── AdminDashboard.tsx
│   ├── asesor-backoffice/
│   │   └── BackofficeAdvisorDashboard.tsx
│   ├── asesor-ventas/
│   │   └── SalesAdvisorDashboard.tsx
│   ├── capacitacion/
│   │   └── TrainingDashboard.tsx
│   ├── community/
│   │   └── CommunityDashboard.tsx
│   ├── desarrollador/
│   │   └── DeveloperDashboard.tsx
│   ├── reclutamiento/
│   │   └── KanbanDashboard.tsx
│   ├── rrhh/
│   │   ├── ApplicantsDashboard.tsx
│   │   ├── EmployeeDashboard.tsx
│   │   └── ComingSoonPage.tsx
│   └── supervisor-gtr/
│       └── GTRDashboard.tsx
│
├── widgets/                                # 🧩 COMPONENTES GRANDES (reutilizables)
│   ├── barra-lateral/ui/
│   │   └── Sidebar.tsx
│   ├── encabezado/ui/
│   │   ├── Header.tsx
│   │   └── UserProfile.tsx
│   ├── tabla-postulantes/ui/
│   │   ├── ApplicantsTable.tsx
│   │   └── ApplicantsTableRow.tsx
│   ├── tabla-empleados/ui/
│   │   └── EmployeeTable.tsx
│   ├── panel-leads/ui/
│   │   └── LeadsListPanel.tsx
│   ├── panel-tipificacion/ui/
│   │   └── TipificationPanel.tsx
│   ├── community/ui/
│   │   ├── CampaignsKanban.tsx
│   │   ├── CommunityMenubar.tsx
│   │   ├── AdvertiserAccountsSection.tsx
│   │   ├── CompaniesSection.tsx
│   │   └── LeadsManagementSection.tsx
│   └── supervisor-gtr/ui/
│       ├── AdvisorsSection.tsx
│       └── LeadsSection.tsx
│
├── caracteristicas/                        # ✨ FEATURES (lógica de negocio)
│   ├── autenticacion/
│   │   ├── api/
│   │   │   └── auth.service.ts
│   │   ├── modelo/
│   │   │   └── autenticacion.tipos.ts
│   │   └── ui/
│   │       └── LoginForm.tsx
│   │
│   ├── registrar-postulante/
│   │   ├── api/
│   │   │   └── postulante.service.ts
│   │   ├── modelo/
│   │   │   └── postulante.schemas.ts
│   │   └── ui/
│   │       └── NewApplicantForm.tsx
│   │
│   ├── editar-postulante/
│   │   └── ui/
│   │       └── EditApplicantForm.tsx
│   │
│   ├── registrar-empleado/
│   │   ├── api/
│   │   │   └── empleado.service.ts
│   │   ├── modelo/
│   │   │   └── empleado.schemas.ts
│   │   └── ui/
│   │       ├── NewEmployeeForm.tsx
│   │       ├── HireApplicantForm.tsx
│   │       ├── EmployeeDetailForm.tsx
│   │       └── ActivateEmployeeModal.tsx
│   │
│   ├── baja-empleado/
│   │   └── ui/
│   │       └── EmployeeCheckoutForm.tsx
│   │
│   ├── gestion-leads/
│   │   ├── api/
│   │   ├── modelo/
│   │   └── ui/
│   │       └── NewLeadModal.tsx
│   │
│   ├── community/
│   │   ├── hooks/
│   │   │   └── useCommunityDashboard.ts
│   │   └── ui/
│   │       ├── CampaignCard.tsx
│   │       ├── AdvertiserAccountCard.tsx
│   │       └── CompanyCard.tsx
│   │
│   └── admin/
│       ├── hooks/
│       │   └── useAdminDashboard.ts
│       └── ui/
│           ├── AdicionalesSection.tsx
│           ├── PlansSection.tsx
│           └── PromotionsSection.tsx
│
├── entidades/                              # 🏛️ DOMINIO + UI (Entities)
│   ├── postulante/
│   │   ├── modelo/
│   │   │   └── postulante.tipos.ts
│   │   ├── ui/
│   │   │   └── ApplicantForm.tsx
│   │   └── indice.ts
│   │
│   ├── empleado/
│   │   ├── modelo/
│   │   │   └── empleado.tipos.ts
│   │   ├── ui/
│   │   └── indice.ts
│   │
│   ├── lead/
│   │   ├── modelo/
│   │   │   └── lead.tipos.ts
│   │   ├── ui/
│   │   │   ├── LeadListItem.tsx
│   │   │   ├── LeadDetailCard.tsx
│   │   │   └── LeadsWidget.tsx
│   │   └── indice.ts
│   │
│   ├── tipificacion/
│   │   ├── modelo/
│   │   │   └── tipificacion.tipos.ts
│   │   ├── ui/
│   │   │   ├── TipificationOption.tsx
│   │   │   └── TipificationBlockPanel.tsx
│   │   └── indice.ts
│   │
│   ├── asesor/
│   │   ├── modelo/
│   │   │   └── asesor.tipos.ts
│   │   └── indice.ts
│   │
│   └── usuario/
│       ├── modelo/
│       │   ├── usuario.tipos.ts
│       │   └── usuarioStore.ts
│       ├── ui/
│       │   └── RoleBadge.tsx
│       └── indice.ts
│
└── compartido/                             # 🎨 SHARED (UI genérica + utils)
    ├── api/
    │   └── clienteHttp.ts
    ├── ganchos/
    │   ├── usePaginacion.ts
    │   ├── useManejadorError.ts
    │   ├── useValidacionFormulario.ts
    │   └── usePatronesComunes.ts
    ├── lib/
    │   ├── formatearFecha.ts
    │   ├── formatearMoneda.ts
    │   ├── validacionTelefono.ts
    │   ├── sanitizacion.ts
    │   └── almacenamientoLocal.ts
    ├── tipos/
    │   ├── comun.ts
    │   ├── enums.ts
    │   └── eventos.ts
    ├── configuracion/
    │   ├── rutas.ts
    │   ├── clavesConsulta.ts
    │   └── constantes.ts
    ├── validacion/
    │   └── esquemas.ts
    └── ui/
        ├── boton/
        │   ├── Boton.tsx
        │   └── indice.ts
        ├── entrada/
        │   ├── Entrada.tsx
        │   └── indice.ts
        ├── insignia/
        │   ├── Insignia.tsx
        │   └── indice.ts
        ├── selector/
        │   ├── Selector.tsx
        │   └── indice.ts
        ├── modal/
        │   ├── Modal.tsx
        │   └── indice.ts
        ├── tabla/
        │   ├── Tabla.tsx
        │   └── indice.ts
        ├── paginacion/
        │   ├── Paginacion.tsx
        │   └── indice.ts
        ├── esqueleto/
        │   ├── Esqueleto.tsx
        │   └── indice.ts
        ├── notificacion/
        │   ├── Notificacion.tsx
        │   └── indice.ts
        ├── alerta/
        │   ├── Alerta.tsx
        │   └── indice.ts
        ├── tarjeta/
        │   ├── Tarjeta.tsx
        │   └── indice.ts
        ├── girador/
        │   ├── Girador.tsx
        │   └── indice.ts
        ├── botonIcono/
        │   ├── BotonIcono.tsx
        │   └── indice.ts
        ├── divisor/
        │   ├── Divisor.tsx
        │   └── indice.ts
        ├── selectorFecha/
        │   ├── SelectorFecha.tsx
        │   └── indice.ts
        ├── panelMetricas/
        │   ├── PanelMetricas.tsx
        │   └── indice.ts
        ├── tarjetaEstadistica/
        │   ├── TarjetaEstadistica.tsx
        │   └── indice.ts
        ├── limitadorErrores/
        │   ├── LimitadorErrores.tsx
        │   └── indice.ts
        └── accesoRol/
            ├── AccesoRol.tsx
            └── indice.ts
```

---

## 🔗 CAPAS Y DEPENDENCIAS

### Jerarquía:

```
app (Root)
 ↓
paginas (Pages por rol)
 ↓ importan de
widgets (Componentes grandes)
 ↓ importan de
caracteristicas (Lógica de negocio)
 ↓ importan de
entidades (Dominio + UI)
 ↓ importan de
compartido (Shared UI + Utils)
```

### Reglas (FSD):

```
✅ PERMITIDO:
- paginas → widgets, caracteristicas, entidades, compartido
- widgets → caracteristicas, entidades, compartido
- caracteristicas → entidades, compartido, caracteristicas (de la misma feature)
- entidades → compartido
- compartido → NADA (independiente)

❌ PROHIBIDO:
- caracteristicas → paginas
- entidades → caracteristicas
- compartido → cualquier otra capa
- caracteristicas → caracteristicas (de OTRA feature)
```

---

## 🎯 CONVENCIONES

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Carpetas | kebab-case | `barra-lateral`, `tabla-postulantes` |
| Componentes | PascalCase | `Sidebar.tsx`, `ApplicantForm.tsx` |
| Hooks | camelCase | `usePaginacion.ts`, `useManejadorError.ts` |
| Servicios | camelCase | `auth.service.ts`, `empleado.service.ts` |
| Tipos | camelCase + .tipos.ts | `postulante.tipos.ts`, `lead.tipos.ts` |
| Stores | camelCase + Store.ts | `usuarioStore.ts` |
| Rutas | kebab-case en URL | `/asesor-backoffice`, `/registrar-postulante` |

---

## ✅ REGLA CRÍTICA: Entities CON UI

**A DIFERENCIA de Clean Arch:**

```typescript
// EN entidades/lead/ui/ ESTÁ PERMITIDO:
export function LeadListItem() {}         ✅
export function LeadDetailCard() {}       ✅
export function LeadCard() {}             ✅

// EN compartido/ui/ ESTÁ PERMITIDO:
export function Boton() {}                ✅
export function Entrada() {}              ✅
export function Tarjeta() {}              ✅

REGLA:
- compartido/ui = Componentes genéricos (reutilizables en múltiples contextos)
- entidades/*/ui = Componentes ESPECÍFICOS de esa entidad
- caracteristicas/*/ui = Componentes ESPECÍFICOS de esa feature
```

---

## 📍 UBICACIÓN DE PATRONES

### Dónde va cada cosa:

```
TIPOS DE DOMINIO:         entidades/{entidad}/modelo/
UI DE ENTIDAD:             entidades/{entidad}/ui/
UI GENÉRICA:              compartido/ui/
LÓGICA DE NEGOCIO:        caracteristicas/{feature}/
APIS:                     caracteristicas/{feature}/api/ o entidades/
HOOKS GENÉRICOS:          compartido/ganchos/
HOOKS ESPECÍFICOS:        caracteristicas/{feature}/
VALIDACIONES GENÉRICAS:   compartido/validacion/
VALIDACIONES ESPECÍFICAS: caracteristicas/{feature}/modelo/
PÁGINAS:                  paginas/{rol}/
WIDGETS:                  widgets/{widget}/ui/
CONFIGURACIÓN:            compartido/configuracion/
```

---

## 🚨 IMPORTS: USAR ALIASES

**NO PERMITIDO (relative paths largos):**
```typescript
import { Button } from '../../../../../compartido/ui/boton/Boton.tsx';
```

**PERMITIDO (si aliases están configurados):**
```typescript
import { Button } from '@compartido/ui/boton';
// O en español:
import { Boton } from '@compartido/ui/boton';
```

---

## 📝 EJEMPLO: Feature "Registrar Postulante"

### Estructura:
```
caracteristicas/registrar-postulante/
├── api/
│   └── postulante.service.ts          ← Llamadas HTTP
├── modelo/
│   └── postulante.schemas.ts          ← Validaciones
└── ui/
    └── NewApplicantForm.tsx           ← Componente form
```

### Flujo de imports:
```
paginas/rrhh/ApplicantsDashboard.tsx
    ↓
    import { NewApplicantForm } from 'caracteristicas/registrar-postulante/ui'
    ↓
characteristicas/registrar-postulante/ui/NewApplicantForm.tsx
    ↓
    import { postulante } from '@compartido/validacion/esquemas'
    ↓
    import { crearPostulante } from '../api/postulante.service'
    ↓
    import { Postulante } from '@entidades/postulante/modelo'
```

**Flujo:** Abajo → Arriba (unidireccional) ✅

---

## 🔑 RESUMEN RÁPIDO

| Aspecto | FSD Español |
|---------|------------|
| **Lenguaje** | 100% Español |
| **Capas** | app → paginas → widgets → caracteristicas → entidades → compartido |
| **Entities con UI** | ✅ SÍ |
| **Core layer** | ❌ NO |
| **Features aisladas** | ✅ SÍ (no importan entre sí) |
| **Escalabilidad** | ✅ Para 50-100 features |

---

## ⚠️ DIFERENCIA CON OPCIÓN A (descartada)

| Aspecto | Opción A (descartada) | Opción B (ESTA) |
|--------|------|------|
| **Lenguaje** | Inglés | Español |
| **Entities UI** | ❌ NO | ✅ SÍ |
| **Core layer** | ✅ SÍ | ❌ NO |
| **Complejidad** | Alta (más capas) | Media (FSD puro) |

---

*Arquitectura FSD en Español - Versión 1.0*  
*Efectivo para FASE 0 en adelante*
