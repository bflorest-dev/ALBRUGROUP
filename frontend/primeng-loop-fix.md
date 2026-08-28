# Freezes por loop de change detection (Angular Zoneless + PrimeNG + Signals)

> Este documento reúne **causas conocidas de UI congelada / navegador colgado** por bucles de
> change detection en este stack. Hay dos patrones distintos hasta ahora:
>
> - **Caso 1 — Refs nuevas en template binding** (`admin/personal`, `admin/empleabilidad`).
> - **Caso 2 — `effect()` que llama un método que escribe signals** (ADMIN › Plataformas › Backoffice).
>
> Si una vista se cuelga o queda "viva pero sorda" (pinta, pero ignora clics/hover), es casi seguro
> un loop de CD: revisá ambos patrones. Diagnóstico rápido al final.

---

# Caso 1 — Freeze infinito en `admin/personal` y `admin/empleabilidad` (refs nuevas en template)

**Fecha:** 2026-05-28
**Componentes afectados:** `personal-registration-panel`, `offer-list-panel`, `offer-registration-panel`
**Stack:** Angular 21 zoneless + PrimeNG 21 + OnPush + Signals

---

## Síntoma

Al hacer click en las tabs **Personal** o **Empleabilidad** del sidebar de admin, el navegador se colgaba completamente: la pestaña dejaba de responder, el botón de cerrar no reaccionaba, y eventualmente Chrome ofrecía matar la pestaña. La consola no mostraba errores. La consola de red no mostraba requests pendientes que justificaran el bloqueo.

El login funcionaba, la tab **Inicio** funcionaba, pero al cambiar a Personal o Empleabilidad el main thread quedaba bloqueado.

El bug **no aparecía** en:
- `ng build` (compilaba limpio)
- `ng build --configuration development` (limpio)
- Tests unitarios

Solo se manifestaba en runtime con el componente montado en el navegador.

---

## Causa raíz

Patrón de binding en templates que crea **nuevas referencias en cada change detection cycle**, interactuando con `ControlValueAccessor` de PrimeNG en modo OnPush.

### El patrón problemático

```html
<!-- En personal-registration-panel.component.html, offer-list-panel.component.html, etc. -->
<p-datepicker
  [ngModel]="toPickerDate(empleadoForm.get('fechaNacimiento')?.value)"
  [ngModelOptions]="{ standalone: true }"
  ...
/>

<p-select
  [options]="optionItems(documentoOptions)"
  ...
/>
```

```typescript
// Versión rota: crea nueva instancia en cada llamada
protected toPickerDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //     Misma fecha como string ⇒ Date object NUEVO en cada call.
  }
  return null;
}

protected optionItems(options: string[]): SelectOption[] {
  return options.map((opt) => ({ label: formatLabel(opt), value: opt }));
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //     Mismo input ⇒ array NUEVO en cada call.
}
```

### Cómo se forma el loop

1. Angular ejecuta change detection en el componente padre.
2. El template evalúa `toPickerDate("2026-05-28")` → retorna **nueva Date** instance `D1`.
3. `[ngModel]="D1"` se pasa al directive `NgModel`, que llama `writeValue(D1)` en el CVA del `p-datepicker`.
4. `p-datepicker.writeValue` internamente compara su valor anterior vs el nuevo. Como `D1 !== D_anterior` (refs distintas, aunque sean equivalentes), considera que cambió.
5. PrimeNG llama `this.cd.markForCheck()` en el datepicker.
6. `markForCheck()` propaga dirty flag hacia arriba en el árbol → el padre queda marcado como dirty.
7. El scheduler de Angular dispara otro tick de change detection.
8. **Volver al paso 1.** El padre re-renderiza, `toPickerDate(...)` retorna **nueva Date** `D2`, ciclo se repite.

El main thread queda bloqueado en este loop sincrónico. El navegador se cuelga.

El mismo análisis aplica a `optionItems()` retornando arrays nuevos, y a `[style]="buildStyle()"` retornando objetos nuevos.

### Por qué pasó ahora y no antes

El proyecto migró el admin view de componentes custom a PrimeNG (commit `ca4e6fa`). En la versión previa (V6 backup):
- Las fechas usaban `DateFieldComponent` custom, que aceptaba strings directamente sin necesitar parseo a `Date` en el template.
- Los selects custom hacían su propio mapping internamente, sin pedir un array transformado vía `@Input`.

Al migrar a `p-datepicker` y `p-select`, los templates empezaron a invocar métodos de transformación (`toPickerDate`, `optionItems`) en cada binding. Sin caché, cada llamada crea nuevas referencias → loop.

### Por qué solo en `admin/personal` y `admin/empleabilidad`

Ambas vistas usan componentes con el patrón roto (`p-datepicker` + `p-select` masivamente). La tab **Inicio** (`employee-access-panel`) no usa `p-datepicker` ni transformaciones similares, por eso no se colgaba.

---

## Fix aplicado

Cachear el resultado de los métodos del template por la clave estable del input.

### Cache de `optionItems` (arrays)

`string[]` como input → `WeakMap` con la referencia del array como key. Los inputs son `readonly` en los facades, así que la referencia se mantiene estable durante la vida de la app.

```typescript
private readonly optionItemsCache = new WeakMap<readonly string[], SelectOption[]>();

protected optionItems(options: string[]): SelectOption[] {
  let cached = this.optionItemsCache.get(options);
  if (!cached) {
    cached = options.map((opt) => ({ label: formatLabel(opt), value: opt }));
    this.optionItemsCache.set(options, cached);
  }
  return cached;
}
```

### Cache de `toPickerDate` (Date)

`string` (fecha en formato backend) como input → `Map<string, Date | null>`. Misma fecha string siempre devuelve la misma instancia `Date`.

```typescript
private readonly pickerDateCache = new Map<string, Date | null>();

protected toPickerDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value !== 'string' || !value) return null;

  const cached = this.pickerDateCache.get(value);
  if (cached !== undefined) return cached;

  let parsed: Date | null = null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  this.pickerDateCache.set(value, parsed);
  return parsed;
}
```

### Cache de entidades (objects)

Para casos como `empresaItems()` que dependen de un array de entidades (`EmpresaContratistaResponse[]`), se usa cache por referencia:

```typescript
private empresaItemsCache: { source: readonly EmpresaContratistaResponse[]; items: SelectOption[] } | null = null;

protected empresaItems(): SelectOption[] {
  if (this.empresaItemsCache?.source === this.empresasContratistas) {
    return this.empresaItemsCache.items;
  }
  const items = [
    { label: 'No aplica', value: '' },
    ...this.empresasContratistas.map((e) => ({ label: e.nombre, value: String(e.id) }))
  ];
  this.empresaItemsCache = { source: this.empresasContratistas, items };
  return items;
}
```

### Resultado

| Tab | Antes del fix | Después del fix |
|---|---|---|
| Inicio | OK | OK |
| Personal | Freeze completo (navegador colgado) | ~2s render inicial, luego fluido |
| Empleabilidad | Freeze completo | Inmediato |

Los 2 segundos restantes en Personal son render legítimo (4 step-panels del stepper con ~30 campos PrimeNG), no un loop.

---

## Regla general (para futuras vistas)

> **En Angular zoneless + PrimeNG + OnPush, nunca devolver una nueva referencia (object, array, Date, Map, Set) desde un método llamado en template binding.** Siempre cachear por la clave estable del input.

### Indicadores rojos en templates a auditar

```html
<!-- ❌ MAL: nueva referencia en cada render -->
[options]="someMethod(arr)"
[ngModel]="parse(formCtrl.value)"
[style]="{ color: someValue }"
[ngStyle]="buildStyle()"
[data]="filter(items, criteria)"

<!-- ✅ BIEN: referencia estable -->
[options]="cachedOptions"
[ngModel]="signalValue()"
[style]="staticStyleObject"
```

### Componentes PrimeNG a vigilar (todos usan CVA + OnPush)

- `p-select` / `p-multiselect`
- `p-datepicker`
- `p-togglebutton`
- `p-checkbox`, `p-radiobutton`
- `p-table` (`[value]` con arrays nuevos)
- `p-stepper` (renderiza panels en paralelo)

### Por qué los tests no lo detectan

- `ng build` solo verifica tipos y sintaxis, no runtime behavior.
- Tests unitarios típicos montan un componente, hacen 1 ciclo de CD, verifican el DOM. No reproducen los múltiples ticks que generan el loop en producción.
- Solo se manifiesta con interacción real del navegador + PrimeNG montado + datos reales.

### Cómo diagnosticar futuros casos similares

1. Si una vista cuelga el navegador al navegar a ella → asumir loop de CD.
2. Chrome DevTools → Performance → grabar la navegación → mirar el flame chart. Funciones de Angular/PrimeNG repitiéndose miles de veces por segundo confirman el loop.
3. Bisección: comparar contra versión funcional anterior (`OLD/V6` en este repo) con `diff -rq` y revisar templates por bindings que llamen métodos.

---

## Archivos modificados en este fix

- `frontend/src/app/features/admin/components/personal-registration-panel/personal-registration-panel.component.ts`
- `frontend/src/app/features/admin/components/offer-list-panel/offer-list-panel.component.ts`
- `frontend/src/app/features/admin/components/offer-registration-panel/offer-registration-panel.component.ts`

---
---

# Caso 2 — Freeze en ADMIN › Plataformas › Backoffice (`effect()` que se realimenta)

**Fecha:** 2026-08-27
**Componente afectado:** `backoffice-workspace-page` (reutilizado en rol Backoffice **y** en ADMIN)
**Stack:** Angular 21 zoneless + PrimeNG 21 + OnPush + Signals

---

## Síntoma

En **ADMIN › Plataformas › Backoffice** (mismas tabs que el rol Backoffice), la bandeja se comportaba
errática: los botones **Gestionar** parpadeaban como si el hover entrara en conflicto, el selector de
fecha a veces no respondía, y finalmente **Gestionar dejó de abrir el drawer**. La UI pintaba, pero
ignoraba los clics/hover ("viva pero sorda").

Clave del diagnóstico: **solo pasaba en la vista del ADMIN**. La misma bandeja, entrando con el rol
Backoffice real, funcionaba perfecta. Es el **mismo componente** montado en dos rutas
(`/backoffice/*` y `/admin/plataformas/equipos/:idEquipo/backoffice/*`); lo único distinto en runtime
era el **rol** y el `idEquipo`.

En la red se veían **decenas de requests idénticos a `/leads/venta`** separados por fracciones de
milisegundo (imposible para tráfico real → señal inequívoca de bucle síncrono). En consola:
`NG0103: Angular could not stabilize because there are pending changes`.

---

## Causa raíz

Un `effect()` que invoca síncronamente un método que **lee y escribe signals** → el effect pasa a
depender de esas signals y su propia escritura lo re-dispara: **bucle infinito de change detection**.

En Angular con signals, un `effect()` **rastrea toda signal que lee**, incluidas las que lee un método
llamado dentro de él. Si ese método además **escribe** signals, se cierra el ciclo.

### El patrón problemático

```typescript
// constructor de backoffice-workspace-page
effect(() => {
  const status = this.operationalGateService.currentStatus();   // dep legítima del effect
  ...
  } else if (canActivate && this.lastAttendanceStatus !== 'ONLINE') {
    void this.reconcile();   // ❌ reconcile() lee Y escribe signals dentro del tracking
  }
});

private async reconcile() {
  if (this.isReconciling()) return;   // lee isReconciling  (queda como dep del effect)
  this.isReconciling.set(true);       // escribe isReconciling → re-dispara el effect
  await this.refreshCurrent(true);    // lee/escribe plataformaRows, totalPlataforma, ...
  ...
}
```

### Cómo se forma el loop

1. Corre el `effect()` → llama `reconcile()` **dentro** del tracking.
2. `reconcile()` **lee** `isReconciling` (pasa a ser dependencia del effect) y luego la **escribe** (`.set(true)`).
3. Angular ve que una signal vigilada por el effect cambió → **vuelve a ejecutar el effect**.
4. Vuelve a llamar `reconcile` → vuelve a leer/escribir → **paso 1**. Nunca estabiliza.
5. A las ~100 vueltas Angular corta con `NG0103`, pero para entonces ya disparó ~100 fetches y bloqueó el hilo.

### Por qué SOLO en el ADMIN

El effect solo entra a la rama de `reconcile()` cuando el estado de asistencia **no es `ONLINE`**
(`lastAttendanceStatus !== 'ONLINE'`).

- **ADMIN** es rol `ALWAYS_OPERATIONAL` (ver `operational-roles.constants.ts`): **nunca marca
  asistencia**, su estado nunca llega a `ONLINE` → la condición siempre se cumple → siempre entra al bucle.
- **Asesor/Supervisor Backoffice**: apenas se pone **ONLINE**, deja de cumplir la condición → nunca
  entra al bucle → su web va perfecta.

El rol fue el disparador silencioso de un bug que vivía en código compartido.

### Nota: los "fixes" cosméticos previos no sirvieron

Un intento anterior (commit `Fix: AdminView`) atacó el síntoma: apagar `rowHover`, matar animaciones
con una clase `--admin`, `pointer-events:none` en icono/label del botón. El motor —el bucle de CD—
seguía intacto, así que el problema persistía e incluso empeoró (el botón dejó de responder).

---

## Fix aplicado

Envolver en `untracked(...)` las llamadas con efectos secundarios dentro del effect, para que el
effect reaccione solo a sus dependencias reales (el estado de asistencia) y **no** rastree las signals
internas de `reconcile`/`initialize`:

```typescript
if (canActivate && !this.initialized && !this.initializeInFlight) {
  untracked(() => void this.initialize());
} else if (canActivate && this.lastAttendanceStatus !== 'ONLINE') {
  untracked(() => void this.reconcile());   // ✅ bucle roto
}
```

`untracked` ejecuta el callback sin registrar como dependencias las signals que lea por dentro. El
effect sigue disparándose cuando cambia `currentStatus()` (que es lo que debe), pero la escritura de
`isReconciling` ya no lo realimenta.

Mejoras complementarias que se aplicaron en el mismo archivo (reducen carga, no eran la causa):
- **Debounce del realtime**: el topic `/topic/leads/etapa/VENTA` es un firehose global; se coalescen
  las ráfagas con `debounceTime` antes de reconciliar.
- **Reconciliar solo la bandeja visible**: `reconcile()` refrescaba las 5 bandejas por evento; ahora
  solo la activa (las demás recargan al cambiar de tab).

### Resultado (medido en vivo)

| Métrica | Antes | Después |
|---|---|---|
| `refreshPlataforma` en reposo (3s) | ~cientos (bucle) | **0** |
| `NG0103` en el bundle nuevo | sí | **ninguno** |
| Clic en cabecera de orden | (congelado) | **1 clic = 1 fetch** |

---

## Regla general (para futuras vistas)

> **Al llamar desde un `effect()` a un método que además escribe signals, envolvé la llamada en
> `untracked(() => ...)`.** Si no, el effect adopta como dependencias las signals que ese método lee,
> y su propia escritura lo re-dispara en bucle.

Corolario de arquitectura: **las vistas de `admin/plataformas/*` reutilizan los componentes operativos
de cada rol** (`backoffice-workspace-page`, `gtr-workspace-page`, `postventa-workspace-page`, ...). El
ADMIN es `ALWAYS_OPERATIONAL`, así que **cualquier lógica que dependa del estado de asistencia se
comporta distinto para el ADMIN** (nunca ONLINE, gate siempre abierto). Al tocar esos componentes,
probar **siempre también desde la vista del ADMIN**, no solo con el rol dueño.

### Indicadores rojos a auditar

```typescript
// ❌ MAL: método con efectos secundarios (escribe signals) llamado dentro del tracking del effect
effect(() => { ...; void this.reconcile(); });

// ✅ BIEN: aislar el efecto secundario
effect(() => { ...; untracked(() => void this.reconcile()); });
```

---

# Diagnóstico de loops de CD (para ambos casos)

1. Si una vista cuelga el navegador o queda "viva pero sorda" → asumir loop de CD.
2. **Consola**: buscar `NG0103: could not stabilize` (Caso 2 suele emitirlo; Caso 1 a veces cuelga sin log).
3. **Red**: requests idénticos separados <1 ms = bucle síncrono, no tráfico real.
4. **Instrumentar la instancia en runtime** (dev): obtener el componente y envolver el método sospechoso
   para capturar el stack del llamador —así se ubicó el Caso 2—:
   ```js
   const cmp = window.ng.getComponent(document.querySelector('app-backoffice-workspace-page'));
   const orig = cmp.refreshPlataforma;
   cmp.refreshPlataforma = function(...a){ console.log(new Error().stack); return orig.apply(this,a); };
   // Stack revelador: refresh ← reconcile ← [effect] ← runEffectsInView ← detectChangesInView
   ```
5. **DevTools › Performance**: grabar la navegación; funciones de Angular/PrimeNG repitiéndose miles de
   veces/segundo confirman el loop.
6. Verificar el fix midiendo llamadas en reposo (deben ser **0**) y que **1 clic = 1 fetch**.

Preview con hot-reload para iterar/verificar: `ng serve` en **:4200** (el CORS del gateway solo permite
ese origen; parar el contenedor `frontend` primero).

---

## Archivos modificados en el Caso 2

- `frontend/src/app/features/backoffice/pages/backoffice-workspace-page/backoffice-workspace-page.component.ts`
