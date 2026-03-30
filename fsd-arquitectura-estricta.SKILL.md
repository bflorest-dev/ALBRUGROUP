---
name: fsd-arquitectura-estricta
description: 'Skill para validar y corregir arquitectura React+TS basada en Feature-Sliced Design (FSD) + Atomic Design, con reglas de dependencias estrictas y refactor automático/comprobación de imports.'
---

# fsd-arquitectura-estricta

> Puntos clave:
> - Capas solo importan hacia abajo.
> - No cross-layer up/same-layer.
> - `app > pages > widgets > features > entities > shared`.
> - UI con atómicos/moléculas/organismos/templates/pages.

## Objetivo

Asegurar la arquitectura del repositorio con reglas estrictas de FSD para proyectos React+TypeScript:

- Todas las carpetas deben pertenecer a una capa FSD válida.
- Todas las dependencias entre archivos deben respetar orden de capas.
- Si algo viola: corregir el import o reportar para refactor.

## Proceso paso a paso

1. Documentar la estructura actual de `src/`.
   - `app`, `paginas`, `widgets`, `caracteristicas`, `entidades`, `shared` y extra.
   - Detectar `src/api`, `src/hooks`, `src/services`, etc., fuera de `shared`.

2. Verificar reglas base de importación en todos los .ts/.tsx:
   - `app` puede importar `pages`, `widgets`, `features`, `entities`, `shared`.
   - `pages` puede importar `widgets`, `features`, `entities`, `shared`.
   - `widgets` puede importar `features`, `entities`, `shared`.
   - `features` puede importar `entities`, `shared`.
   - `entities` puede importar `shared`.
   - `shared` no importa ninguna capa superior.

3. Detectar violaciones y corregir automáticamente:
   - Reemplazar rutas de import que enmienden el orden de capas.
   - Si el archivo no existe, detener y reportar (no asumir reglas). 

4. Validar alias de tsconfig/vite:
   - `@app`, `@paginas`, `@widgets`, `@caracteristicas`, `@entidades`, `@shared`.
   - Base url `./`, paths a `./src/*`.

5. Atomic Design check (UI):
   - Revisar `shared/ui/boton`, `shared/ui/entrada`, etc.
   - Reasegurar componentes puros (sin lógica de negocio).

6. Build linter:
   - Ejecutar `npm run build`, `npm run lint`.
   - Por cada fallo FSD, reaplicar corrección.

## Calidad + criterios de aceptación

- ✅ Construcción completa sin errores TS (tsc + vite build)
- ✅ No hay errores de import: `Cannot find module '@shared/*'?` se evalúa con existencias.
- ✅ No hay usos directos de `@features` en `widgets/pages/app` u `@entities` en `features` (cuando está prohibido).
- ✅ Rutas actualizadas a alias compartidos donde procede.
- ✅ Documentación de decisiones de refactor en `REVIEW_NOTES.md` o similar.

## Comprobaciones automáticas (scripts sugeridos)

- Scan imports:
  - `git grep -E "from ['\"]@app|@paginas|@widgets|@caracteristicas|@entidades|@shared"`.
- Violaciones:
  - `from '@widgets'` dentro de `src/caracteristicas` (invalid).
  - `from '@features'` dentro de `src/widgets` (invalid).
- Corrección:
  - Reubicar en `shared` si utilidad, o inyectar adapter en `entities`.

## Preguntas abiertas / zonas grises

- ¿Se permite que `entities` contengan validaciones de dominio o debe ir a `shared`?
- ¿A qué capa pertenece un `service` que solo llama repositorios: `features` o `shared`?
- ¿Ilustrar la convención `entities/modelo`, `features/<feature>/ui`, `pages/<page>`?

---

### Uso sugerido (prompt)

"/use fsd-arquitectura-estricta" -> ejecuta verificación + cambio mínimo.

---

### Resultado esperado tras ejecución

- Un commit a `master` con:
  - Estructura correcta y mínimo cambio de ruta.
  - `tsconfig.app.json` unificado.
  - `vite.config.ts` alias sincronizados.
  - Anotaciones de refactor en `REVIEW_NOTES.md`.
