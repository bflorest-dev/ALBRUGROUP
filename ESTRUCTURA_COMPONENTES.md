# 📁 Estructura de Componentes

Esta documentación define la organización clara de los componentes del proyecto para evitar duplicados y mantener un código ordenado.

## Estructura de Directorios

```
src/components/
├── atoms/              → Componentes más simples e indivisibles
│   └── Badge/
│       ├── StatusBadge.tsx
│       └── StatusBadge.css
├── molecules/          → Componentes pequeños compuestos (2-3 atoms)
│   ├── Modal/
│   ├── Toast/
│   ├── Pagination/
│   ├── StatCard/
│   └── ErrorBoundary.tsx
├── organisms/          → Componentes complejos compuestos
│   ├── Forms/          → Todos los formularios
│   │   ├── NewEmployeeForm.tsx
│   │   ├── EmployeeDetailForm.tsx
│   │   ├── EmployeeCheckoutForm.tsx
│   │   ├── ActivateEmployeeModal.tsx
│   │   ├── NewApplicantForm.tsx
│   │   ├── EditApplicantForm.tsx
│   │   └── HireApplicantForm.tsx
│   ├── Tables/         → Todas las tablas
│   │   ├── EmployeeTable.tsx
│   │   ├── ApplicantsTable.tsx
│   │   └── *.css
│   └── Layout/         → Componentes de layout
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── UserProfile.tsx
├── pages/              → Páginas completas (dashboards)
│   ├── EmployeeDashboard.tsx
│   ├── ApplicantsDashboard.tsx
│   └── ComingSoonPage.tsx
├── templates/          → Plantillas para layouts
│   └── DashboardTemplate/
│       └── MainLayout.tsx
└── common/             → ⚠️ VACÍO - No usar, duplicados aquí serán eliminados
```

## Reglas de Clasificación

### 🔹 **Atoms** (Componentes Atómicos)
- Componentes más simples y reutilizables
- Sin lógica compleja
- Ejemplos: `Button`, `Badge`, `Input`, `Icon`

### 🔸 **Molecules** (Moléculas)
- Combinación de 2-3 atoms
- Pequeña lógica interna
- Ejemplos: `Modal`, `Toast`, `Pagination`, `Toast`
- **INCLUYE:** `ErrorBoundary`, `Toast Container`

### 🔶 **Organisms** (Organismos)
- Componentes complejos y compuestos
- Contienen multiple molecules/atoms
- **Subcarpetas obligatorias:**
  - **Forms/** → TODOS los formularios (NewEmployeeForm, ActivateEmployeeModal, etc.)
  - **Tables/** → TODAS las tablas (EmployeeTable, ApplicantsTable, etc.)
  - **Layout/** → Componentes de layout (Header, Sidebar, UserProfile)

### 🔷 **Pages** (Páginas)
- Dashboards y páginas completas
- Combinan organisms y templates
- Ejemplos: `EmployeeDashboard`, `ApplicantsDashboard`

### 🔳 **Templates** (Plantillas)
- Estructura de layout reutilizable
- Define zonas: header, sidebar, content
- Ejemplo: `MainLayout`

---

## 📌 Importación con Aliases

A partir de ahora, usa los **aliases definidos en `tsconfig.app.json`**:

### ❌ Antiguo (rutas relativas - evitar)
```tsx
import { Modal } from '../../../molecules/Modal';
import { EmployeeTable } from '../../../../organisms/Tables/EmployeeTable';
import { Header } from '../../../../../organisms/Layout/Header';
```

### ✅ Nuevo (aliases - usar siempre)
```tsx
import { Modal } from '@molecules/Modal';
import { EmployeeTable } from '@organisms/Tables/EmployeeTable';
import { Header } from '@organisms/Layout/Header';
import type { Employee } from '@types/index';
import { mockData } from '@utils/mockData';
```

### 📋 Aliases Disponibles
| Alias | Mapeo | Uso |
|-------|-------|-----|
| `@/*` | `src/*` | Raíz del proyecto |
| `@components/*` | `src/components/*` | Acceso a cualquier componente |
| `@organisms/*` | `src/components/organisms/*` | Formularios, Tablas, Layout |
| `@molecules/*` | `src/components/molecules/*` | Modal, Toast, etc. |
| `@atoms/*` | `src/components/atoms/*` | Badge, Button, etc. |
| `@pages/*` | `src/components/pages/*` | Dashboards |
| `@templates/*` | `src/components/templates/*` | MainLayout |
| `@types/*` | `src/types/*` | Interfaces y tipos |
| `@utils/*` | `src/utils/*` | Funciones utilitarias |
| `@hooks/*` | `src/hooks/*` | Custom hooks |
| `@contexts/*` | `src/contexts/*` | Context providers |

---

## 🚨 PROHIBICIONES

### ❌ NO CREAR DUPLICADOS
- **NO** creer componentes en `common/`
- **NO** repetir un componente en dos lugares
- **NO** tener `EmployeeTable.tsx` en múltiples carpetas

### ❌ PROHIBIDO: Directorio `common/`
Este directorio debe permanecer **VACÍO**. Es una carpeta antigua que se mantiene solo para compatibilidad.

**Si necesitas reutilizar un componente:**
- Si es muy simple → Va en `atoms/`
- Si es de tamaño medio → Va en `molecules/`
- Si es un formulario → Va en `organisms/Forms/`
- Si es una tabla → Va en `organisms/Tables/`

---

## 🔄 Revisar Duplicados Periódicamente

### Ejecutar análisis de duplicados:
```bash
npm run check-duplicates
```

Este script:
1. ✅ Escanea todos los archivos en `src/`
2. ✅ Detecta archivos con el mismo nombre
3. ✅ Muestra la ubicación de cada duplicado
4. ✅ Genera reporte en la terminal

### Agregar a CI/CD:
Puedes agregarlo a tu pipeline de GitHub Actions o GitLab CI para verificar automáticamente en cada commit.

---

## 📚 Ejemplo de Migración

Si encuentras un componente en lugar incorrecto:

```
Componente: NewEmployeeForm.tsx

Ubicaciones encontradas:
- src/components/common/NewEmployeeForm.tsx (ELIMINAR)
- src/components/organisms/Forms/NewEmployeeForm.tsx (MANTENER)

Pasos:
1. Verificar que organims/Forms/ tiene la versión correcta
2. Actualizar imports en el código
3. Eliminar src/components/common/NewEmployeeForm.tsx
4. Ejecutar: npm run check-duplicates
```

---

## 💾 Automatización

### Agregar script a `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "check-duplicates": "node scripts/check-duplicates.js",
    "lint": "eslint src",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 🎯 Resumen de Cambios Realizados

✅ **Eliminados archivos duplicados:**
- `src/components/common/ActivateEmployeeModal.tsx`
- `src/components/common/NewEmployeeForm.tsx`
- `src/components/common/EmployeeDetailForm.tsx`
- `src/components/common/EmployeeCheckoutForm.tsx`
- `src/components/common/EmployeeTable.tsx`
- Todos los CSS asociados

✅ **Implementados aliases en `tsconfig.app.json`**

✅ **Creado script de detección**: `scripts/check-duplicates.js`

✅ **Documentación clara**: Este archivo

---

**Fecha de actualización:** 9 de febrero de 2026  
**Versión:** 1.0
