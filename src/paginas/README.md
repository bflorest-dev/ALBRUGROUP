# 📄 Capa: PÁGINAS

**Responsabilidad:** Componentes de página (raíz) específicos de cada rol.

## 📖 Descripción

Esta capa contiene las páginas principales del sistema, organizadas por rol de usuario:

- `login/` - Página de autenticación
- `admin/` - Dashboard administrativo
- `asesor-backoffice/` - Backoffice asesor
- `asesor-ventas/` - Dashboard ventas
- `capacitacion/` - Centro de capacitación
- `community/` - Gestión de community
- `desarrollador/` - Dashboard desarrollador
- `reclutamiento/` - Kanban reclutamiento
- `rrhh/` - RRHH (Postulantes + Empleados)
- `supervisor-gtr/` - Supervisor GTR

## 🔗 Relaciones

**Importa de:**
```
@widgets      → Componentes grandes reutilizables
@caracteristicas  → Lógica de negocio
@entidades    → Dominio + UI específica
@compartido   → UI genérica + utilities
```

**NO importa de:**
```
❌ Otras páginas
❌ app
```

## 📁 Patrón de Archivo

```
paginas/{rol}/
├── {RolPage}.tsx          ← Componente principal
└── README.md              ← Documentación local (opcional)
```

## ✅ Ejemplos de imports CORRECTOS

```typescript
// paginas/rrhh/ApplicantsDashboard.tsx
import { Header } from '@widgets/encabezado/ui';
import { Sidebar } from '@widgets/barra-lateral/ui';
import { ApplicantsTable } from '@widgets/tabla-postulantes/ui';
import { NewApplicantForm } from '@caracteristicas/registrar-postulante/ui';
import { useApplicantsData } from '@caracteristicas/registrar-postulante/api';
import { Postulante } from '@entidades/postulante/modelo';
import { Boton } from '@compartido/ui';
```

## ⚠️ Validación

Cada página DEBE:
- ✅ Mantenerse enfocada en composición (no lógica)
- ✅ Re-exportar desde widgets y características
- ✅ Usar alias `@` para imports
- ✅ Recibir props mínimo posible

---

*Parte de FSD en Español - Ver: ARQUITECTURA_FSD_ESPANOL.md*
