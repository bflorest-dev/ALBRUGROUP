# ⚙️ FASE 0: PREPARACIÓN FSD + ATOMIC DESIGN EN ESPAÑOL

**Arquitectura:** FSD Puro en Español + Atomic Design  
**Duración:** 2-3 horas  
**Objetivo:** Crear estructura base SIN cambiar código

---

## ✅ PRE-FASE 0 CHECKLIST

```
□ Git status: limpio (sin cambios sin commit)
□ npm run build: PASA (0 errores)
□ Node modules: existe
□ Terminal: PowerShell en c:\Users\LEONARDO\ALBRUGROUP\ALBRUGROUP-frontend
```

---

## 📋 PASO 1: CREAR BRANCH GIT

```bash
git checkout -b feat/fsd-refactor-espanol
git push -u origin feat/fsd-refactor-espanol

# Verificar
git branch -v
# Output: * feat/fsd-refactor-espanol ... [hash]
```

---

## 🏗️ PASO 2: CREAR CARPETAS (SIN MOVER ARCHIVOS)

**REGLA CRÍTICA:** Solo crear carpetas vacías primero

### 2.1 PowerShell Script para crear directories

```powershell
# EN: C:\Users\LEONARDO\ALBRUGROUP\ALBRUGROUP-frontend

cd src

# APP (mantener como está)
# Verificar que exista, si no crear:
if (!(Test-Path app)) { mkdir app; mkdir app/proveedores }

# PAGINAS (NEW)
mkdir paginas
mkdir paginas/login
mkdir paginas/admin
mkdir paginas/asesor-backoffice
mkdir paginas/asesor-ventas
mkdir paginas/capacitacion
mkdir paginas/community
mkdir paginas/desarrollador
mkdir paginas/reclutamiento
mkdir paginas/rrhh
mkdir paginas/supervisor-gtr

# WIDGETS (NEW)
mkdir widgets
mkdir widgets/barra-lateral/ui
mkdir widgets/encabezado/ui
mkdir widgets/tabla-postulantes/ui
mkdir widgets/tabla-empleados/ui
mkdir widgets/panel-leads/ui
mkdir widgets/panel-tipificacion/ui
mkdir widgets/community/ui
mkdir widgets/supervisor-gtr/ui

# CARACTERISTICAS (NEW)
mkdir caracteristicas
mkdir caracteristicas/autenticacion/api
mkdir caracteristicas/autenticacion/modelo
mkdir caracteristicas/autenticacion/ui
mkdir caracteristicas/registrar-postulante/api
mkdir caracteristicas/registrar-postulante/modelo
mkdir caracteristicas/registrar-postulante/ui
mkdir caracteristicas/editar-postulante/ui
mkdir caracteristicas/registrar-empleado/api
mkdir caracteristicas/registrar-empleado/modelo
mkdir caracteristicas/registrar-empleado/ui
mkdir caracteristicas/baja-empleado/ui
mkdir caracteristicas/gestion-leads/api
mkdir caracteristicas/gestion-leads/modelo
mkdir caracteristicas/gestion-leads/ui
mkdir caracteristicas/community/hooks
mkdir caracteristicas/community/ui
mkdir caracteristicas/admin/hooks
mkdir caracteristicas/admin/ui

# ENTIDADES (REORGANIZAR - algunos datos ya existen)
# Crear estructura completa por si falta
mkdir entidades/postulante/modelo
mkdir entidades/postulante/ui
mkdir entidades/empleado/modelo
mkdir entidades/empleado/ui
mkdir entidades/lead/modelo
mkdir entidades/lead/ui
mkdir entidades/tipificacion/modelo
mkdir entidades/tipificacion/ui
mkdir entidades/asesor/modelo
mkdir entidades/usuario/modelo
mkdir entidades/usuario/ui

# COMPARTIDO (REORGANIZAR - algunos datos ya existen)
mkdir compartido/api
mkdir compartido/ganchos
mkdir compartido/lib
mkdir compartido/tipos
mkdir compartido/configuracion
mkdir compartido/validacion
mkdir compartido/ui/boton
mkdir compartido/ui/entrada
mkdir compartido/ui/insignia
mkdir compartido/ui/selector
mkdir compartido/ui/modal
mkdir compartido/ui/tabla
mkdir compartido/ui/paginacion
mkdir compartido/ui/esqueleto
mkdir compartido/ui/notificacion
mkdir compartido/ui/alerta
mkdir compartido/ui/tarjeta
mkdir compartido/ui/girador
mkdir compartido/ui/botonIcono
mkdir compartido/ui/divisor
mkdir compartido/ui/selectorFecha
mkdir compartido/ui/panelMetricas
mkdir compartido/ui/tarjetaEstadistica
mkdir compartido/ui/limitadorErrores
mkdir compartido/ui/accesoRol

cd ..
```

### 2.2 Ejecutar en PowerShell

```powershell
# Copiar y pegar TODO el script arriba directamente en terminal
# O guardar en archivo .ps1 y ejecutar:
# .\crear_estructura.ps1
```

**Verificar creación:**
```powershell
dir src
# Debe mostrar: app, paginas, widgets, caracteristicas, entidades, compartido
```

---

## 🔧 PASO 3: CREAR .gitkeep EN CARPETAS CLAVE

```powershell
# EN: src/

# PAGINAS
"" | Out-File paginas/login/.gitkeep
"" | Out-File paginas/admin/.gitkeep
"" | Out-File paginas/asesor-backoffice/.gitkeep
"" | Out-File paginas/asesor-ventas/.gitkeep
"" | Out-File paginas/capacitacion/.gitkeep
"" | Out-File paginas/community/.gitkeep
"" | Out-File paginas/desarrollador/.gitkeep
"" | Out-File paginas/reclutamiento/.gitkeep
"" | Out-File paginas/rrhh/.gitkeep
"" | Out-File paginas/supervisor-gtr/.gitkeep

# WIDGETS
"" | Out-File widgets/barra-lateral/ui/.gitkeep
"" | Out-File widgets/encabezado/ui/.gitkeep
"" | Out-File widgets/tabla-postulantes/ui/.gitkeep
"" | Out-File widgets/tabla-empleados/ui/.gitkeep
"" | Out-File widgets/panel-leads/ui/.gitkeep
"" | Out-File widgets/panel-tipificacion/ui/.gitkeep
"" | Out-File widgets/community/ui/.gitkeep
"" | Out-File widgets/supervisor-gtr/ui/.gitkeep

# CARACTERISTICAS
"" | Out-File caracteristicas/autenticacion/api/.gitkeep
"" | Out-File caracteristicas/autenticacion/modelo/.gitkeep
"" | Out-File caracteristicas/registrar-postulante/api/.gitkeep
"" | Out-File caracteristicas/registrar-postulante/modelo/.gitkeep
"" | Out-File caracteristicas/registrar-empleado/api/.gitkeep
"" | Out-File caracteristicas/registrar-empleado/modelo/.gitkeep
"" | Out-File caracteristicas/community/hooks/.gitkeep
"" | Out-File caracteristicas/admin/hooks/.gitkeep

# ENTIDADES
"" | Out-File entidades/postulante/modelo/.gitkeep
"" | Out-File entidades/postulante/ui/.gitkeep
"" | Out-File entidades/empleado/modelo/.gitkeep
"" | Out-File entidades/empleado/ui/.gitkeep
"" | Out-File entidades/lead/modelo/.gitkeep
"" | Out-File entidades/lead/ui/.gitkeep
"" | Out-File entidades/tipificacion/modelo/.gitkeep
"" | Out-File entidades/tipificacion/ui/.gitkeep
"" | Out-File entidades/asesor/modelo/.gitkeep
"" | Out-File entidades/usuario/modelo/.gitkeep
"" | Out-File entidades/usuario/ui/.gitkeep

# COMPARTIDO/UI
"" | Out-File compartido/ui/boton/.gitkeep
"" | Out-File compartido/ui/entrada/.gitkeep
"" | Out-File compartido/ui/insignia/.gitkeep
"" | Out-File compartido/ui/selector/.gitkeep
"" | Out-File compartido/ui/modal/.gitkeep
"" | Out-File compartido/ui/tabla/.gitkeep
"" | Out-File compartido/ui/paginacion/.gitkeep
"" | Out-File compartido/ui/esqueleto/.gitkeep
"" | Out-File compartido/ui/notificacion/.gitkeep
"" | Out-File compartido/ui/alerta/.gitkeep
"" | Out-File compartido/ui/tarjeta/.gitkeep
"" | Out-File compartido/ui/girador/.gitkeep
"" | Out-File compartido/ui/botonIcono/.gitkeep
"" | Out-File compartido/ui/divisor/.gitkeep
"" | Out-File compartido/ui/selectorFecha/.gitkeep
"" | Out-File compartido/ui/panelMetricas/.gitkeep
"" | Out-File compartido/ui/tarjetaEstadistica/.gitkeep
"" | Out-File compartido/ui/limitadorErrores/.gitkeep
"" | Out-File compartido/ui/accesoRol/.gitkeep
```

---

## 📖 PASO 4: CREAR README.md EN CADA CAPA

### 4.1 paginas/README.md

**Archivo:** `src/paginas/README.md`

```markdown
# Paginas

**Responsabilidad:** Páginas por rol del sistema

**Estructura:**
- login/ → Página de autenticación
- admin/ → Dashboard de administrador
- asesor-backoffice/ → Dashboard de asesor backoffice
- asesor-ventas/ → Dashboard de asesor de ventas
- capacitacion/ → Dashboard de capacitación
- community/ → Dashboard de community
- desarrollador/ → Dashboard de desarrollador
- reclutamiento/ → Dashboard de reclutamiento
- rrhh/ → Dashboard de RRHH
- supervisor-gtr/ → Dashboard de supervisor GTR

**Imports permitidos:**
- widgets/
- caracteristicas/
- entidades/
- compartido/

**Prohibido:**
- Importar de otras paginas
```

### 4.2 widgets/README.md

```markdown
# Widgets

**Responsabilidad:** Componentes grandes reutilizables

**Estructura:** {widget}/ui/Componente.tsx

**Ejemplos:**
- barra-lateral/ui/Sidebar.tsx
- encabezado/ui/Header.tsx

**Imports permitidos:**
- caracteristicas/
- entidades/
- compartido/

**Prohibido:**
- Importar de paginas
- Importar de otros widgets
```

### 4.3 caracteristicas/README.md

```markdown
# Características

**Responsabilidad:** Lógica de negocio específica

**Estructura:** {feature}/{api|modelo|ui}/

**Ejemplos:**
- autenticacion/api/auth.service.ts
- registrar-postulante/modelo/postulante.schemas.ts
- comunidad/ui/CampaignCard.tsx

**Imports permitidos:**
- caracteristicas/ (MISMA feature)
- entidades/
- compartido/

**Prohibido:**
- Importar de otras características (features diferentes)
- Importar de paginas
- Importar de widgets
```

### 4.4 entidades/README.md

```markdown
# Entidades

**Responsabilidad:** Dominio + UI específica de entidad

**Estructura:** {entidad}/{modelo|ui}/

**Ejemplos:**
- lead/modelo/lead.tipos.ts
- lead/ui/LeadCard.tsx
- postulante/modelo/postulante.tipos.ts

**Imports permitidos:**
- compartido/

**Prohibido:**
- Importar de caracteristicas
- Importar de paginas
- Importar de widgets
```

### 4.5 compartido/README.md

```markdown
# Compartido

**Responsabilidad:** UI genérica + Utils + Configuración

**Estructura:**
- ui/ → Componentes genéricos (Atomic Design)
- ganchos/ → Hooks reutilizables
- lib/ → Utilidades puras
- api/ → Cliente HTTP genérico
- tipos/ → Tipos compartidos
- configuracion/ → Constantes y rutas
- validacion/ → Esquemas genéricos

**Imports permitidos:**
- Ninguno (es independiente)

**Prohibido:**
- Importar de cualquier otra capa
```

---

## 🔗 PASO 5: ACTUALIZAR tsconfig.json (PATH ALIASES)

**Archivo:** `tsconfig.json`

Si NO tiene alias, agregar:

```json
{
  "compilerOptions": {
    "paths": {
      "@entidades/*": ["./src/entidades/*"],
      "@compartido/*": ["./src/compartido/*"],
      "@caracteristicas/*": ["./src/caracteristicas/*"],
      "@widgets/*": ["./src/widgets/*"],
      "@paginas/*": ["./src/paginas/*"]
    }
  }
}
```

**Verificar:**
```bash
cat tsconfig.json | grep -A 10 "paths"
```

---

## 🔗 PASO 6: ACTUALIZAR vite.config.ts (PATH ALIASES)

**Archivo:** `vite.config.ts`

```typescript
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@entidades': path.resolve(__dirname, 'src/entidades/'),
      '@compartido': path.resolve(__dirname, 'src/compartido/'),
      '@caracteristicas': path.resolve(__dirname, 'src/caracteristicas/'),
      '@widgets': path.resolve(__dirname, 'src/widgets/'),
      '@paginas': path.resolve(__dirname, 'src/paginas/'),
    },
  },
});
```

---

## 🧪 PASO 7: VALIDAR BUILD

```bash
npm run build
```

**Esperado:**
```
✓ tsc -b: 0 errores
✓ vite build: N módulos transformados
✓ Compilación exitosa
```

**SI FALLA:**
```
❌ DETENER AQUÍ
❌ Revisar errores
❌ NO continuar a FASE 1
```

---

## 📊 PASO 8: REVISAR ESTRUCTURA

```powershell
tree src /L 3
# O:
Get-ChildItem -Path src -Directory -Recurse | Format-Table FullName
```

Debe verse:
```
src/
├── app/
├── paginas/
├── widgets/
├── caracteristicas/
├── entidades/
└── compartido/
```

---

## 🎯 PASO 9: GIT COMMIT

```bash
git add .
git commit -m "FASE 0: Crear estructura FSD en español

- Crear carpetas: paginas, widgets, caracteristicas
- Reorganizar entidades y compartido
- Actualizar aliases (tsconfig + vite)
- Crear README en cada capa
- npm run build: PASS ✓
- Listo para FASE 1: Migrar paginas/"
```

**Push:**
```bash
git push origin feat/fsd-refactor-espanol
```

---

## ✅ CHECKLIST FASE 0 COMPLETADA

```
ESTRUCTURA:
□ src/paginas/ (10 subcarpetas)
□ src/widgets/ (8 subcarpetas)
□ src/caracteristicas/ (8+ subcarpetas)
□ src/entidades/ (6 subcarpetas)
□ src/compartido/ (7 subcarpetas)

CONFIGURACIÓN:
□ tsconfig.json: 5 path aliases
□ vite.config.ts: 5 resolve aliases

DOCUMENTACIÓN:
□ paginas/README.md
□ widgets/README.md
□ caracteristicas/README.md
□ entidades/README.md
□ compartido/README.md

VALIDACIÓN:
□ npm run build: PASS (0 errores)
□ npm run lint: PASS
□ Estructura de carpetas correcta

GIT:
□ Branch: feat/fsd-refactor-espanol
□ Commit realizado
□ Push completado
```

---

## 📝 RESUMEN

✅ **FASE 0 = SOLO ESTRUCTURA, NINGÚN CAMBIO DE CÓDIGO**

Las carpetas antiguas SIGUEN EXISTIENDO. No se eliminarán hasta FASE 6.

Próximo: **FASE 1 - Migrar paginas/**

---

*FASE 0: FSD en Español - Lista para ejecutar*
