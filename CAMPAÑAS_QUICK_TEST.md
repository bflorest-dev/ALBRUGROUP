/* CAMPAIGNED SELECTS - QUICK TEST CHECKLIST

# ✅ CORRECCIONES APLICADAS

## ⚡ ANTES DE EMPEZAR

Ejecuta en terminal:
```bash
npm run dev
```

Abre DevTools (F12) → console tab
Navega a Community → Campañas

---

## 🧪 TEST CHECKLIST

### ✓ STEP 1: Check Console Logs (5 seg)
```
Deberías ver en console:

[CampaignService] GET /cuentas-publicitarias Authorization: Bearer *****
[CampaignService] GET /proveedores Authorization: Bearer *****
[CampaignService] Cuentas fetched: Array(...)
[CampaignService] Proveedores fetched: Array(...)
```

❌ Si NO ves estos logs:
- Espera 3-5 seg (puede estar cargando)
- Si aún no aparecen → check Network tab

---

### ✓ STEP 2: Check Network Requests
1. DevTools → Network tab
2. Busca estas requests:
   - GET /api/leads/cuentas-publicitarias
   - GET /api/leads/proveedores

Verifica:
- Status: 200 ✅
- Headers → Authorization: Bearer eyJ... ✅
- Response: debe tener array de objetos con id: number ✅

---

### ✓ STEP 3: Check Selects Render
Deberías ver:

```
Cuentas Publicitarias *
┌─────────────────────────────────────────┐
│ ☑ 1001 - Blue Sky                       │
│ ☐ 1002 - Creative Agency                │
└─────────────────────────────────────────┘

Proveedores *
┌─────────────────────────────────────────┐
│ ☑ Telefónica Perú                       │
│ ☐ Entel                                 │
└─────────────────────────────────────────┘
```

❌ Si ves "No hay opciones disponibles":
- Section 3 below: TROUBLESHOOTING

---

### ✓ STEP 4: Try Selecting Options
1. Click en checkbox de Proveedor extra
2. Desselecciona uno de Cuentas
3. Verifica que los checkboxes funcionan

---

### ✓ STEP 5: Try Crear Campaña
1. Llena campos:
   - Nombre: "Test Campaign 1"
   - WhatsApp: "+51999999999"
2. Keep Cuentas/Proveedores seleccionados
3. Click "Crear Campaña"

Deberías ver:
- console: `[CampaignService] Campaign created: {...}`
- Network: POST /api/leads/campanas → Status 201
- UI: Success message

❌ Si fails:
- Check console errors
- Check Network response

---

## 🔴 TROUBLESHOOTING

### Problem: "No hay opciones disponibles"

#### Check 1: Are HTTP requests fired?
```
💻 Open DevTools Console
Look: [CampaignService] logs?

NO → frontend error, check console errors above
YES → continue to Check 2
```

#### Check 2: Did requests succeed?
```
💻 DevTools → Network tab
Filter: cuentas-publicitarias

Response Status?

200 → go to Check 3
401 → JWT expired, re-login
403 → user role issue
0   → network error, check backend
500 → backend error
```

#### Check 3: Is response data present?
```
💻 DevTools Network → cuentas-publicitarias request → Response tab

Should show:
[
  {
    "id": 1,
    "numeroCuenta": "1001",
    "nombreCuenta": "Blue Sky",
    "activo": true
  },
  ...
]

NO DATA → backend not returning data
PARSE ERROR → malformed response
```

#### Check 4: Is localStorage key correct?
```
💻 DevTools Console:
localStorage.getItem('auth_token')

Result?
null → Not logged in, re-login
"eyJ..." → OK continue

If getting null but page loads:
- Maybe cookie-based auth instead
- Check other auth storage locations
```

---

## 📋 What Changed

3 files fixed:

1. **campaign.ts**
   - Changed: `id: string → number`
   - Why: Backend returns id: number

2. **campaignService.ts**
   - Removed: `normalizeLeadsPath()` (redundant)
   - Simplified: paths from '/api/leads/X' → '/X'
   - Added: console.debug logs for debugging

3. **FormCampaign.tsx**
   - Changed: `id: c.id → String(c.id)`
   - Changed: label more descriptive
   - Why: MultiSelect expects id: string

---

## ✅ SUCCESS INDICATORS

All of these should be ✅:

```
✓ [CampaignService] logs visible in console
✓ Network requests return 200
✓ Response data contains id: number
✓ Selects populate with options (not "No hay opciones")
✓ Can click checkboxes
✓ Can submit form
✓ POST request creates campaign successfully
✓ No TypeScript errors in console
✓ No Network errors (red status codes)
```

---

## 🚀 READY TO GO

If all ✓ above:
→ Campañas module READY FOR PRODUCTION ✅

If any ❌:
→ Use TROUBLESHOOTING section above

---

Generated: 28 Mar 2026 | Status: All fixes applied + build successful
