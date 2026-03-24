# 🎨 Capa: WIDGETS

**Responsabilidad:** Componentes grandes, complejos y reutilizables. **Puente entre páginas y lógica**.

## 📖 Descripción

Los widgets son componentes de **nivel intermedio** que orquestan UI + lógica simplificada:

- `barra-lateral/ui/` - Sidebar de navegación
- `encabezado/ui/` - Header y perfil usuario
- `tabla-postulantes/ui/` - Widget tabla de postulantes
- `tabla-empleados/ui/` - Widget tabla de empleados
- `panel-leads/ui/` - Panel de leads
- `panel-tipificacion/ui/` - Panel para tipificación
- `community/ui/` - Componentes Community
- `supervisor-gtr/ui/` - Componentes GTR

## 🔗 Relaciones

**Importa de:**
```
@caracteristicas  → Lógica de negocio
@entidades        → Dominio + UI específica
@compartido       → UI genérica + utilities
```

**NO importa de:**
```
❌ paginas
❌ otros widgets (misma capa, no silos)
❌ app
```

## 📁 Patrón de Archivo

```
widgets/{widget}/
├── ui/
│   ├── {Widget}.tsx          ← Componente principal
│   ├── {Widget}Row.tsx       ← Sub-componentes si es necesario
│   └── index.ts              ← Exportación limpia
└── README.md                 ← Documentación (opcional)
```

## ✅ Ejemplos de imports CORRECTOS

```typescript
// widgets/tabla-postulantes/ui/ApplicantsTable.tsx
import { Tabla } from '@compartido/ui/tabla';
import { Boton } from '@compartido/ui/boton';
import { Postulante } from '@entidades/postulante/modelo';
import { usePostulantes } from '@caracteristicas/registrar-postulante/api';

export function ApplicantsTable() {
  const { postulantes } = usePostulantes();
  return <Tabla datos={postulantes} />;
}
```

## ⚠️ Validación

Cada widget DEBE:
- ✅ Ser **reutilizable** (usado en +1 página)
- ✅ Manejar composición UI (no lógica de negocio cruda)
- ✅ Delegar lógica a características
- ✅ Estar en carpeta `ui/`
- ✅ Exportar desde `index.ts`

---

*Parte de FSD en Español - Ver: ARQUITECTURA_FSD_ESPANOL.md*
