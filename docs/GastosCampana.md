# Gastos de Campana

Documento de referencia para el registro y consulta de gastos acumulados por campana en `lead-service`.

## Concepto

Los gastos de campana se registran como snapshots acumulados del dia. Cada registro indica cuanto gasto y cuantos leads reportados llevaba una campana hasta ese momento.

Ademas del dato manual ingresado, el backend congela metricas reales al momento de crear el registro:

- `leadsReales`: cantidad de leads unicos de la campana cuyo `lastEntryAt` cae entre el inicio del dia y la hora del registro.
- `ventasCerradas`: cantidad de leads unicos con evento `TIPIFICACION`, `PREVENTA_COMPLETA` y `VENTA_CERRADA` entre el inicio del dia y la hora del registro.

Estas metricas se calculan solo al crear el registro y luego quedan persistidas. Las consultas futuras leen los valores guardados.

La zona horaria operativa usada para cortes diarios y mensuales es `America/Lima`.

## Entidad

Entidad: `CampanaGastoRegistro`

Campos:

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `id` | `Long` | Identificador del registro. |
| `campana` | `Campana` | Campana asociada. Relacion obligatoria. |
| `leads` | `Integer` | Leads acumulados reportados manualmente para la campana hasta ese momento. |
| `leadsReales` | `Integer` | Leads reales calculados y congelados al crear el registro. |
| `ventasCerradas` | `Integer` | Ventas cerradas calculadas y congeladas al crear el registro. |
| `costoTotal` | `BigDecimal` | Gasto acumulado reportado manualmente para la campana hasta ese momento. |
| `createdAt` | `Instant` | Hora de creacion del snapshot. La asigna el servidor. |
| `updatedAt` | `Instant` | Ultima actualizacion del registro. |

Indices:

| Indice | Columnas | Uso |
| --- | --- | --- |
| `idx_campana_gasto_campana_created` | `id_campana, createdAt` | Consulta diaria/mensual por campana. |
| `idx_campana_gasto_created` | `createdAt` | Consulta diaria/mensual global. |

## Request

DTO: `CampanaGastoRequest`

```json
{
  "leads": 8,
  "costoTotal": 15.92
}
```

Campos:

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `leads` | `Integer` | Obligatorio. Debe ser mayor o igual a `0`. |
| `costoTotal` | `BigDecimal` | Obligatorio. Debe ser mayor o igual a `0.00`. |

El cliente no envia `leadsReales`, `ventasCerradas`, `createdAt` ni `updatedAt`.

## Responses

### CampanaGastoResponse

Usado al registrar un gasto y al listar los registros de un dia.

```json
{
  "id": 1,
  "idCampana": 10,
  "nombreCampana": "Win4 - 100% Fibra Optica",
  "leads": 8,
  "leadsReales": 7,
  "ventasCerradas": 2,
  "costoTotal": 15.92,
  "createdAt": "2026-05-25T15:00:00Z",
  "updatedAt": "2026-05-25T15:00:01Z"
}
```

Campos:

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `id` | `Long` | Identificador del registro. |
| `idCampana` | `Long` | Identificador de la campana. |
| `nombreCampana` | `String` | Nombre de la campana. |
| `leads` | `Integer` | Leads acumulados reportados manualmente. |
| `leadsReales` | `Integer` | Leads reales congelados al registrar. |
| `ventasCerradas` | `Integer` | Ventas cerradas congeladas al registrar. |
| `costoTotal` | `BigDecimal` | Gasto acumulado reportado manualmente. |
| `createdAt` | `Instant` | Hora del snapshot. |
| `updatedAt` | `Instant` | Ultima actualizacion. |

### CampanaGastoCampanaResumenResponse

Usado dentro de respuestas globales para mostrar el detalle por campana.

```json
{
  "idCampana": 10,
  "nombreCampana": "Win4 - 100% Fibra Optica",
  "leads": 20,
  "leadsReales": 18,
  "ventasCerradas": 4,
  "costoTotal": 46.30,
  "ultimoRegistroAt": "2026-05-25T17:10:00Z"
}
```

Campos:

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `idCampana` | `Long` | Identificador de la campana. |
| `nombreCampana` | `String` | Nombre de la campana. |
| `leads` | `Integer` | Total reportado segun el ultimo snapshot considerado. |
| `leadsReales` | `Integer` | Total real congelado segun el ultimo snapshot considerado. |
| `ventasCerradas` | `Integer` | Ventas cerradas congeladas segun el ultimo snapshot considerado. |
| `costoTotal` | `BigDecimal` | Gasto total segun el ultimo snapshot considerado. |
| `ultimoRegistroAt` | `Instant` | Hora del snapshot usado. |

### CampanaGastoResumenDiarioResponse

Usado para resumen diario por campana o global.

Resumen por campana:

```json
{
  "idCampana": 10,
  "nombreCampana": "Win4 - 100% Fibra Optica",
  "fecha": "2026-05-25",
  "leads": 20,
  "leadsReales": 18,
  "ventasCerradas": 4,
  "costoTotal": 46.30,
  "ultimoRegistroAt": "2026-05-25T17:10:00Z",
  "campanas": null
}
```

Resumen global:

```json
{
  "idCampana": null,
  "nombreCampana": null,
  "fecha": "2026-05-25",
  "leads": 48,
  "leadsReales": 44,
  "ventasCerradas": 9,
  "costoTotal": 112.80,
  "ultimoRegistroAt": "2026-05-25T17:15:00Z",
  "campanas": []
}
```

Notas:

- En resumen por campana, se usa el ultimo registro del dia para esa campana.
- En resumen global, se usa el ultimo registro del dia por cada campana y luego se suman los valores.
- Si no hay registros, los totales numericos vuelven en `0` y `ultimoRegistroAt` en `null`.

### CampanaGastoResumenMensualResponse

Usado para resumen mensual por campana o global.

```json
{
  "idCampana": 10,
  "nombreCampana": "Win4 - 100% Fibra Optica",
  "anio": 2026,
  "mes": 5,
  "leads": 350,
  "leadsReales": 330,
  "ventasCerradas": 72,
  "costoTotal": 850.75,
  "ultimoRegistroAt": "2026-05-25T17:10:00Z",
  "campanas": null
}
```

Notas:

- En mensual por campana, se toma el ultimo registro de cada dia para esa campana y se suman esos cierres diarios.
- En mensual global, se toma el ultimo registro de cada dia por cada campana y se suman los cierres diarios de todas las campanas.

## Endpoints

Base path: `/campanas`

### Registrar gasto de campana

`POST /campanas/{idCampana}/gastos`

Permiso: `UPDATE_CAMPANA`

Path params:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `idCampana` | `Long` | Si | Campana activa donde se registra el snapshot. |

Body:

```json
{
  "leads": 8,
  "costoTotal": 15.92
}
```

Response: `201 Created` con `CampanaGastoResponse`.

Comportamiento:

- Valida que la campana exista y este activa.
- Guarda el snapshot con `createdAt` del servidor.
- Calcula y guarda `leadsReales` y `ventasCerradas` desde el inicio del dia hasta `createdAt`.

### Listar registros diarios de una campana

`GET /campanas/{idCampana}/gastos`

Permiso: `READ_CAMPANA`

Path params:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `idCampana` | `Long` | Si | Campana consultada. |

Query params:

| Parametro | Tipo | Requerido | Default | Descripcion |
| --- | --- | --- | --- | --- |
| `fecha` | `LocalDate` (`YYYY-MM-DD`) | No | Fecha actual en `America/Lima` | Dia a consultar. |

Response: `200 OK` con `List<CampanaGastoResponse>`.

Orden: `createdAt ASC`.

### Resumen diario por campana

`GET /campanas/{idCampana}/gastos/resumen-diario`

Permiso: `READ_CAMPANA`

Path params:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `idCampana` | `Long` | Si | Campana consultada. |

Query params:

| Parametro | Tipo | Requerido | Default | Descripcion |
| --- | --- | --- | --- | --- |
| `fecha` | `LocalDate` (`YYYY-MM-DD`) | No | Fecha actual en `America/Lima` | Dia a resumir. |

Response: `200 OK` con `CampanaGastoResumenDiarioResponse`.

Comportamiento:

- Usa el ultimo snapshot del dia de la campana.
- No recalcula metricas reales; lee las guardadas en el snapshot.

### Resumen diario global

`GET /campanas/gastos/resumen-diario`

Permiso: `READ_CAMPANA`

Query params:

| Parametro | Tipo | Requerido | Default | Descripcion |
| --- | --- | --- | --- | --- |
| `fecha` | `LocalDate` (`YYYY-MM-DD`) | No | Fecha actual en `America/Lima` | Dia a resumir. |

Response: `200 OK` con `CampanaGastoResumenDiarioResponse`.

Comportamiento:

- Usa el ultimo snapshot del dia por cada campana.
- Suma `leads`, `leadsReales`, `ventasCerradas` y `costoTotal`.
- Incluye detalle por campana en `campanas`.

### Resumen mensual por campana

`GET /campanas/{idCampana}/gastos/resumen-mensual`

Permiso: `READ_CAMPANA`

Path params:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `idCampana` | `Long` | Si | Campana consultada. |

Query params:

| Parametro | Tipo | Requerido | Default | Descripcion |
| --- | --- | --- | --- | --- |
| `anio` | `Integer` | No | Anio actual en `America/Lima` | Anio del periodo. |
| `mes` | `Integer` (`1-12`) | No | Mes actual en `America/Lima` | Mes del periodo. |

Regla: `anio` y `mes` deben enviarse juntos. Si no se envia ninguno, se usa el periodo actual.

Response: `200 OK` con `CampanaGastoResumenMensualResponse`.

Comportamiento:

- Usa el ultimo snapshot de cada dia del mes para la campana.
- Suma los cierres diarios.

### Resumen mensual global

`GET /campanas/gastos/resumen-mensual`

Permiso: `READ_CAMPANA`

Query params:

| Parametro | Tipo | Requerido | Default | Descripcion |
| --- | --- | --- | --- | --- |
| `anio` | `Integer` | No | Anio actual en `America/Lima` | Anio del periodo. |
| `mes` | `Integer` (`1-12`) | No | Mes actual en `America/Lima` | Mes del periodo. |

Regla: `anio` y `mes` deben enviarse juntos. Si no se envia ninguno, se usa el periodo actual.

Response: `200 OK` con `CampanaGastoResumenMensualResponse`.

Comportamiento:

- Usa el ultimo snapshot de cada dia por cada campana.
- Suma los cierres diarios de todas las campanas.
- Incluye detalle por campana en `campanas`.

## Ejemplo de flujo diario

1. A las 10:00 se registra:

```json
{
  "leads": 8,
  "costoTotal": 15.92
}
```

2. A las 11:06 se registra el acumulado actualizado:

```json
{
  "leads": 13,
  "costoTotal": 26.14
}
```

3. A las 12:11 se registra el acumulado actualizado:

```json
{
  "leads": 20,
  "costoTotal": 46.30
}
```

El resumen diario usara el ultimo snapshot del dia. El listado diario mostrara los tres snapshots con sus metricas reales congeladas al momento de cada registro.
