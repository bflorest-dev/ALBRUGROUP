# Community Dashboard - Menubar Vertical

## Descripción
Se ha adaptado la estructura de COMMUNITY para incluir un **menubar vertical en el lado izquierdo** que permite navegación entre diferentes apartados de gestión.

## Estructura actualizada

### Componentes nuevos
1. **CommunityMenubar.tsx** - Componente de navegación vertical
   - Ubicación: `src/features/COMMUNITY/components/CommunityMenubar.tsx`
   - Propiedades:
     - `activeSection: string` - Sección actualmente activa
     - `onSectionChange: (section: string) => void` - Callback al cambiar sección
   - Secciones disponibles:
     - Dashboard
     - Campañas
     - Leads
     - Reportes
     - Analytics
     - Configuración

2. **CommunityMenubar.css** - Estilos del menubar
   - Ubicación: `src/features/COMMUNITY/components/CommunityMenubar.css`
   - Características:
     - Diseño sticky (se mantiene visible al scroll)
     - Gradiente oscuro profesional
     - Estados activos con indicadores visuales
     - Responsive design (colapsa en móviles)

## Cambios principales

### CommunityDashboard.tsx
- Agregado import de `CommunityMenubar`
- Nuevo state `activeSection` para controlar la sección activa
- Estructura envuelta en `community-dashboard-wrapper` con layout flex
- El menubar se renderiza en el lado izquierdo
- El contenido principal ocupa el espacio restante

### CommunityDashboard.css
- Nuevo contenedor `.community-dashboard-wrapper` con flexbox
- El `.community-dashboard` ajustado para ser flex: 1 y ocupar el espacio disponible
- Responsive design mejorado para pantallas pequeñas
- Soporte para colapso del menubar en versión móvil

## Layout visual

```
┌─────────────────────────────────────────┐
│  Menubar  │     Community Dashboard     │
│ Vertical  │    (Main Content Area)      │
│           │                             │
│ Dashboard │  Header con Title + Botones │
│ Campañas  ├─────────────────────────────┤
│ Leads     │  Left Panel  │  Right Panel  │
│ Reportes  │ (Métricas)   │ (Leads)      │
│ Analytics ├──────────────┴──────────────┤
│ Config    │  Campañas Section (Full)    │
│           │  DataTable de Campañas      │
└─────────────────────────────────────────┘
```

## Cómo extender con más apartados

### Agregar nuevas secciones

1. **Actualizar CommunityMenubar.tsx**:
   ```typescript
   // En menuItems array, agregar:
   {
     id: 'nuevaSeccion',
     label: 'Nueva Sección',
     icon: <BiIcono size={20} />,
     section: 'nuevaSeccion'
   }
   ```

2. **Actualizar CommunityDashboard.tsx**:
   ```typescript
   // En el switch/if para renderizar contenido por sección
   case 'nuevaSeccion':
     return <ComponenteNuevoApartado />;
   ```

3. **Crear componentes de contenido** para cada sección según sea necesario

## Funcionalidades actuales

- ✅ Menubar vertical sticky
- ✅ Navegación entre secciones
- ✅ Indicadores visuales de sección activa
- ✅ Diseño responsive
- ✅ Iconos profesionales
- ✅ Animaciones suaves
- ✅ Estilos consistentes con el diseño

## Próximos pasos (Sugerencias)

1. Implementar vistas específicas para cada sección usando el `activeSection`
2. Agregar más apartados según necesidad del negocio
3. Crear componentes separados para cada sección (Campaigns, Leads, Reports, etc.)
4. Implementar rutas/navegación con React Router si es necesario
5. Mejorar persistencia de estado de sección activa

## Estilos y colores utilizados

- **Fondo Menubar**: Gradiente gris oscuro (#1F2937 a #374151)
- **Color Activo**: Azul primario (#3B82F6)
- **Hover**: Azul más claro con fondo semitransparente
- **Borde izquierdo activo**: 3px sólido azul
- **Iconos**: Tamaño 20px, color gris claro en estado idle
