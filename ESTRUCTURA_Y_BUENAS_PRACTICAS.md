# 📋 Documentación de Estructura - Gestión de Empleados

## 🏗️ Arquitectura del Proyecto

El proyecto está organizado siguiendo **buenas prácticas de React** y patrones escalables:

```
src/
├── components/           # Componentes React
│   ├── common/          # Componentes reutilizables
│   │   ├── StatCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── EmployeeTable.tsx
│   │   ├── Pagination.tsx
│   │   └── index.ts
│   ├── layout/          # Componentes de estructura
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── UserProfile.tsx
│   │   ├── MainLayout.tsx
│   │   └── index.ts
│   └── pages/           # Componentes de página
│       ├── EmployeeDashboard.tsx
│       └── index.ts
├── types/               # Tipos TypeScript
│   └── index.ts
├── hooks/               # Hooks personalizados
│   └── usePagination.ts
├── utils/               # Funciones utilitarias
│   ├── mockData.ts      # Datos simulados
│   └── constants.ts     # Constantes de la app
└── styles/              # Estilos globales
```

## ✨ Características Principales

### 1. **Componentes Reutilizables**
- `StatCard`: Tarjeta de estadísticas con diseño limpio
- `StatusBadge`: Insignia de estado del empleado
- `EmployeeTable`: Tabla responsiva con datos
- `Pagination`: Control de navegación de páginas

### 2. **Separación de Responsabilidades**
- Componentes presentacionales (UI puros)
- Componentes contenedores (lógica de negocio)
- Hooks personalizados para lógica reutilizable
- Tipos definidos centralizadamente

### 3. **Sistema de Tipos TypeScript**
```typescript
// Tipos bien definidos para seguridad
interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  status: EmployeeStatus;
}
```

### 4. **Gestión de Estado**
- `usePagination`: Hook para manejar paginación
- `useState`: Para estado local de componentes
- Props tipadas para comunicación entre componentes

### 5. **Estilos Modularizados**
- **CSS Modular**: Cada componente tiene su CSS asociado
- **Consistencia Visual**: Variables de color globales
- **Responsive Design**: Adaptable a dispositivos móviles
- **Sistema de Grid**: Layouts flexibles

## 🎨 Palet de Colores

```css
/* Primarios */
--purple-dark: #667eea
--purple-light: #764ba2

/* Neutrales */
--white: #ffffff
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-600: #6B7280
--gray-900: #1F2937

/* Estados */
--success: #10B981 (Activo)
--warning: #F59E0B (De Licencia)
--info: #3B82F6 (Capacitación)
```

## 🚀 Buenas Prácticas Implementadas

### 1. **Nomenclatura Consistente**
- Componentes: PascalCase (`EmployeeTable`)
- Funciones: camelCase (`handleAction`)
- Constantes: UPPER_SNAKE_CASE (`ITEMS_PER_PAGE`)
- CSS classes: kebab-case (`.employee-table`)

### 2. **Componentización**
- Componentes pequeños y enfocados
- Props tipadas con TypeScript
- Propiedades opcionales bien documentadas
- Reutilización máxima

### 3. **Manejo de Datos**
- Datos mockeados separados (`mockData.ts`)
- Constantes centralizadas (`constants.ts`)
- Fácil de cambiar por API real

### 4. **Performance**
- `useMemo` para optimizar cálculos
- Evitar renders innecesarios
- CSS eficiente
- Estructura de componentes lean

### 5. **Accesibilidad**
- Semántica HTML correcta
- Atributos `title` en botones
- Contraste de colores adecuado
- Navegación clara

### 6. **Testing Friendly**
- Componentes sin side effects
- Funciones puras
- Props bien documentadas
- Fáciles de testear

## 📱 Responsive Design

```css
/* Breakpoints */
- Desktop: > 768px
- Tablet: 480px - 768px
- Mobile: < 480px

/* Grid adaptable */
- stats-grid: respeta minmax(250px, 1fr)
- Sidebar: fixed en desktop, puede ajustarse en mobile
```

## 🔄 Flujo de Datos

```
MainLayout
  ├── Sidebar (navegación)
  ├── EmployeeDashboard (página)
  │   ├── Header
  │   ├── Statistics (StatCard x4)
  │   ├── EmployeeTable
  │   │   └── StatusBadge
  │   └── Pagination
  └── UserProfile (footer)
```

## 📝 Convenciones de Código

### Componentes Funcionales
```tsx
export const MyComponent = ({ prop1, prop2 }: Props) => {
  // Lógica
  return (
    <div>Contenido</div>
  );
};
```

### Tipos y Interfaces
```tsx
// types/index.ts
export interface Employee {
  id: string;
  // ...
}

export type EmployeeStatus = 'ACTIVO' | 'DE LICENCIA' | 'CAPACITACIÓN';
```

### Imports
```tsx
// Agrupar imports:
// 1. React y dependencias
// 2. Componentes locales
// 3. Tipos
// 4. Utilidades
// 5. Estilos
```

## 🎯 Extensibilidad

Este proyecto está diseñado para crecer fácilmente:

### Agregar Nueva Página
1. Crear componente en `src/components/pages/`
2. Agregarlo al router o MainLayout
3. Usar componentes comunes existentes

### Agregar Nuevo Componente
1. Crear archivo `.tsx` en `components/`
2. Crear estilos `.css` asociados
3. Exportar desde `index.ts`
4. Utilizar en otros componentes

### Cambiar Datos Mockeados por API
```tsx
// En lugar de:
const data = mockEmployees;

// Usar:
const [data] = useState<Employee[]>([]);
useEffect(() => {
  fetchEmployees().then(setData);
}, []);
```

## 🧪 Testing

Estructura lista para testing:
- Componentes puros y fáciles de testear
- Funciones sin side effects
- Dependencias inyectables
- Tipos garantizan validez

```typescript
// Ejemplo de test
describe('StatCard', () => {
  it('should display stat value', () => {
    const stat: Statistic = {
      label: 'TEST',
      value: 100,
    };
    // render y assert
  });
});
```

## 📚 Scripts Disponibles

```bash
npm run dev      # Iniciar desarrollo
npm run build    # Construir para producción
npm run lint     # Ejecutar linter
npm run preview  # Previsualizar build
```

## 🔗 Próximos Pasos

1. **Integración API**: Conectar con backend real
2. **Autenticación**: Agregar sistema de login
3. **Filtros Avanzados**: Búsqueda y filtrado en tabla
4. **Modal de Detalles**: Ver/editar detalles de empleados
5. **Exportar Datos**: Descargar CSV/PDF
6. **Notificaciones**: Toast/Alert system
7. **Dark Mode**: Soporte para tema oscuro
8. **Internacionalización**: Soporte multiidioma

---

**Última actualización**: 5 de febrero de 2026
