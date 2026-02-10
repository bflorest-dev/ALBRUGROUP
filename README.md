# 👨‍💼 Sistema de Gestión de Empleados (RRHH)

Aplicación moderna de gestión de Recursos Humanos construida con **React**, **TypeScript** y **Vite**, aplicando las mejores prácticas de desarrollo.

## 🎯 Características

- ✅ **Dashboard de Empleados**: Vista con estadísticas
- ✅ **Tabla de Directorio**: Listado detallado de empleados
- ✅ **Gestión de Candidatos**: Dashboard de aplicantes
- ✅ **Formularios Interactivos**: Alta, edición, activación de empleados
- ✅ **Paginación**: Control eficiente de datos
- ✅ **Notificaciones**: Sistema de alertas con Context API
- ✅ **TypeScript**: Seguridad de tipos
- ✅ **Componentes Reutilizables**: Arquitectura escalable (Atomic Design)
- ✅ **CSS Modular**: Estilos organizados

## 🚀 Inicio Rápido

### Requisitos
- Node.js 16+
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev
```

La aplicación se abrirá en `http://localhost:5173`

## 📦 Scripts Disponibles

```bash
npm run dev            # Desarrollo con HMR
npm run build          # Build para producción
npm run preview        # Previsualizar build
npm run lint           # Ejecutar ESLint
npm run check-duplicates # Verificar componentes duplicados
```

## 🏗️ Estructura del Proyecto

```
src/
├── components/
│   ├── atoms/          # Componentes base (Button, Input, Label, Badge)
│   ├── molecules/      # Componentes compuestos (Card, Modal, Toast)
│   ├── organisms/      # Componentes complejos (Forms, Tables, Layout)
│   └── pages/          # Páginas principales (Dashboards)
├── contexts/           # Context API (Data, Notifications)
├── hooks/              # Custom hooks (usePagination, useErrorHandler)
├── types/              # Tipos TypeScript
├── utils/              # Constantes y datos mock
└── styles/             # Estilos globales
```

## 🔧 Tecnologías

- **React 19.2.0**: UI moderna
- **TypeScript 5.9**: Tipado seguro
- **Vite 7.2.4**: Bundler rápido
- **ESLint 9.39**: Linting
- **CSS Modular**: Estilos encapsulados

## 📝 Arquitectura de Componentes (Atomic Design)

### Atoms
Componentes base: `Badge`, `Button`, `Input`, `Label`, `Select`

### Molecules
Componentes compuestos: `Card`, `Modal`, `Toast`, `Pagination`, `StatCard`

### Organisms
Componentes complejos: Formularios, Tablas, Layout (Header, Sidebar)

## 📊 Contextos Disponibles

### DataContext
Gestión de datos globales (empleados, candidatos)

### NotificationContext
Sistema de notificaciones y alertas

## 🎨 Próximas Mejoras

- [ ] Integración con API backend
- [ ] Autenticación y autorización
- [ ] Búsqueda y filtros avanzados
- [ ] Exportar a PDF/Excel
- [ ] Tema oscuro
- [ ] Internacionalización (i18n)
- [ ] Tests unitarios e integración

## 🤝 Contribuir

1. Crea una rama: `git checkout -b feature/nombre`
2. Commit: `git commit -m "feat: descripción"`
3. Push: `git push origin feature/nombre`
4. Pull Request en GitHub

## 📄 Licencia

MIT License

---

**v1.0.0** • Febrero 2026

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
