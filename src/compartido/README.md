# 🎨 Capa: COMPARTIDO (Shared)

**Responsabilidad:** UI genérica + Utilities + Configuración **independiente de dominio**.

## 📖 Descripción

La capa compartida contiene todo lo **reutilizable** en múltiples contextos:

- `api/` - Cliente HTTP genérico
- `ganchos/` - Hooks genéricos
- `lib/` - Funciones utilidad
- `tipos/` - Tipos comunes
- `configuracion/` - Constantes globales
- `validacion/` - Esquemas Zod/Yup
- `ui/` - Componentes genéricos (Atomic Design)

## 🔗 Relaciones

**Importa de:**
```
NADA - Compartido es independiente
```

**Puede ser importado de:**
```
✅ @paginas
✅ @widgets
✅ @caracteristicas
✅ @entidades
```

## 📁 Patrón de Archivo

```
compartido/
├── api/
│   └── clienteHttp.ts              ← Axios/Fetch wrapper
├── ganchos/
│   ├── usePaginacion.ts
│   ├── useManejadorError.ts
│   ├── useValidacionFormulario.ts
│   └── usePatronesComunes.ts
├── lib/
│   ├── formatearFecha.ts
│   ├── formatearMoneda.ts
│   ├── validacionTelefono.ts
│   ├── sanitizacion.ts
│   └── almacenamientoLocal.ts
├── tipos/
│   ├── comun.ts
│   ├── enums.ts
│   └── eventos.ts
├── configuracion/
│   ├── rutas.ts
│   ├── clavesConsulta.ts
│   └── constantes.ts
├── validacion/
│   └── esquemas.ts
└── ui/
    ├── atomos/                     ← Componentes atómicos
    │   ├── botones/
    │   ├── campos/
    │   ├── indicadores/
    │   ├── etiquetas/
    │   ├── iconos/
    │   ├── tipografia/
    │   └── espaciado/
    ├── moleculas/                  ← Componentes moleculares
    │   ├── tarjetas/
    │   ├── formularios/
    │   └── navegacion/
    └── organismos/                 ← Componentes orgánicos
        ├── modales/
        ├── navegadores/
        └── contenedores/
```

## ✅ Ejemplos de imports CORRECTOS

```typescript
// compartido/ui/atomos/botones/Boton.tsx
export interface BotonProps {
  texto: string;
  tipo?: 'primario' | 'secundario';
  onClick?: () => void;
}

export function Boton({ texto, tipo = 'primario', onClick }: BotonProps) {
  return <button className={`boton-${tipo}`}>{texto}</button>;
}
```

```typescript
// compartido/ganchos/usePaginacion.ts
export function usePaginacion(items: any[], pagePor: number = 10) {
  const [pagina, setPagina] = useState(1);
  const inicio = (pagina - 1) * pagePor;
  return {
    items: items.slice(inicio, inicio + pagePor),
    pagina,
    setPagina,
    totalPaginas: Math.ceil(items.length / pagePor),
  };
}
```

```typescript
// compartido/lib/formatearFecha.ts
export function formatearFecha(fecha: Date | string): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
```

```typescript
// compartido/tipos/comun.ts
export interface Paginacion {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export interface RespuestaApi<T> {
  exito: boolean;
  datos?: T;
  error?: string;
  codigo?: number;
}
```

## 📋 Contenido por carpeta

| Carpeta | Contenido |
|---------|----------|
| `api/` | Cliente HTTP, interceptores, configuración base |
| `ganchos/` | Hooks reutilizables (paginación, errores, validación) |
| `lib/` | Funciones utilidad (formateo, sanitización, validación) |
| `tipos/` | Tipos y enums comunes a toda la app |
| `configuracion/` | Rutas, claves API, constantes |
| `validacion/` | Esquemas Zod/Yup compartidos |
| `ui/atomos/` | Botones, inputs, labels (atomic design) |
| `ui/moleculas/` | Tarjetas, formularios, navegación |
| `ui/organismos/` | Modales, navegadores, contenedores |

## ⚠️ Validación

Cada archivo en compartido DEBE:
- ✅ Ser **100% reutilizable** (no específico de dominio)
- ✅ NO depender de características
- ✅ NO depender de entidades
- ✅ Exportar públicamente desde `index.ts`
- ✅ Tener **tipos genéricos** si aplica
- ✅ Funcionar en múltiples contextos

## 🚫 ANTI-PATRONES

```typescript
// ❌ PROHIBIDO: Lógica específica de postulante
export function formatearPostulante(p: Postulante) {}

// ❌ PROHIBIDO: Importar de características
import { useRegistrar } from '@caracteristicas/registrar-postulante';

// ❌ PROHIBIDO: Componente acoplado a un tipo específico
export function FormPostulante() {}

// ✅ CORRECTO: Genérico y reutilizable
export function formatearFecha(fecha: Date | string) {}

// ✅ CORRECTO: Componente agnóstico
export function Entrada({ valor, onChange }) {}

// ✅ CORRECTO: Hook genérico
export function usePaginacion<T>(items: T[]) {}
```

## 🔗 Re-exportación desde index

Para facilitar imports, cada subcarpeta debe exportar desde `index.ts`:

```typescript
// compartido/ui/atomos/botones/index.ts
export { Boton } from './Boton';
export type { BotonProps } from './Boton';

// Permite:
import { Boton } from '@compartido/ui/atomos/botones';
```

---

*Parte de FSD en Español - Ver: ARQUITECTURA_FSD_ESPANOL.md*
