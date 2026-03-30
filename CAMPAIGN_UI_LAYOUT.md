# 🎨 UI Layout - Componentes de Campañas

## Diagrama Visual de la UI

```
╔════════════════════════════════════════════════════════════════════════════╗
║                         PANEL COMMUNITY                                    ║
║                                                                             ║
║  ┌──────────────────────────────────────────────────────────────────────┐  ║
║  │                                                                      │  ║
║  │  [ Campañas ] [ Cuentas ] [ Planes ] [ Promociones ] [ Proveedores]  │  ║
║  │  [ Zonas ]                                                            │  ║
║  │                                                                      │  ║
║  └──────────────────────────────────────────────────────────────────────┘  ║
║                                                                             ║
║  ┌──────────────────────────────────────────────────────────────────────┐  ║
║  │                     🟢 SECCIÓN CAMPAÑAS                             │  ║
║  │                                                                      │  ║
║  │  ┌────────────────────────────────────────────────────────────────┐ │  ║
║  │  │ ✅ Campaña creada exitosamente                                │ │  ║
║  │  │ (o ❌ Error al crear... si hay fallo)                        │ │  ║
║  │  └────────────────────────────────────────────────────────────────┘ │  ║
║  │                                                                      │  ║
║  │  ═══════════════════════════════════════════════════════════════  │  ║
║  │                          FORMULARIO                                │  ║
║  │  ═══════════════════════════════════════════════════════════════  │  ║
║  │                                                                      │  ║
║  │  Nombre *                                                             │  ║
║  │  ┌─────────────────────────────────────────────────────────────────┐ │  ║
║  │  │ [Escribe nombre de campaña...                                │  │  ║
║  │  └─────────────────────────────────────────────────────────────────┘ │  ║
║  │  ⚠️ El nombre es requerido (si está vacío)                         │  ║
║  │                                                                      │  ║
║  │  Número WhatsApp *                                                    │  ║
║  │  ┌─────────────────────────────────────────────────────────────────┐ │  ║
║  │  │ [+57 3001234567                                               │  │  ║
║  │  └─────────────────────────────────────────────────────────────────┘ │  ║
║  │  ⚠️ El número es requerido (si está vacío)                        │  ║
║  │                                                                      │  ║
║  │  Cuentas Publicitarias *                                              │  ║
║  │  ┌─────────────────────────────────────────────────────────────────┐ │  ║
║  │  │ ☑️ Google Ads Corp           (selected)                      │ │  ║
║  │  │ ☐ Facebook Business          (unselected)                    │ │  ║
║  │  │ ☐ TikTok Ads Account                                         │ │  ║
║  │  │ ☑️ LinkedIn Campaign           (selected)                     │ │  ║
║  │  │ ☐ Twitter Advertising                                        │ │  ║
║  │  │                                                               │ │  ║
║  │  │ (scrollable if many items)                                   │ │  ║
║  │  └─────────────────────────────────────────────────────────────────┘ │  ║
║  │  ⚠️ Debes seleccionar al menos una cuenta (if empty)            │  ║
║  │                                                                      │  ║
║  │  Proveedores *                                                        │  ║
║  │  ┌─────────────────────────────────────────────────────────────────┐ │  ║
║  │  │ ☐ Agencia Digital XYZ         (unselected)                   │ │  ║
║  │  │ ☑️ Marketing Plus Inc          (selected)                    │ │  ║
║  │  │ ☐ Creative Studio                                            │ │  ║
║  │  │ ☑️ Growth Hacker Pro            (selected)                    │ │  ║
║  │  │                                                               │ │  ║
║  │  │ (scrollable if many items)                                   │ │  ║
║  │  └─────────────────────────────────────────────────────────────────┘ │  ║
║  │  ⚠️ Debes seleccionar al menos un proveedor (if empty)         │  ║
║  │                                                                      │  ║
║  │  ┌────────────────────────────────────────────────────────────────┐ │  ║
║  │  │               [ ✅ Crear Campaña ]                           │ │  ║
║  │  │   (o [ ⏳ Creando campaña... ] mientras se envía)             │ │  ║
║  │  │   (o [ 🚫 Crear Campaña (disabled) ] si loading/submitting)  │ │  ║
║  │  └────────────────────────────────────────────────────────────────┘ │  ║
║  │                                                                      │  ║
║  └──────────────────────────────────────────────────────────────────────┘  ║
║                                                                             ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## Estados del Interfaz

### Estado 1: Cargando inicial (al abrir sección)

```
┌─────────────────────────────────────────┐
│ Cuentas Publicitarias *                 │
│ ┌─────────────────────────────────────┐ │
│ │ Cargando...                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Proveedores *                           │
│ ┌─────────────────────────────────────┐ │
│ │ Cargando...                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [ Crear Campaña (disabled) ]            │
└─────────────────────────────────────────┘
```

### Estado 2: Form válido (ready to submit)

```
┌─────────────────────────────────────────┐
│ Nombre *                                │
│ ┌─────────────────────────────────────┐ │
│ │ Mi Campaña de Primavera          │ │ ✅
│ └─────────────────────────────────────┘ │
│                                         │
│ Número WhatsApp *                       │
│ ┌─────────────────────────────────────┐ │
│ │ +57 3105551234                      │ │ ✅
│ └─────────────────────────────────────┘ │
│                                         │
│ Cuentas Publicitarias * (2 seleccionadas) │
│ ┌─────────────────────────────────────┐ │
│ │ ☑️ Google Ads                        │ │
│ │ ☑️ Facebook Business                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Proveedores * (1 seleccionado)          │
│ ┌─────────────────────────────────────┐ │
│ │ ☑️ Marketing Plus Inc               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [ ✅ Crear Campaña (enabled) ]          │
└─────────────────────────────────────────┘
```

### Estado 3: En envío (submitting)

```
┌─────────────────────────────────────────┐
│                                         │
│  ... (formulario igual que Estado 2)    │
│                                         │
│ [ ⏳ Creando campaña... (disabled) ]    │
│                                         │
│  • Button deshabilitado (no-repeat)     │
│  • Inputs se pueden editar pero es       │
│    mala UX (ideal: deshabilitar todos)   │
│                                         │
└─────────────────────────────────────────┘
```

### Estado 4: Éxito (success response)

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ ✅ Campaña creada exitosamente      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Nombre *                                │
│ ┌─────────────────────────────────────┐ │
│ │                                   │ │ (RESET/EMPTY)
│ └─────────────────────────────────────┘ │
│                                         │
│ ... (todos los campos resetean)         │
│                                         │
│ [ ✅ Crear Campaña ]                   │
└─────────────────────────────────────────┘
```

### Estado 5: Error (failure response)

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ ❌ Error del servidor (status: 500)│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Nombre *                                │
│ ┌─────────────────────────────────────┐ │
│ │ Mi Campaña de Primavera          │ │
│ └─────────────────────────────────────┘ │
│ (datos se mantienen para corrección)    │
│                                         │
│  ... (otros campos igual)               │
│                                         │
│ [ ✅ Crear Campaña ] (reenabled)       │
│ (usuario puede corregir y reintentar)  │
└─────────────────────────────────────────┘
```

### Estado 6: Validación fallida (client-side)

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ ⚠️ Por favor completa todos los     │ │
│ │    campos requeridos                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Nombre *                                │
│ ┌─────────────────────────────────────┐ │ ❌ ERROR
│ │ [vacio] ~~~ with border-red ~      │ │
│ └─────────────────────────────────────┘ │
│ ⚠️ El nombre es requerido               │
│                                         │
│ Número WhatsApp *                       │
│ ┌─────────────────────────────────────┐ │
│ │ +57 310...                          │ │ ✅
│ └─────────────────────────────────────┘ │
│                                         │
│ Cuentas Publicitarias *                 │
│ ┌─────────────────────────────────────┐ │ ⚠️ WARNING
│ │ ☐ Google Ads                        │ │
│ │ ☐ Facebook Business                │ │
│ └─────────────────────────────────────┘ │
│ Selecciona al menos uno                 │
│                                         │
│ [ ✅ Crear Campaña ] (enabled)          │
└─────────────────────────────────────────┘
```

---

## Estilos y Colores

```javascript
// Alert/Message styles
Success: backgroundColor: '#d4edda', color: '#155724'
Error:   backgroundColor: '#f8d7da', color: '#721c24'
Warning: backgroundColor: '#fff3cd', color: '#856404'

// Input styles
Normal:  border: '1px solid #ccc', borderRadius: 4, padding: 8
Error:   border: '2px solid #dc3545' (cuando hay validación fallida)
Loading: background: '#f9f9f9'

// Button styles
Enabled:  background: '#007bff', color: '#fff', cursor: 'pointer', opacity: 1
Disabled: background: '#ccc', cursor: 'not-allowed', opacity: 0.7

// MultiSelect container
max-height: 200px
overflowY: 'auto'
border-radius: 4px
padding: 8px
checklist items with margin-bottom: 8px
```

---

## Transiciones de Estado

```
DEFAULT
  ├─ User fills form
  ├─ All validations pass (client-side)
  └─ Ready to submit
      │
      ▼
SUBMITTING
  ├─ Button disabled
  ├─ Loading spinner
  └─ Prevent double-click
      │
      ├─ SUCCESS (201/200) ────► RESET
      │                          └─ Clear all fields
      │                          └─ Show success message
      │                          └─ Ready for next entry
      │
      └─ ERROR (4xx/5xx) ────► ERROR STATE
                              ├─ Keep field data
                              ├─ Show error message
                              ├─ Enable button
                              └─ User can retry/edit

VALIDATION ERROR (pre-submit)
  ├─ Field-specific error messages
  ├─ Global warning message
  └─ Button stays enabled (user can fix)
```

---

## Component Hierarchy (React)

```
PaginaCommunity
└── (when activeSection === 'campanas')
    └── CampaignSection [Container]
        │ • useCampaignForm hook
        │ • State management
        │ • Data loading
        │
        └── FormCampaign [Presentation]
            ├── GlobalMessage [Alert]
            │   └─ Success/Error message
            │
            ├── Input fields [from shared/ui/entrada] or simple <input>
            │   ├─ nombre
            │   ├─ numeroWhatsapp
            │   └─ Error messages
            │
            ├── MultiSelect [from shared/ui/multiselect]
            │   ├─ Cuentas (con valores del backend)
            │   ├─ Proveedores (con valores del backend)
            │   └─ Error messages
            │
            └── Submit Button
                └─ Disabled state, loading text
```

---

## Interacción del Usuario (Happy Path)

```
1. Usuario entra a PaginaCommunity
   └─ activeSection = 'campanas'
   └─ CampaignSection monta
   └─ useCampaignForm loadData() → fetch cuentas + proveedores
   └─ MultiSelects muestran "Cargando..."

2. Backend responde (200)
   └─ MultiSelects llenan con datos
   └─ User ve opciones para seleccionar

3. Usuario llena formulario
   ├─ Escribe nombre: "Campaña Q2"
   ├─ Escribe WhatsApp: "+57 310..."
   ├─ Selecciona cuentas: [Google Ads, Facebook]
   ├─ Selecciona proveedores: [Marketing Plus]
   └─ Campos se validan en tiempo real (error messages desaparecen)

4. usuario hace click en "Crear Campaña"
   └─ handleSubmit()
   ├─ validateForm() → pass ✅
   ├─ submitting = true
   ├─ Button se deshabilita
   ├─ Button muestra "⏳ Creando campaña..."
   └─ createCampaign(payload) → leadsHttp.post()

5. Backend responde (201)
   └─ Hook recibe success
   ├─ globalMessage = '✅ Campaña creada exitosamente'
   ├─ resetForm()
   ├─ submitting = false
   ├─ Button se habilita
   └─ Formulario vacío listo para siguiente entrada

6. (Opcional) usuario crea otra campaña → vuelve a paso 3
```

---

## Interacción del Usuario (Error Path)

```
1-3. (igual que happy path)

4. Usuario hace click en "Crear Campaña"
   └─ handleSubmit()
   ├─ validateForm() → FAIL ❌ (nombre vacío)
   ├─ setErrors({ nombre: 'El nombre es requerido' })
   ├─ setGlobalMessage('⚠️ Por favor completa...')
   └─ NO se envía al backend

5a. Usuario corrige nombre → error desaparece
    └─ handleInputChange() → setErrors(prev => ({ ...prev, nombre: undefined }))

5b. Usuario hace click en "Crear Campaña" de nuevo → happy path 4-6

---

OR

5. Backend responde (500)
   ├─ Catch error
   ├─ status = 500
   ├─ message = '💥 Error del servidor'
   ├─ globalMessage = '❌ Error del servidor'
   ├─ submitting = false
   ├─ Button se habilita
   └─ Form data se mantiene para retry

6. Usuario puede:
   ├─ Hacer click "Crear Campaña" de nuevo (retry)
   ├─ O editar campos y reintentar
```

---

**Última actualización**: 2026-03-28
**Status**: 🟢 UI Complete & Ready for Integration
