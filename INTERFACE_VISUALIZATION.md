# Visualización de la Nueva Interfaz Community Manager

## Estructura Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Gestión de Community Manager | Meta Ads + Seguimiento de Leads  [+ Nueva...]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ ┌──────────────────────┐  ┌────────────────────────────────────────────────┐│
│ │   META ADS           │  │        GESTIÓN DE LEADS                        ││
│ │ ──────────────────   │  │ ───────────────────────────────────────────── ││
│ │ Impresiones: 122.630 │  │ ┌─────────────┐ ┌─────────────┐               ││
│ │ Alcance: 106.900     │  │ │ 3           │ │ 1           │               ││
│ │ Clicks: 2.810        │  │ │ Interesado  │ │ No Contesta │               ││
│ │ CTR: 2.30%           │  │ └─────────────┘ └─────────────┘               ││
│ │ CPC: S/ 4.45         │  │ ┌─────────────┐ ┌─────────────┐               ││
│ │ Frecuencia: 1.14     │  │ │ 2           │ │ 2           │               ││
│ │                      │  │ │ Derivado    │ │ Convertido  │               ││
│ │                      │  │ └─────────────┘ └─────────────┘               ││
│ └──────────────────────┘  │                                                ││
│ ┌──────────────────────┐  │ Últimos Leads                                  ││
│ │   GESTIÓN GTR        │  │ Juan García        [Interesado]                ││
│ │ ──────────────────   │  │ María López        [Derivado]                  ││
│ │ Campañas Activas: 4  │  │ Carlos Rodríguez   [No Contesta]              ││
│ │ Gasto Total: S/ 35K  │  │ Ana Martínez       [Convertido]               ││
│ │ Total Preventas: 48  │  │ Pedro Gómez        [Solo Información]         ││
│ │ % Conv. Promedio: 11%│  │                                                ││
│ │ Costo/Preventa: S/ 729│ │                                                ││
│ └──────────────────────┘  └────────────────────────────────────────────────┘│
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filtrar por Canal: [Todos] [Facebook] [Instagram] [Teléf.Hogar] [Internet] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ CAMPAÑAS META ADS (5)                                                        │
│ ┌────────┬──────────────────┬───────────┬──────────┬────────┬─────┐        │
│ │ FECHA  │ CAMPAÑA          │ CANAL     │ IMPRES.  │ CTR    │ $ G. │ ...  │
├────────┼──────────────────┼───────────┼──────────┼────────┼─────┤        │
│ 01/03  │ Promo Fibra      │ Facebook  │ 45,230   │ 2.75%  │12.5K │ ...  │
│ 01/03  │ Fibra Empresa    │ Instagram │ 32,100   │ 2.77%  │8.2K  │ ...  │
│ 02/03  │ Combo TV+Net     │ Facebook  │ 28,400   │ 2.29%  │6.8K  │ ...  │
│ 03/03  │ Plan Familia     │ Instagram │ 15,600   │ 2.44%  │4.5K  │ ...  │
│ 04/03  │ Retargeting      │ Facebook  │ 12,300   │ 2.28%  │3.2K  │ ...  │
│ └────────┴──────────────────┴───────────┴──────────┴────────┴─────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Características Visuales

### Colores Utilizados
- **Primario**: Azul #3B82F6 (Buttons, highlights)
- **Secundario**: Cian #06B6D4 (GESTIÓN GTR)
- **Fondo**: Blanco #FFFFFF
- **Bordes**: Gris claro #E5E7EB
- **Texto**: Gris oscuro #1F2937
- **Éxito**: Verde #10B981 (Conversiones, convertidos)
- **Advertencia**: Naranja #F59E0B (Pausado)
- **Error**: Rojo #EF4444 (No Contesta)

### Componentes Principales

#### 1. MetricsPanel (Izquierda)
- Border superior azul 3px
- Métricas en 2 columnas (Etiqueta | Valor)
- Separadores sutiles entre items
- Hover effect suave

#### 2. LeadsWidget (Derecha)
- Grid 2x3 de estados de leads
- Números grandes y prominentes
- Etiquetas pequeñas en mayúsculas
- Lista de leads recientes abajo

#### 3. Tabla de Campañas
- Headers con fondo gris
- Texto en mayúsculas pequeñas
- Filas alternadas al hover
- Badges de colores para estados
- Métricas destacadas en azul

### Responsive Behavior
- Desktop: Dos columnas (400px + 1fr)
- Tablet (1024px): Dos columnas estrechas
- Móvil (768px): Una columna

## Datos Mostrados

### META ADS
- Impresiones totales
- Alcance estimado
- Clicks
- Click-Through Rate (CTR)
- Costo Por Click (CPC)
- Frecuencia promedio

### GESTIÓN GTR
- Campañas activas/totales
- Gasto total
- Total de preventas
- Conversión promedio
- Costo por preventa
- Campañas pausadas

### Leads por Estado
- No Contesta: Rojos
- Solo Información: Naranjas
- Interesado: Azules
- Derivado a Asesor: Púrpuras
- Convertido: Verdes

### Tabla de Campañas
- Fecha, nombre campaña, canal
- Impresiones, alcance, clicks
- CTR, Gasto, CPC, CPM
- Preventas, conversión, estado

## Usabilidad

✅ Métricas claras y legibles
✅ Información jerárquica (grande = importante)
✅ Colores consistentes
✅ Espaciado uniforme
✅ Botones claramente reconocibles
✅ Filtros accesibles
✅ Tabla scrolleable sin problemas
✅ Estados visuales evidentes
