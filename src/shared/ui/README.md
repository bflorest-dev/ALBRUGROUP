# Design System - Reglas de Uso

## 🎯 **Regla de Overrides**

### ✅ **className PERMITIDO (layout only)**
```tsx
// ✅ Spacing y positioning
<Button variant="default" className="mt-4 ml-2" />
<Badge variant="success" className="absolute top-2 right-2" />

// ✅ Layout containers
<div className="grid gap-4 md:grid-cols-2" />
```

### ❌ **className PROHIBIDO (visual styling)**
```tsx
// ❌ Colores - usar variantes
<Button className="bg-red-500 text-white" />

// ❌ Tipografía - usar variantes
<Button className="text-lg font-bold" />

// ❌ Tamaños internos - usar size prop
<Button className="px-8 py-4" />
```

## 🧩 **Regla de Duplicación**

Si repites el mismo patrón 2+ veces:
```tsx
// ❌ Duplicación
<div className="grid gap-4 md:grid-cols-2">
<div className="grid gap-4 md:grid-cols-2">
```

👉 **Crear variante cva:**
```tsx
// ✅ Centralizado
const gridVariants = cva('grid gap-4', {
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
    }
  }
});
```

## 🚨 **Señales de Alerta**

**Detente si ves:**
- Uso frecuente de `className` para "arreglar" estilos
- Necesidad constante de variantes nuevas sin control
- El DS no cubre casos reales del proyecto

👉 **Significa que el DS necesita ajuste, no workarounds**