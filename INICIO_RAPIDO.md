# 🚀 INICIO RÁPIDO - 5 MINUTOS

## 1️⃣ INSTALAR Y EJECUTAR

```bash
# Navegar al proyecto
cd "c:\Users\LEONARDO\PROPOSALS X ALBRU AREAS\01.RRHH\PROPUESTA A"

# Instalar dependencias (si necesita)
npm install

# Iniciar en desarrollo
npm run dev

# Abrir en navegador
# http://localhost:5173
```

## 2️⃣ VER LA INTERFAZ

Verás:
- ✅ Sidebar con navegación
- ✅ Dashboard con 4 estadísticas
- ✅ Tabla con 4 empleados
- ✅ Paginación funcional
- ✅ Perfil de usuario en sidebar
- ✅ Diseño moderno y responsivo

## 3️⃣ ESTRUCTURA CLAVE

```
src/
├── components/
│   ├── common/         ← Componentes reutilizables
│   ├── layout/         ← Estructura de la app
│   └── pages/          ← Páginas principales
├── types/              ← Tipos TypeScript
├── hooks/              ← Lógica reutilizable
└── utils/              ← Datos y constantes
```

## 4️⃣ COMPONENTES PRINCIPALES

### StatCard
Muestra estadísticas con valor y porcentaje.

### EmployeeTable
Tabla con empleados, posición, departamento y estado.

### StatusBadge
Insignia con color según estado (Activo, Licencia, Capacitación).

### Pagination
Controles de página (Prev, números, Next).

### Sidebar
Navegación lateral con menú y perfil de usuario.

## 5️⃣ ARCHIVOS DE DOCUMENTACIÓN

| Archivo | Propósito |
|---------|-----------|
| README.md | Guía general |
| ESTRUCTURA_Y_BUENAS_PRACTICAS.md | Arquitectura técnica |
| GUIA_IMPLEMENTACION.md | Cómo usar y próximos pasos |
| ARQUITECTURA_VISUAL.txt | Diagramas ASCII |
| EJEMPLOS_INTEGRACION_API.ts | Ejemplos de API |
| CHECKLIST_IMPLEMENTACION.md | Lo que se implementó |

## 6️⃣ COMANDOS ÚTILES

```bash
# Desarrollo con hot reload
npm run dev

# Compilar para producción
npm run build

# Previsualizar el build
npm run preview

# Validar tipos TypeScript
npm run build

# Linting
npm run lint
```

## 7️⃣ PERSONALIZACIÓN RÁPIDA

### Cambiar cantidad de elementos por página
**Archivo**: `src/utils/mockData.ts`
```typescript
export const ITEMS_PER_PAGE = 4; // Cambiar aquí
```

### Cambiar colores de estados
**Archivo**: `src/utils/constants.ts`
```typescript
export const EMPLOYEE_STATUS_COLORS = {
  ACTIVO: '#10B981',           // Cambiar aquí
  'DE LICENCIA': '#F59E0B',    // Cambiar aquí
  CAPACITACIÓN: '#3B82F6',     // Cambiar aquí
};
```

### Agregar más empleados
**Archivo**: `src/utils/mockData.ts`
```typescript
export const mockEmployees: Employee[] = [
  // Agregar más aquí...
];
```

## 8️⃣ PRÓXIMO PASO: CONECTAR CON API

Ver archivo: **EJEMPLOS_INTEGRACION_API.ts**

Básicamente:
1. Crear `src/services/employeeService.ts`
2. Implementar `fetchEmployees()`
3. Usar hook `useFetchEmployees`
4. Reemplazar mockData

## 9️⃣ ESTRUCTURA DE COMPONENTES

```
MainLayout
├── Sidebar
│   ├── Logo
│   ├── NavItems
│   └── UserProfile
└── EmployeeDashboard
    ├── Header
    ├── Statistics (x4 StatCard)
    ├── DirectorySection
    │   ├── SectionHeader
    │   ├── EmployeeTable
    │   │   └── StatusBadge (x4)
    │   └── Pagination
    └── UserProfile (Footer)
```

## 🔟 TIPS Y TRUCOS

### Agregar nueva página
1. Crear archivo en `src/components/pages/`
2. Exportar desde `index.ts`
3. Usar en MainLayout

### Agregar nuevo componente
1. Crear archivo en `src/components/common/`
2. Crear CSS con mismo nombre
3. Exportar desde `index.ts`
4. Usar en otros componentes

### Cambiar datos
Solo editar `src/utils/mockData.ts`
El resto de la app se actualiza automáticamente.

## ⚡ PERFORMANCE

El proyecto está optimizado:
- ✅ CSS: 2.03 KB (gzip)
- ✅ JS: 62.88 KB (gzip)
- ✅ Build: 713ms
- ✅ Renders: Optimizados con useMemo

## 📞 SOPORTE RÁPIDO

**¿Cómo buscar empleados?**
→ Infraestructura lista en `EmployeeDashboard`
→ Descomentar lógica de búsqueda

**¿Cómo agregar más columnas a tabla?**
→ Editar `EmployeeTable.tsx`
→ Actualizar interfaz `Employee` en `types/`

**¿Cómo cambiar colores?**
→ Editar `src/utils/constants.ts`
→ Todos los colores se actualizan automáticamente

**¿Cómo conectar con backend?**
→ Ver `EJEMPLOS_INTEGRACION_API.ts`
→ Copiar patrón y adaptarlo

## ✅ CHECKLIST RÁPIDO

- [x] Proyecto creado
- [x] Componentes desarrollados
- [x] TypeScript configurado
- [x] Estilos aplicados
- [x] Responsivo
- [x] Documentado
- [x] Listo para usar

## 🎯 TU PRÓXIMO PASO

1. **Ejecutar** → `npm run dev`
2. **Ver** → Abrir navegador
3. **Explorar** → Revisar componentes
4. **Personalizar** → Cambiar datos/colores
5. **Integrar API** → Seguir ejemplos

---

**¡A CODEAR! 🚀**

Cualquier duda, revisar la documentación en los archivos `.md`
