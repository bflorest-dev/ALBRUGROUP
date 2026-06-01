# Freeze infinito en `admin/personal` y `admin/empleabilidad` (PrimeNG + Angular Zoneless)

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
