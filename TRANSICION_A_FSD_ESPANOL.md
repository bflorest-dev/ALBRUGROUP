# ⚠️ ACTUALIZACIÓN ARQUITECTÓNICA: TRANSICIÓN A FSD ESPAÑOL

**Decisión:** Opción B - Feature-Sliced Design Puro en Español  
**Fecha:** 23 Marzo 2026  
**Efectivo desde:** AHORA

---

## 🔴 DOCUMENTOS OBSOLETOS (Descartados)

Los siguientes documentos quedan **INVÁLIDOS** y NO deben usarse:

```
❌ ARCHITECTURE_FINAL_VALIDATED.md       → Archivado
❌ ARQUITECTURA_ACLARACIONES_CRITICAS.md → Archivado
❌ FASE_0_PREPARACION.md                 → Archivado
```

**Razón:** Esos documentos describían Clean Architecture (Opción A).  
Hemos elegido FSD Español (Opción B).

---

## ✅ NUEVOS DOCUMENTOS (VÁLIDOS)

### 1. ARQUITECTURA_FSD_ESPANOL.md
- Estructura completa en español
- Capas: app → paginas → widgets → caracteristicas → entidades → compartido
- Entities CON UI integrada
- Rules de dependencias FSD

**Usar para:** Entender la arquitectura objetivo

### 2. FASE_0_FSD_ESPANOL.md
- Paso a paso para crear estructura base
- Crear carpetas
- Configurar aliases
- Validar build
- Git commit

**Usar para:** Ejecutar FASE 0

### 3. REGLAS_OPERACIONALES.md (SIGUE SIENDO VÁLIDO)
- Controles de seguridad
- Validación incremental
- Criterios de parada
- Logs obligatorios

**Usar para:** Control durante ejecución

---

## 📊 CAMBIOS CLAVE: Opción A → Opción B

| Aspecto | Opción A (descartada) | Opción B (ACTUAL) |
|--------|------|------|
| **Lenguaje** | Inglés (@core, @shared) | Español (@compartido, @entidades) |
| **Entities** | SIN UI (solo types) | CON UI (/ui/) |
| **Core layer** | ✅ Existe | ❌ NO existe |
| **Carpeta UI** | shared/ui/ | compartido/ui/ + entidades/*/ui/ |
| **Dependencias** | Estrictas (Clean Arch) | FSD puro |

---

## 🎯 ESTRUCTURA NUEVA (FSD Español)

```
src/
├── app/                 (Shell + routing)
├── paginas/             (Pages por rol) ← NEW
├── widgets/             (Componentes grandes) ← NEW
├── caracteristicas/     (Features + lógica) ← NEW
├── entidades/           (Dominio + UI) ← REORGANIZAR
└── compartido/          (Shared UI + utils) ← REORGANIZAR
```

---

## 🚀 PRÓXIMOS PASOS

### NOW - FASE 0:
1. Crear carpetas base
2. Configurar aliases
3. Validar build
4. Git commit

**Documento:** FASE_0_FSD_ESPANOL.md

### DESPUÉS - FASE 1-7:
5. Migrar paginas/ (step by step)
6. Migrar widgets/
7. Migrar caracteristicas/
8. Reorganizar entidades/
9. Reorganizar compartido/
10. Eliminar carpetas antiguas
11. Validación final

---

## ⚠️ REGLA CRÍTICA: Entities CON UI

**A diferencia de lo planeado antes:**

```typescript
// ✅ AHORA PERMITIDO:
entidades/lead/ui/LeadCard.tsx
entidades/postulante/ui/ApplicantForm.tsx
entidades/usuario/ui/RoleBadge.tsx

// PERO compartido/ui también existe para genéricos:
compartido/ui/boton/Boton.tsx
compartido/ui/entrada/Entrada.tsx
```

**REGLA:**
- `compartido/ui/` = Componentes **genéricos** (Button, Input, Card)
- `entidades/*/ui/` = Componentes **específicos de esa entidad** (LeadCard, ApplicantForm)

---

## ✅ CONFIRMACIÓN FINAL

¿Confirmas que entiendes estas diferencias antes de FASE 0?

1. **Lenguaje en español** en toda la estructura
2. **Entities TIENEN UI** (no es Clean Arch puro)
3. **FSD puro**, no Clean Architecture
4. **Dependencias FSD**, no estrictas como Clean Arch

**SÍ entiendo y confirmo** → Proceder a FASE 0

**NO, necesito aclaraciones** → Pedir ayuda

---

*Transición de Opción A a Opción B completada*  
*Documentos obsoletos archivados*  
*Nuevos documentos FSD listos*
