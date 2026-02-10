# 👨‍💼 Sistema de Gestión de Empleados - Connect

Una aplicación moderna de gestión de empleados construida con **React**, **TypeScript** y **Vite**, aplicando las mejores prácticas de desarrollo.

## 🎯 Características

- ✅ **Dashboard de Empleados**: Vista general con estadísticas
- ✅ **Tabla de Directorio**: Listado detallado de empleados
- ✅ **Paginación**: Control eficiente de datos
- ✅ **Estados Dinámicos**: Visualización clara del estado de cada empleado
- ✅ **Diseño Responsivo**: Adaptable a cualquier dispositivo
- ✅ **TypeScript**: Seguridad de tipos total
- ✅ **Componentes Reutilizables**: Arquitectura escalable
- ✅ **CSS Modular**: Estilos organizados y mantenibles

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 16+ 
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone <repo-url>

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación se abrirá en `http://localhost:5173`

## 📦 Scripts Disponibles

```bash
npm run dev      # Iniciar servidor de desarrollo con HMR
npm run build    # Construir para producción
npm run preview  # Previsualizar el build de producción
npm run lint     # Ejecutar ESLint
```

## 🏗️ Estructura del Proyecto

```
src/
├── components/
│   ├── common/           # Componentes reutilizables
│   ├── layout/           # Componentes de estructura
│   └── pages/            # Páginas principales
├── types/                # Definiciones TypeScript
├── hooks/                # Hooks personalizados
├── utils/                # Funciones auxiliares
└── styles/               # Estilos globales
```

## 🎨 Componentes Principales

### StatCard
Tarjeta que muestra estadísticas clave con valor y porcentaje.

```tsx
<StatCard stat={statistic} />
```

### EmployeeTable
Tabla responsiva con información de empleados.

```tsx
<EmployeeTable 
  employees={employees}
  onAction={handleAction}
/>
```

### Pagination
Controles de paginación con información clara.

```tsx
<Pagination
  currentPage={1}
  totalPages={312}
  totalItems={1248}
  itemsPerPage={4}
  onPageChange={goToPage}
/>
```

### StatusBadge
Insignia visual del estado del empleado.

```tsx
<StatusBadge status="ACTIVO" />
```

## 📊 Datos Disponibles

Los datos se proporcionan como mock en `src/utils/mockData.ts`. Para integración con una API:

```tsx
// En lugar de datos estáticos, usar:
const [employees, setEmployees] = useState<Employee[]>([]);

useEffect(() => {
  fetch('/api/employees')
    .then(res => res.json())
    .then(setEmployees);
}, []);
```

## 🎨 Personalización

### Temas de Color
Los colores están definidos en `src/utils/constants.ts`:

```typescript
export const EMPLOYEE_STATUS_COLORS = {
  ACTIVO: '#10B981',
  'DE LICENCIA': '#F59E0B',
  CAPACITACIÓN: '#3B82F6',
};
```

### Cantidad de Elementos por Página
```typescript
// En src/utils/mockData.ts
export const ITEMS_PER_PAGE = 4;
```

## 🔧 Tecnologías Utilizadas

- **React 19.2.0**: Librería de UI
- **TypeScript 5.9**: Seguridad de tipos
- **Vite 7.2.4**: Bundler moderno
- **CSS Modular**: Estilos encapsulados

## 📱 Responsividad

La aplicación es completamente responsiva:

- **Desktop**: Sidebar fijo + contenido flexible
- **Tablet**: Sidebar adaptado
- **Mobile**: Interfaz optimizada para pantallas pequeñas

## 🎓 Buenas Prácticas Implementadas

✅ Componentes funcionales con hooks
✅ Props tipadas con TypeScript
✅ Separación de responsabilidades
✅ CSS modular y reutilizable
✅ Nombres consistentes (PascalCase, camelCase)
✅ Comentarios y documentación
✅ Estructura escalable
✅ Performance optimizado

## 📝 Próximas Mejoras

- [ ] Integración con API backend
- [ ] Sistema de autenticación
- [ ] Filtros avanzados de búsqueda
- [ ] Modal para ver/editar detalles
- [ ] Exportar datos a CSV/PDF
- [ ] Sistema de notificaciones
- [ ] Tema oscuro (Dark Mode)
- [ ] Internacionalización (i18n)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Contacto

Para preguntas o sugerencias, contactar al equipo de desarrollo.

---

**Última actualización**: 5 de febrero de 2026
**Versión**: 1.0.0

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
