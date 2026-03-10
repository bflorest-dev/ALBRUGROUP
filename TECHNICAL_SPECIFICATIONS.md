# Especificación Técnica - Community Manager Dashboard

## Estructura de Archivos

```
src/features/COMMUNITY/
├── components/
│   ├── index.ts                    # Exports de componentes
│   ├── MetricsPanel.tsx            # Componente de paneles de métricas
│   ├── MetricsPanel.css            # Estilos de MetricsPanel
│   ├── LeadsWidget.tsx             # Widget de gestión de leads
│   └── LeadsWidget.css             # Estilos de LeadsWidget
└── pages/
    ├── CommunityDashboard.tsx      # Vista principal del dashboard
    └── CommunityDashboard.css      # Estilos del dashboard
```

## Interfaces TypeScript

### Campaign
```typescript
interface Campaign {
  id: string;
  date: string;
  time: string;
  businessUnit: string;
  campaignName: string;
  channel: 'Facebook' | 'Instagram' | 'Teléfono Hogar' | 'Internet Empresas' | 'Móviles';
  totalSpent: number;
  preventas: number;
  conversionRate: number;
  status: 'Activa' | 'Pausada';
  impressions?: number;
  clicks?: number;
  reach?: number;
  frequency?: number;
}
```

### Lead
```typescript
interface Lead {
  id: string;
  name: string;
  status: 'no-contesta' | 'solo-info' | 'interesado' | 'derivado' | 'convertido';
  canal: string;
  fecha: string;
}
```

### MetricItem
```typescript
interface MetricItem {
  label: string;
  value: string | number;
  unit?: string;
}
```

## Componentes React

### MetricsPanel
**Props:**
- `title: string` - Título del panel
- `metrics: MetricItem[]` - Array de métricas a mostrar
- `color?: string` - Color del borde superior (default: #3B82F6)

**Características:**
- Renderiza lista de métricas con etiqueta y valor
- Borde superior coloreado
- Hover effect suave
- Separadores entre items

### LeadsWidget
**Props:**
- `leads: Lead[]` - Array de leads

**Características:**
- Grid 2x3 de estados
- Resumen numérico por estado
- Lista de últimos 5 leads
- Badges con colores dinámicos según estado

**Estados de Lead:**
- `no-contesta`: #EF4444 (Rojo)
- `solo-info`: #F59E0B (Naranja)
- `interesado`: #3B82F6 (Azul)
- `derivado`: #8B5CF6 (Púrpura)
- `convertido`: #10B981 (Verde)

## Hooks Utilizados

### useState
```typescript
const [campaigns] = useState<Campaign[]>(mockCampaigns);
const [leads] = useState<Lead[]>(mockLeads);
const [selectedFilter, setSelectedFilter] = useState<string>('Todos');
```

### useMemo
```typescript
// Para calcular métricas META ADS
const metaAdsMetrics = useMemo(() => {...}, [campaigns]);

// Para calcular métricas GESTIÓN GTR
const gestionGtrMetrics = useMemo(() => {...}, [campaigns]);

// Para filtrar campañas
const filteredCampaigns = useMemo(() => {...}, [campaigns, selectedFilter]);
```

## Cálculos de Métricas

### META ADS
```typescript
const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
const totalReach = campaigns.reduce((sum, c) => sum + (c.reach || 0), 0);
const totalSpent = campaigns.reduce((sum, c) => sum + c.totalSpent, 0);

const ctr = ((totalClicks / totalImpressions) * 100).toFixed(2); // Porcentaje
const cpc = (totalSpent / totalClicks).toFixed(2);              // Por clic
const avgFrequency = (campaigns.reduce((sum, c) => sum + (c.frequency || 0), 0) / campaigns.length).toFixed(2);
```

### GESTIÓN GTR
```typescript
const totalSpent = campaigns.reduce((sum, c) => sum + c.totalSpent, 0);
const totalPreventas = campaigns.reduce((sum, c) => sum + c.preventas, 0);
const avgConversion = (campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length).toFixed(1);
const costPerPreventa = (totalSpent / totalPreventas).toFixed(0);
const activeCampaigns = campaigns.filter(c => c.status === 'Activa').length;
```

## Color Palette

### Primarios
- Azul Principal: `#3B82F6`
- Cian Secundario: `#06B6D4`

### Neutros
- Blanco: `#FFFFFF`
- Gris Claro: `#F9FAFB`, `#F3F4F6`
- Gris Medio: `#E5E7EB`, `#D1D5DB`
- Gris Oscuro: `#6B7280`, `#374151`, `#1F2937`

### Estados
- Verde (Éxito): `#10B981`
- Naranja (Advertencia): `#F59E0B`
- Rojo (Error): `#EF4444`

### Canales
- Facebook: `#3B82F6`
- Instagram: `#EC4899`
- Teléfono Hogar: `#8B5CF6`
- Internet Empresas: `#06B6D4`
- Móviles: `#F59E0B`

## Responsive Breakpoints

```css
/* Desktop */
.dashboard-content { grid-template-columns: 400px 1fr; }

/* Tablets */
@media (max-width: 1400px) {
  .dashboard-content { grid-template-columns: 350px 1fr; }
}

@media (max-width: 1024px) {
  .dashboard-content { grid-template-columns: 1fr; }
}

/* Móvil */
@media (max-width: 768px) {
  .dashboard-header { flex-direction: column; }
  .btn-new-campaign { width: 100%; }
  .leads-summary { grid-template-columns: 1fr 1fr; }
}
```

## Tipografía

- **H1**: 28px, 700, letra-space -0.5px
- **H2/H3**: 16px, 700, letra-space 0.5px
- **H4**: 12px, 600, letra-space 0.3px
- **Body**: 13px, 500
- **Small**: 11px, 600, texto-transform uppercase

## Espaciado

- Gap principal: 32px
- Gap secundario: 24px, 20px
- Gap terciario: 16px, 12px
- Padding paneles: 24px
- Padding items: 12px, 10px

## Animaciones

```css
/* Transiciones generales */
transition: all 0.2s ease;

/* Hover effects */
.btn-new-campaign:hover {
  background: #2563EB;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.metrics-panel:hover {
  border-color: #D1D5DB;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
```

## Data Flow

```
CommunityDashboard
├── [campaigns] → metaAdsMetrics
│                → gestionGtrMetrics
│                → filteredCampaigns → campaigns-table
├── [leads] → LeadsWidget → lead-status-item × 5
│                        → lead-item × 5
└── [selectedFilter] → filteredCampaigns
```

## Futuras Mejoras

1. **API Integration**: Conectar con backend para datos en tiempo real
2. **Date Range Picker**: Filtrar por fechas
3. **Charts**: Gráficos de tendencia con Chart.js o D3
4. **Export**: Exportar datos a CSV/PDF
5. **Real-time Updates**: WebSocket para actualizaciones en vivo
6. **Advanced Filters**: Filtros por banco de datos, estado de presupuesto
7. **Comparisons**: Comparar períodos
8. **Notifications**: Alertas de leads pendientes
9. **Performance Metrics**: Dashboard de KPIs clave
10. **Team Management**: Asignación de leads a asesores

## Testing

### Unit Tests (sugeridos)
```typescript
describe('CommunityDashboard', () => {
  it('should calculate correct meta ads metrics');
  it('should filter campaigns by channel');
  it('should display correct lead counts by status');
  it('should update metrics when campaigns change');
});

describe('MetricsPanel', () => {
  it('should render metrics correctly');
  it('should apply color styles');
  it('should format metric values');
});

describe('LeadsWidget', () => {
  it('should count leads by status');
  it('should display latest 5 leads');
  it('should show correct color badges');
});
```

## Performance Considerations

- ✅ useMemo para cálculos de métricas
- ✅ Filtrado sin re-renders innecesarios
- ✅ CSS sin sombras animadas en scroll
- ✅ Tabla con virtualization (recomendado para >1000 filas)
- ✅ Importes localizados una sola vez

## Accesibilidad (a11y)

- ✅ Suficiente contraste de color
- ✅ Labels claros en inputs
- ✅ Keyboard navigation en botones
- ✅ ARIA labels en badges
- ✅ Tamaño de texto legible

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
