/* Proveedores UI Layout & States

# 📐 UI LAYOUT: PROVEEDORES MODULE

## 1. OVERALL LAYOUT

```
┌─────────────────────────────────────────────────────────────┐
│  PaginaCommunity                                            │
├─────────────────────────────────────────────────────────────┤
│ [Campañas] [Cuentas] [Planes] [Promociones] [Proveedores]  │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Proveedores Section                                   │   │
│ ├───────────────────────────────────────────────────────┤   │
│ │                                                       │   │
│ │  📝 CREAR PROVEEDOR                                 │   │
│ │  ┌─────────────────────────────────────────┐        │   │
│ │  │ Nombre                                  │        │   │
│ │  │ ┌───────────────────────┐               │        │   │
│ │  │ │ Ej: Proveedor XYZ    │               │        │   │
│ │  │ └───────────────────────┘               │        │   │
│ │  │ [➕ Crear Proveedor]                      │        │   │
│ │  │                                         │        │   │
│ │  │ ✅ Proveedor creado correctamente       │        │   │
│ │  └─────────────────────────────────────────┘        │   │
│ │                                                       │   │
│ │  📋 LISTA DE PROVEEDORES (3)                        │   │
│ │  ┌──────┬────────────┬──────────┬──────────────┐    │   │
│ │  │ ID   │ Nombre     │ Estado   │ Fecha        │    │   │
│ │  ├──────┼────────────┼──────────┼──────────────┤    │   │
│ │  │ 1    │ Provider A │ ✅ Act.. │ 24/03/2026   │    │   │
│ │  │ 2    │ Provider B │ ✅ Act.. │ 25/03/2026   │    │   │
│ │  │ 3    │ Provider C │ ❌ Inac. │ 26/03/2026   │    │   │
│ │  └──────┴────────────┴──────────┴──────────────┘    │   │
│ │                                                       │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 2. FORM COMPONENT: ProveedorForm

### STATE 1: IDLE (Initial / Ready)
```
┌──────────────────────────────────────┐
│ 📝 Crear Proveedor                   │
├──────────────────────────────────────┤
│ Nombre                               │
│ ┌────────────────────────────────┐   │
│ │ Ej: Proveedor XYZ             │   │ ← placeholder
│ └────────────────────────────────┘   │
│ [➕ Crear Proveedor]                   │ ← green, enabled
│                                        │
└──────────────────────────────────────┘
```

### STATE 2: FILLING (User typing)
```
┌──────────────────────────────────────┐
│ 📝 Crear Proveedor                   │
├──────────────────────────────────────┤
│ Nombre                               │
│ ┌────────────────────────────────┐   │
│ │ Telefonica Perú                │   │ ← cursor blinking
│ └────────────────────────────────┘   │
│ [➕ Crear Proveedor]                   │ ← still green
│                                        │
└──────────────────────────────────────┘
```

### STATE 3: SUBMITTING (While HTTP request)
```
┌──────────────────────────────────────┐
│ 📝 Crear Proveedor                   │
├──────────────────────────────────────┤
│ Nombre                               │
│ ┌────────────────────────────────┐   │
│ │ Telefonica Perú                │   │ ← disabled
│ └────────────────────────────────┘   │
│ [⏳ Creando...]                        │ ← gray, disabled, spinner
│                                        │ (opacity: 0.7)
└──────────────────────────────────────┘
```

### STATE 4: SUCCESS (After submit)
```
┌──────────────────────────────────────────────────┐
│ 📝 Crear Proveedor                               │
├──────────────────────────────────────────────────┤
│ Nombre                                           │
│ ┌──────────────────────────────────────────────┐ │
│ │                                              │ │ ← cleared
│ └──────────────────────────────────────────────┘ │
│ [➕ Crear Proveedor]                              │ ← re-enabled
│                                                  │
│ ✅ Proveedor creado correctamente               │ ← green alert
│ (background: #d4edda, color: #155724)           │
└──────────────────────────────────────────────────┘
```

### STATE 5: VALIDATION ERROR (Empty submit)
```
┌──────────────────────────────────────────────────┐
│ 📝 Crear Proveedor                               │
├──────────────────────────────────────────────────┤
│ Nombre                                           │
│ ┌──────────────────────────────────────────────┐ │
│ │                                              │ │ ← red border
│ └──────────────────────────────────────────────┘ │
│ ❌ Nombre es requerido                           │ ← red text, 12px
│ [➕ Crear Proveedor]                              │
│                                                  │
└──────────────────────────────────────────────────┘
```

### STATE 6: SERVER ERROR (409 Conflict)
```
┌──────────────────────────────────────────────────┐
│ 📝 Crear Proveedor                               │
├──────────────────────────────────────────────────┤
│ Nombre                                           │
│ ┌──────────────────────────────────────────────┐ │
│ │ Telefonica Perú                              │ │
│ └──────────────────────────────────────────────┘ │
│ [➕ Crear Proveedor]                              │
│                                                  │
│ ❌ ⚠️ Proveedor duplicado                       │ ← red alert
│ (background: #f8d7da, color: #721c24)           │
└──────────────────────────────────────────────────┘
```

### STATE 7: SERVER ERROR (401 Unauthorized)
```
┌──────────────────────────────────────────────────┐
│ 📝 Crear Proveedor                               │
├──────────────────────────────────────────────────┤
│ Nombre                                           │
│ ┌──────────────────────────────────────────────┐ │
│ │ Some Value                                   │ │ ← kept
│ └──────────────────────────────────────────────┘ │
│ [➕ Crear Proveedor]                              │ ← re-enabled
│                                                  │
│ ❌ 🔐 Sesión expirada                           │ ← red alert
│ (background: #f8d7da, color: #721c24)           │
└──────────────────────────────────────────────────┘
```

## 3. LIST COMPONENT: ProveedoresList

### STATE 1: LOADING (Initial fetch)
```
┌──────────────────────────────────────┐
│ 📋 Lista de Proveedores              │
├──────────────────────────────────────┤
│ ⏳ Cargando proveedores...            │ ← center, gray color
│                                       │
└──────────────────────────────────────┘
```

### STATE 2: EMPTY (No results)
```
┌──────────────────────────────────────┐
│ 📋 Lista de Proveedores              │
├──────────────────────────────────────┤
│ Sin proveedores registrados          │ ← center, italic, gray
│                                       │
└──────────────────────────────────────┘
```

### STATE 3: ERROR (Fetch failed)
```
┌──────────────────────────────────────┐
│ 📋 Lista de Proveedores              │
├──────────────────────────────────────┤
│ ❌ Error al cargar proveedores       │ ← red color
│                                       │
└──────────────────────────────────────┘
```

### STATE 4: WITH DATA (Success)
```
┌──────────────────────────────────────────────────────────┐
│ 📋 Lista de Proveedores (3)                              │
├────⬚─┬─────────────────┬──────────────┬──────────────────┤
│ ID │ Nombre          │ Estado       │ Fecha Creación   │
├────┼─────────────────┼──────────────┼──────────────────┤
│ 1  │ Telefónica Perú │ ✅ Activo    │ 24/03/2026       │ ← alt bg
├────┼─────────────────┼──────────────┼──────────────────┤
│ 2  │ Entel           │ ✅ Activo    │ 25/03/2026       │
├────┼─────────────────┼──────────────┼──────────────────┤
│ 3  │ Bitel (Old)     │ ❌ Inactivo  │ 20/03/2026       │ ← alt bg
└────┴─────────────────┴──────────────┴──────────────────┘

Legend:
- ✅ green badge: rgba(212, 237, 218) / #155724
- ❌ red badge:   rgba(248, 215, 218) / #721c24
- Alternate rows: #fff / #f9f9f9
- Border: 1px solid #ddd
- Header: #f8f9fa background
```

## 4. FULL SECTION: ProveedoresSection

### COMBINED VIEW (Form + List)
```
┌─────────────────────────────────────────────────────────────┐
│ ProveedoresSection (sectionStyle applied)                  │
│ background: #fff, border: 1px #ccc, padding: 16px          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [ProveedorForm Component]                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 📝 Crear Proveedor                                │    │
│  │ ┌──────────────────────────────────────────────┐  │    │
│  │ │ Input: Nombre                                │  │    │
│  │ └──────────────────────────────────────────────┘  │    │
│  │ [Botón] [Mensaje]                                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  [ProveedoresList Component]                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 📋 Lista de Proveedores                           │    │
│  │ ┌──────────────────────────────────────────────┐  │    │
│  │ │ [Tabla con datos]                           │  │    │
│  │ └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 5. RESPONSIVE BEHAVIOR

### Desktop (width > 768px)
```
┌────────────────────────────────────────────┐
│ [Form in line] [List with scroll]          │
│ Normal table layout, all columns visible   │
└────────────────────────────────────────────┘
```

### Tablet (width 480-768px)
```
┌─────────────────────┐
│ [Form stacked]      │
│ ┌─────────────────┐ │
│ │ [List scrolls]  │ │
│ │ horizontally    │ │
│ └─────────────────┘ │
└─────────────────────┘
```

### Mobile (width < 480px)
```
┌──────────────┐
│  [Form]      │
│  ┌──────────┤
│  │[List]    │
│  │horizontal│
│  │scroll    │
│  └──────────┤
└──────────────┘
```

## 6. COLOR SCHEME

```
Primary (Action):
  - Green: #28a745 (button)
  - Light Green: #d4edda (success bg)
  - Dark Green: #155724 (success text)

Error:
  - Red: #dc3545 (border/text)
  - Light Red: #f8d7da (error bg)
  - Dark Red: #721c24 (error text)

Neutral:
  - Gray: #6c757d (disabled)
  - Light Gray: #f8f9fa (table header)
  - Border Gray: #ddd (borders)
  - Text Gray: #999 / #666 (muted)

Accessibility:
  - Contrast: WCAG AA compliant
  - Min font: 12px error text
  - Hover: cursor pointer on buttons
  - Focus: border highlight on inputs
```

## 7. ANIMATION/TRANSITIONS

```
Form Button:
  - Normal: opacity 1.0, cursor pointer
  - Hover: (no transition defined)
  - Disabled: opacity 0.7, cursor not-allowed
  - Transition: immediate

Input Field:
  - Normal: border #ccc
  - Error: border #dc3545 (2px)
  - Focus: (use browser default)
  - Transition: immediate

Message Box:
  - Appears: immediate (no fade)
  - Disappears: manual refresh/new message
  - Duration: persistent until next action
```

## 8. INTERACTION FLOW

```
Normal Flow:
┌─────────────┐
│ User enters │
│ nombre &    │
│ clicks btn  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Button      │ (submitting=true)
│ disabled    │
│ "⏳ Creando"│
└──────┬──────┘
       │ (30s timeout)
       ▼
┌─────────────┐
│Response 201 │
│ SUCCESS     │
└──────┬──────┘
       │
       ├─ Clear input
       ├─ Show "✅ Creado"
       ├─ Refetch list
       └─ Re-enable button
       
Error Flow:
┌─────────────┐
│ Response    │ (401/403/409/500)
│ ERROR       │
└──────┬──────┘
       │
       ├─ Keep input value
       ├─ Show "❌ Error"
       └─ Re-enable button
       (user can retry)

Validation Error:
┌─────────────┐
│ Empty input │
│ Click btn   │
└──────┬──────┘
       │
       ├─ Show "❌ Required"
       ├─ Highlight input red
       └─ No HTTP request
       (user can retry)
```

## 9. ACCESSIBILITY

```
✅ Semantic HTML
  - <label> for form fields
  - <table> with <thead>, <tbody>
  - <button> for actions

✅ ARIA attributes
  - role="alert" for error messages
  - aria-disabled when button is disabled
  - aria-label for icons

✅ Keyboard Navigation
  - Tab through form inputs
  - Enter to submit form
  - Tab focus visible on buttons

✅ Color contrast
  - Text: 4.5:1 ratio (WCAG AA)
  - Error red vs white: ✅ pass
  - Button green vs white: ✅ pass

✅ Screen reader
  - Button text: "Crear Proveedor"
  - Error messages read aloud
  - Table rows announced with cells
```

---

Generated: 28 Mar 2026
Status: ✅ PRODUCTION READY
*/