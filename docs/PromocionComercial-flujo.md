# PromocionComercial - flujo y alcance

Documento operativo y tecnico del comportamiento actual de `PromocionComercial`.

## Objetivo

Una promocion comercial interna define una regla comercial que puede aplicar de forma global o acotarse por proveedor, zona y planes.

El alcance se interpreta de forma acumulativa:

- sin proveedor, zona ni planes: aplica globalmente;
- con proveedor: aplica solo a planes/leads de ese proveedor;
- con zona: aplica solo a leads cuyo ubigeo cumple las reglas de la zona;
- con planes: aplica solo a esos planes;
- con varias restricciones: deben cumplirse todas.

## Creacion de promociones

Endpoint:

- `POST /promociones`
- Permiso: `CREATE_PROMOCIONES`

Body:

```json
{
  "reglaComercial": "string",
  "idProveedor": 1,
  "idZona": 1,
  "idsPlanes": [1, 2, 3]
}
```

Campos:

- `reglaComercial`: obligatorio.
- `idProveedor`: opcional.
- `idZona`: opcional.
- `idsPlanes`: opcional; `null` o lista vacia significa todos los planes.

Reglas:

- Si se envia `idProveedor`, debe existir y estar activo.
- Si se envia `idZona`, debe existir y estar activa.
- Si se envia `idsPlanes`, no puede tener duplicados.
- Si se envia `idsPlanes`, todos los planes deben existir y estar activos.
- Si se envia `idProveedor` junto con `idsPlanes`, todos los planes deben pertenecer a ese proveedor.
- No puede existir otra promocion activa con la misma `reglaComercial` y el mismo alcance.

## Tipos de alcance

### Promocion global

No envia `idProveedor`, `idZona` ni `idsPlanes`.

Aplica a cualquier proveedor, cualquier zona y cualquier plan.

### Promocion por proveedor

Envia solo `idProveedor`.

Aplica a cualquier plan del proveedor indicado y a cualquier zona.

### Promocion por zona

Envia solo `idZona`.

Aplica a cualquier proveedor y cualquier plan, pero solo si el lead cumple las reglas de la zona.

### Promocion por planes

Envia solo `idsPlanes`.

Aplica solo a los planes indicados. No requiere `idProveedor`, porque los planes definen el alcance.

### Promocion combinada

Puede enviar proveedor, zona y planes al mismo tiempo.

La promocion solo aplica si se cumplen todas las restricciones.

## Listado de promociones

Endpoint:

- `GET /promociones`
- Permiso: `READ_PROMOCIONES`

Query params opcionales:

- `idProveedor`
- `idZona`
- `idPlan`

Comportamiento:

- Solo lista promociones activas.
- Si se filtra por proveedor, tambien incluye promociones globales de proveedor.
- Si se filtra por zona, tambien incluye promociones globales de zona.
- Si se filtra por plan, tambien incluye promociones globales de plan.

Ejemplo:

`GET /promociones?idProveedor=1&idPlan=10`

Devuelve promociones activas que aplican al proveedor `1` y al plan `10`, incluyendo promociones globales que no restringen proveedor o plan.

## Desactivacion

Endpoint:

- `DELETE /promociones/{idPromocion}`
- Permiso: `DELETE_PROMOCIONES`

Comportamiento:

- No elimina fisicamente la promocion.
- Marca `activo=false`.
- Una promocion inactiva deja de aparecer en listados y no puede asignarse a un lead.

## Asignacion a Lead

La promocion se valida cuando se actualiza la oferta comercial del lead.

Endpoint relacionado:

- `PATCH /preventa/{idLead}/oferta-comercial`
- `PATCH /venta/{idLead}/oferta-comercial`

Reglas:

- No se puede seleccionar una promocion sin plan.
- La promocion debe estar activa.
- Si la promocion tiene planes asociados, el plan seleccionado debe estar dentro de esos planes.
- Si la promocion no tiene planes asociados, aplica a cualquier plan.
- Si la promocion tiene proveedor, debe coincidir con el proveedor del plan seleccionado.
- Si la promocion tiene zona, el lead debe tener `Direccion.ubigeoDomicilio`.
- Si la promocion tiene zona, el ubigeo del lead debe cumplir las reglas de inclusion/exclusion de esa zona.

## Validacion de zona

La zona se compone de reglas geograficas.

Cada regla tiene:

- `nivelGeografico`: `DEPARTAMENTO`, `PROVINCIA` o `DISTRITO`;
- `geoId`: id interno de la entidad geografica;
- `criterio`: `INCLUIR` o `EXCLUIR`.

Para validar un lead:

1. Se toma `Direccion.ubigeoDomicilio`.
2. Se busca el distrito por codigo ubigeo.
3. Desde el distrito se obtiene provincia y departamento.
4. Se evalua contra las reglas de la zona.

Reglas de evaluacion:

- Si coincide con cualquier regla `EXCLUIR`, la promocion no aplica.
- Si existen reglas `INCLUIR`, debe coincidir con al menos una.
- Si no existen reglas `INCLUIR`, aplica a todos salvo los excluidos.

Ejemplos:

- Zona incluye una provincia: el lead aplica si su distrito pertenece a esa provincia.
- Zona excluye un distrito: el lead no aplica si su ubigeo corresponde a ese distrito.
- Zona incluye un departamento y excluye una provincia: aplica al departamento excepto a la provincia excluida.

## Casos esperados

| Caso | Resultado |
| --- | --- |
| Promo sin proveedor, zona ni planes | Aplica globalmente |
| Promo con proveedor | Aplica solo a planes de ese proveedor |
| Promo con zona e inclusion de provincia | Aplica solo a leads ubicados en esa provincia |
| Promo con zona y exclusion de distrito | No aplica a leads de ese distrito |
| Promo con planes | Aplica solo a los planes enviados |
| Promo con proveedor y planes de otro proveedor | Se rechaza al crear |
| Promo activa duplicada con mismo alcance | Se rechaza al crear |
| Promo inactiva | No se lista ni se puede asignar |

## Consideraciones para frontend

- Tratar proveedor, zona y planes como filtros opcionales de alcance.
- Una lista vacia de planes significa todos los planes.
- Mostrar claramente si una promocion es global o esta restringida.
- Para seleccionar una promocion en oferta comercial, primero debe existir un plan seleccionado.
- Al filtrar promociones por plan/proveedor/zona, el backend tambien devolvera promociones globales que aplican a ese contexto.
