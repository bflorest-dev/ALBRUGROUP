# Gestion de Time Zones en microservicios

## Objetivo

Normalizar el manejo de fechas y horas para que todos los resultados operativos del usuario final usen la zona horaria de Peru (`America/Lima`), sin perder la robustez de persistir momentos exactos como UTC.

La regla base es:

- `Instant` representa un momento exacto y debe persistirse/viajar como UTC.
- `LocalDate` representa un dia de negocio y debe interpretarse como dia operativo en `America/Lima`.
- El backend debe ser la fuente de verdad para calcular "hoy", rangos diarios, rangos mensuales y cortes operativos.
- El frontend solo debe enviar `YYYY-MM-DD` cuando el usuario eligio una fecha explicitamente.

## Problema detectado

El proyecto tenia criterios mezclados:

- algunos servicios usaban `ZoneId.of("America/Lima")`;
- otros usaban `ZoneId.systemDefault()`;
- otros usaban `LocalDate.now()` sin zona;
- algunos rangos diarios se armaban manualmente con `atStartOfDay()`;
- el frontend podia calcular fechas con `toISOString()`, que convierte a UTC antes de cortar el dia.

Esto generaba bugs donde un registro creado "hoy" en Peru podia no aparecer en una bandeja o resumen porque la consulta estaba calculando el dia desde otra zona horaria.

## Enfoque implementado en lead-service

Se centralizo la logica en una utilidad unica:

```java
public final class OperationalDateTime {
    public static final ZoneId ZONE = ZoneId.of("America/Lima");

    public static Instant now()
    public static LocalDate today()
    public static YearMonth currentMonth()
    public static LocalDate resolveDate(LocalDate date)
    public static YearMonth resolveMonth(Integer year, Integer month)
    public static Instant startOfDay(LocalDate date)
    public static Instant endExclusiveOfDay(LocalDate date)
    public static InstantRange dayRange(LocalDate date)
    public static InstantRange monthRange(YearMonth period)
    public static LocalDate toOperationalDate(Instant instant)
}
```

Ubicacion actual:

- `/(lead-service)/OperationalDateTime`

## Regla para Instant

Usar `Instant` para campos que significan un momento exacto:

- `createdAt`
- `updatedAt`
- `lastEntryAt`
- `occurredAt`
- eventos
- auditoria
- registros con hora exacta

Estos campos no deben convertirse a `LocalDateTime` para persistencia ni para contratos base. Deben permanecer como `Instant`.

Cuando se necesite crear un timestamp desde logica de negocio, usar:

```java
OperationalDateTime.now()
```

Esto mantiene un punto unico de decision, aunque internamente siga siendo UTC.

## Regla para LocalDate

Usar `LocalDate` solo para fechas de negocio:

- fecha de instalacion
- fecha de vencimiento
- fecha de pago
- vigencias de planes
- filtros `fecha=YYYY-MM-DD`
- filtros `fechaDesde` / `fechaHasta`

Un `LocalDate` recibido por API debe interpretarse como dia calendario en `America/Lima`.

Para "hoy operativo", usar:

```java
OperationalDateTime.today()
```

No usar:

```java
LocalDate.now()
LocalDate.now(ZoneId.systemDefault())
```

## Regla para rangos diarios

Cuando se consulta por dia operativo, convertir el `LocalDate` a rango `[inicio, fin)` en `Instant`.

Patron correcto:

```java
OperationalDateTime.InstantRange rango = OperationalDateTime.dayRange(fecha);

repository.buscar(
    rango.inicio(),
    rango.fin()
);
```

Las queries deben usar:

```sql
createdAt >= :inicio
createdAt < :fin
```

Evitar `<= :fin` para cierre de dia, porque el fin representa el inicio del dia siguiente.

## Regla para rangos mensuales

Cuando se consulta por mes operativo:

```java
YearMonth periodo = OperationalDateTime.resolveMonth(anio, mes);
OperationalDateTime.InstantRange rango = OperationalDateTime.monthRange(periodo);
```

Las queries tambien deben usar intervalo `[inicio, fin)`.

## Cambios realizados en lead-service

Se agrego la utilidad central:

- `/(lead-service)/OperationalDateTime`

Se reemplazaron calculos dispersos en:

- `/(lead-service)/LeadService`
- `/(lead-service)/CampanaGastoService`
- `/(lead-service)/EventoService`
- `/(lead-service)/MasivoService`
- `/(lead-service)/PlanService`
- `/(lead-service)/PagoPostventaService`
- `/(lead-service)/CampanaService`
- `/(lead-service)/DataLoader`

Se normalizaron query params de fechas en:

- `/(lead-service)/CampanaGastoController`

El barrido final dejo fuera de la utilidad central sin usos directos de:

- `LocalDate.now()`
- `YearMonth.now()`
- `ZoneId.systemDefault()`
- `ZoneId.of("America/Lima")`
- `atStartOfDay()` para rangos de negocio
- `Instant.now()`

## Checklist para aplicar en otro microservicio

1. Crear una utilidad equivalente a `OperationalDateTime`.
2. Definir `ZONE = ZoneId.of("America/Lima")`.
3. Reemplazar `LocalDate.now()` por `OperationalDateTime.today()`.
4. Reemplazar `YearMonth.now()` por `OperationalDateTime.currentMonth()`.
5. Reemplazar `ZoneId.systemDefault()` por la zona centralizada.
6. Reemplazar rangos manuales con `dayRange()` o `monthRange()`.
7. Mantener `Instant` para timestamps reales.
8. Asegurar que los filtros de fechas usen `@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)`.
9. Revisar queries para usar intervalo `[inicio, fin)`.
10. Compilar y buscar que no queden usos dispersos.

Comandos utiles:

```powershell
rg -n "LocalDate\.now|YearMonth\.now|ZoneId\.systemDefault|ZoneId\.of|atStartOfDay|Instant\.now" nombre-ms/src/main/java
```

## Contrato con frontend

El frontend debe seguir esta convencion:

- no usar `toISOString().slice(0, 10)` para fechas operativas;
- si una vista muestra "hoy", preferir omitir `fecha` y dejar que backend resuelva el dia operativo;
- si el usuario selecciona una fecha, enviar exactamente `YYYY-MM-DD`;
- los timestamps ISO recibidos se muestran como hora local del usuario o con formato operativo si la vista lo requiere.

Esta regla ya esta documentada en:

- `/(frontend)/AGENTS`

## Validacion aplicada

Despues de normalizar `lead-service`, se ejecuto:

```powershell
./mvnw.cmd -q -DskipTests compile
```

El compile paso correctamente.

