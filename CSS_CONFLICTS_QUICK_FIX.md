# Quick Reference: CSS Conflicts Fix Guide

## 🎯 Acciones Inmediatas (Copiar & Pegar)

### 1️⃣ URGENTE: Refactorizar `.section-header`

#### ApplicantsDashboard
**Archivo:** `src/features/RRHH/pages/ApplicantsDashboard.tsx`
```tsx
// ANTES
<div className="section-header">

// DESPUÉS  
<div className="applicants-section-header">
```

**Archivo:** `src/features/RRHH/pages/ApplicantsDashboard.css`
```css
/* ANTES */
.section-header {
  display: flex;
  ...
}

/* DESPUÉS */
.applicants-section-header {
  display: flex;
  ...
}

/* Y actualizar media query */
@media (max-width: 768px) {
  .applicants-section-header {
    ...
  }
}
```

---

#### EmployeeDashboard
**Archivo:** `src/features/RRHH/pages/EmployeeDashboard.tsx`
```tsx
// Líneas 225, 689, 1390, 1500
// ANTES
<div className="section-header">

// DESPUÉS
<div className="employee-section-header">
```

**Archivo:** `src/features/RRHH/pages/EmployeeDashboard.css`
```css
/* Línea 227 - ANTES */
.section-header {
  display: flex;
  ...
}

/* DESPUÉS */
.employee-section-header {
  display: flex;
  ...
}

/* Línea 446 - Media query - ANTES */
@media (max-width: 768px) {
  .section-header {
    ...
  }
}

/* DESPUÉS */
@media (max-width: 768px) {
  .employee-section-header {
    ...
  }
}
```

---

#### HRDashboard
**Archivo:** `src/features/RRHH/components/HRDashboard.tsx`
```tsx
// Líneas 52, 67
// ANTES
<div className="section-header">

// DESPUÉS
<div className="hr-section-header">
```

**Archivo:** `src/features/RRHH/components/HRDashboard.css`
```css
/* ANTES */
.hr-section .section-header h3 {
  ...
}

/* DESPUÉS */
.hr-section .hr-section-header h3 {
  ...
}
```

---

#### AdvisorsSection (SUPERVISOR_GTR)
**Archivo:** `src/features/SUPERVISOR_GTR/components/AdvisorsSection.tsx`
```tsx
// Línea 186
// ANTES
<div className="section-header">

// DESPUÉS
<div className="advisors-section-header">
```

**Archivo:** `src/features/SUPERVISOR_GTR/pages/GTRDashboard.css`
```css
/* Línea 81 - ANTES */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

/* Línea 92 - ANTES */
.section-header h2 {
  margin: 0;
  font-size: 16px;
  ...
}

/* DESPUÉS */
.advisors-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.advisors-section-header h2 {
  margin: 0;
  font-size: 16px;
  ...
}
```

---

### 2️⃣ IMPORTANTE: Refactorizar `.dashboard-content`

#### ApplicantsDashboard
**Archivo:** `src/features/RRHH/pages/ApplicantsDashboard.tsx`
```tsx
// Líneas 303, 314
// ANTES
<main className="dashboard-content">

// DESPUÉS
<main className="applicants-dashboard-content">
```

**Archivo:** `src/features/RRHH/pages/ApplicantsDashboard.css`
```css
/* Línea 9 - ANTES */
.dashboard-content {
  flex: 1;
  padding: 12px;
  ...
}

/* DESPUÉS */
.applicants-dashboard-content {
  flex: 1;
  padding: 12px;
  ...
}

/* Línea 176 - Media query - ANTES */
@media (max-width: 768px) {
  .dashboard-content {
    padding: 16px;
    gap: 16px;
  }
}

/* DESPUÉS */
@media (max-width: 768px) {
  .applicants-dashboard-content {
    padding: 16px;
    gap: 16px;
  }
}
```

---

#### EmployeeDashboard
**Archivo:** `src/features/RRHH/pages/EmployeeDashboard.tsx`
```tsx
// Línea 1378
// ANTES
<main className="dashboard-content">

// DESPUÉS
<main className="employee-dashboard-content">
```

**Archivo:** `src/features/RRHH/pages/EmployeeDashboard.css`
```css
/* Línea 81 - ANTES */
.dashboard-content {
  flex: 1 1 auto;
  width: 100%;
  ...
}

/* DESPUÉS */
.employee-dashboard-content {
  flex: 1 1 auto;
  width: 100%;
  ...
}

/* Línea 436 - Media query - ANTES */
@media (max-width: 768px) {
  .dashboard-content {
    ...
  }
}

/* DESPUÉS */
@media (max-width: 768px) {
  .employee-dashboard-content {
    ...
  }
}
```

---

### 3️⃣ RÁPIDO: Unificar `.stats-grid`

**Seleccionar una definición y usar en ambas:**

**OPCIÓN A: Usar 16px en ambas**

`src/features/RRHH/pages/ApplicantsDashboard.css` (línea 27)
```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px; /* ✅ Ya está bien */
}
```

`src/features/RRHH/pages/EmployeeDashboard.css` (línea 101)
```css
/* ANTES */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

/* DESPUÉS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px; /* ← Cambiar de 20px a 16px */
}

/* Línea 442 - Media query */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  /* El gap se hereda de arriba, sin cambios necesarios */
}
```

---

### 4️⃣ PREVENTIVO: Renombrar `.dashboard-header`

**Archivo:** `src/features/RRHH/pages/EmployeeDashboard.tsx`
```tsx
// Línea 1335
// ANTES
<header className="dashboard-header">

// DESPUÉS
<header className="employee-dashboard-header">
```

**Archivo:** `src/features/RRHH/pages/EmployeeDashboard.css`
```css
/* Línea 484 - ANTES */
.dashboard-header {
  display: flex;
  align-items: center;
  ...
}

/* DESPUÉS */
.employee-dashboard-header {
  display: flex;
  align-items: center;
  ...
}

/* Línea 463, 469 - Media queries - ANTES */
@media (max-width: 768px) {
  .dashboard-header {
    ...
  }
}

/* DESPUÉS */
@media (max-width: 768px) {
  .employee-dashboard-header {
    ...
  }
}
```

---

### 5️⃣ BAJO PRIORIDAD: Verificar `.header-title`

**Usada en:**
- `src/features/RRHH/pages/EmployeeDashboard.tsx` línea 1345
- `src/features/SUPERVISOR_GTR/components/LeadsSection.tsx` línea 43

**Opción A: Dejar como está (bajo riesgo)**
Solo hay una definición, así que no hay conflicto actual.

**Opción B: Hacer específica (recomendado)**

LeadsSection.tsx:
```tsx
// ANTES
<div className="header-title">

// DESPUÉS
<div className="leads-header-title">
```

GTRDashboard.css:
```css
/* Agregar nueva clase */
.leads-header-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1F2937;
  white-space: nowrap;
}
```

---

## 📋 Checklist de Implementación

### Fase 1: Cambios de CódigoEstimado: 45 minutos)

- [ ] **ApplicantsDashboard.tsx**
  - [ ] Línea 303: `.dashboard-content` → `.applicants-dashboard-content`
  - [ ] Línea 314: `.dashboard-content` → `.applicants-dashboard-content`
  - [ ] Línea 326: `.section-header` → `.applicants-section-header`

- [ ] **ApplicantsDashboard.css**
  - [ ] Línea 9: Cambiar definición de clase
  - [ ] Línea 27: Validar `.stats-grid` (16px está bien)
  - [ ] Línea 46: Cambiar definición de clase
  - [ ] Línea 55: Actualizar h2 selector
  - [ ] Línea 176: Actualizar media query
  - [ ] Línea 185: Actualizar media query
  - [ ] Línea 199: Media query OK
  - [ ] Línea 210: Actualizar media query

- [ ] **EmployeeDashboard.tsx**
  - [ ] Línea 225: `.section-header` → `.employee-section-header`
  - [ ] Línea 680: `.stats-grid` (OK, no cambio)
  - [ ] Línea 689: `.section-header` → `.employee-section-header`
  - [ ] Línea 1335: `.dashboard-header` → `.employee-dashboard-header`
  - [ ] Línea 1345: `.header-title` (OK u opcional)
  - [ ] Línea 1378: `.dashboard-content` → `.employee-dashboard-content`
  - [ ] Línea 1390: `.section-header` → `.employee-section-header`
  - [ ] Línea 1500: `.section-header` → `.employee-section-header`

- [ ] **EmployeeDashboard.css**
  - [ ] Línea 81: Cambiar definición de clase
  - [ ] Línea 101: Cambiar gap de 20px a 16px
  - [ ] Línea 227: Cambiar definición de clase
  - [ ] Línea 237: Actualizar h2 selector
  - [ ] Línea 436: Actualizar media query
  - [ ] Línea 442: Media query OK
  - [ ] Línea 446: Actualizar media query
  - [ ] Línea 463: Actualizar media query
  - [ ] Línea 469: Actualizar media query
  - [ ] Línea 474: Actualizar media query (header-title)
  - [ ] Línea 478: Actualizar media query
  - [ ] Línea 484: Cambiar definición de clase
  - [ ] Línea 498: header-title OK

- [ ] **HRDashboard.tsx**
  - [ ] Línea 52: `.section-header` → `.hr-section-header`
  - [ ] Línea 67: `.section-header` → `.hr-section-header`

- [ ] **HRDashboard.css**
  - [ ] Línea 28: Actualizar selector

- [ ] **AdvisorsSection.tsx**
  - [ ] Línea 186: `.section-header` → `.advisors-section-header`

- [ ] **GTRDashboard.css**
  - [ ] Línea 81: Cambiar definición de clase
  - [ ] Línea 92: Actualizar h2 selector

- [ ] **LeadsSection.tsx** (opcional)
  - [ ] Línea 43: `.header-title` → `.leads-header-title` (si se decide)

### Fase 2: Pruebas (20 minutos)

- [ ] Ejecutar validador: `node scripts/validate-css-conflicts.js`
- [ ] Probar ApplicantsDashboard en browser
- [ ] Probar EmployeeDashboard en browser
- [ ] Probar HRComponent en browser
- [ ] Probar ResponsiveDesign (mobile)
- [ ] Verificar que no hay efectos secundarios

### Fase 3: Documentación (10 minutos)

- [ ] Actualizar README con convenciones CSS
- [ ] Agregar regla a .stylelintrc
- [ ] Crear guía de nomenclatura CSS

---

## 🔗 Archivos de Referencia

- **Análisis completo:** [CSS_CONFLICTS_ANALYSIS.json](./CSS_CONFLICTS_ANALYSIS.json)
- **Reporte detallado:** [CSS_CONFLICTS_DETAILED_REPORT.md](./CSS_CONFLICTS_DETAILED_REPORT.md)
- **Script de validación:** `scripts/validate-css-conflicts.js`

---

## ⚠️ Advertencias

1. **Cambios de scope global:** Todas estas clases son globales, así que los cambios afectarán a toda la aplicación. No hay riesgo de scope isolation.

2. **Orden de carga:** Después de cambiar, verificar que los CSS se cargan en el orden correcto (depende de tu bundler).

3. **Media queries:** Asegúrate de actualizar todas las media queries relacionadas.

4. **Tests:** Si hay tests de snapshot visuales, necesitarán actualizarse.

---

## 📞 Soporte

Si después de hacer estos cambios ves estilos rotos:

1. Revisa que los nombres de clase estén sincronizados entre TSX y CSS
2. Busca por la clase anterior en todo el proyecto (grep: `.dashboard-content`)
3. Verifica el orden de carga de CSS en tu bundler
4. Usa DevTools para ver qué CSS está aplicándose finalmente

---

**Última actualización:** 10 de Marzo de 2026
