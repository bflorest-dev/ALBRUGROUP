# Rol Community

Documento operativo del rol Community. No define pantallas ni componentes visuales. Separa responsabilidades y flujos para que luego puedan traducirse a vistas, formularios, modales o paneles de mantenimiento.

## Flujos comunes heredados

Community tambien es empleado. Por eso hereda los flujos comunes de:

- acceso: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: acceso`;
- marcaciones de asistencia: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: marcaciones de asistencia`.

El documento de Community no repite esos pasos porque no son propios del rol.

## Responsabilidad del rol

Community mantiene catalogos comerciales que alimentan el trabajo de leads: proveedores, cuentas publicitarias, campanas, planes, adicionales, promociones y zonas.

Responsabilidades principales:

- mantener proveedores activos y sus reglas comerciales base;
- mantener cuentas publicitarias disponibles para campanas;
- crear y actualizar campanas;
- mantener adicionales y planes por proveedor;
- crear promociones comerciales internas;
- mantener zonas comerciales basadas en reglas geograficas.

## Flujo 1: proveedores

Objetivo: mantener el catalogo base de proveedores comerciales.

Secuencia:

1. Registrar proveedor con `LEAD-01`.
2. Listar proveedores con `LEAD-02`.
3. Activar o desactivar proveedor con `LEAD-03`.

Reglas operativas:

- El proveedor es dependencia para campanas, planes, adicionales y promociones.
- Si se desactiva un proveedor, puede dejar de estar disponible para nuevas configuraciones comerciales.
- `cortesFacturacion` solo admite dias `1..31`.
- `mesesPermanencia` debe ser positivo si se envia.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Flujo 2: cuentas publicitarias

Objetivo: mantener cuentas que se usan para registrar campanas.

Secuencia:

1. Registrar cuenta publicitaria con `LEAD-04`.
2. Listar cuentas con `LEAD-05` si se requiere mantenimiento general.
3. Listar cuentas activas con `LEAD-06` cuando se necesite selector para campanas.
4. Desactivar cuenta con `LEAD-07`.

Reglas operativas:

- Para crear campana, usar solo cuentas activas.
- La desactivacion es logica y evita que la cuenta sea usada en nuevas campanas.
- Community debe diferenciar mantenimiento general de selector operativo: `LEAD-05` para mantenimiento, `LEAD-06` para formularios de campana.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Flujo 3: campanas

Objetivo: crear y mantener campanas comerciales asociadas a proveedor y cuenta publicitaria.

Secuencia:

1. Cargar proveedores activos con `LEAD-02`.
2. Cargar cuentas activas con `LEAD-06`.
3. Registrar campana con `LEAD-08`.
4. Actualizar WhatsApp de campana con `LEAD-09`.
5. Activar o desactivar campana con `LEAD-10`.
6. Listar campanas con `LEAD-11`.

Reglas operativas:

- Una campana requiere proveedor activo y cuenta publicitaria activa.
- La actualizacion actual de campana esta limitada al numero `numeroWhatsappEmpresa`.
- Alternar el estado de una campana debe tratarse como accion sensible porque puede afectar captacion de leads.
- Para reactivar una campana, su proveedor y su cuenta publicitaria deben seguir activos.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Flujo 4: adicionales y planes

Objetivo: mantener la oferta comercial que luego se usa en leads y promociones.

Secuencia para adicionales:

1. Cargar proveedores activos con `LEAD-02`.
2. Registrar adicional con `LEAD-12`.
3. Listar adicionales del proveedor con `LEAD-13`.

Secuencia para planes:

1. Cargar proveedores activos con `LEAD-02`.
2. Cargar zonas activas con `LEAD-23` si el plan aplica por zona.
3. Cargar adicionales del proveedor con `LEAD-13` si el plan incluye adicionales.
4. Registrar plan con `LEAD-14`.
5. Listar planes con `LEAD-15`.
6. Consultar servicios del proveedor con `LEAD-16` si se necesita reutilizar paquetes existentes.
7. Actualizar plan con `LEAD-17`.
8. Desactivar plan con `LEAD-18`.

Reglas operativas:

- Los adicionales pertenecen a un proveedor.
- Un plan pertenece a un proveedor y puede tener internet, television, telefono, zona y adicionales.
- Si se configura promocion de precio, deben enviarse precio promocional y meses.
- Si se configura promocion de velocidad, el plan debe tener internet y deben enviarse velocidad promocional y meses.
- Los adicionales incluidos en un plan no pueden repetirse y deben pertenecer al mismo proveedor.
- `soloVigentes=true` en `LEAD-15` sirve para selectores comerciales; para mantenimiento conviene listar tambien no vigentes.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Flujo 5: promociones

Objetivo: mantener promociones comerciales internas por proveedor, zona y planes.

Secuencia:

1. Cargar proveedores activos con `LEAD-02`.
2. Cargar zonas activas con `LEAD-23`.
3. Cargar planes activos o vigentes con `LEAD-15`.
4. Registrar promocion con `LEAD-19`.
5. Listar promociones con `LEAD-20`.
6. Desactivar promocion con `LEAD-21`.

Reglas operativas:

- La promocion requiere `idProveedor`, `idZona` e `idsPlanes`.
- Todos los planes de una promocion deben estar activos y pertenecer al mismo proveedor.
- No se pueden repetir planes dentro de la promocion.
- No puede existir otra promocion activa con la misma regla comercial para el mismo proveedor y zona.
- Las promociones listadas son activas; desactivar una promocion la retira del uso comercial.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Flujo 6: zonas

Objetivo: mantener zonas comerciales usadas por planes y promociones.

Secuencia:

1. Registrar zona con `LEAD-22`.
2. Listar zonas con `LEAD-23`.
3. Actualizar zona con `LEAD-25`.
4. Activar o desactivar zona con `LEAD-24`.

Reglas operativas:

- Una zona debe tener al menos una regla geografica.
- Cada regla combina `nivelGeografico`, `geoId` y `criterio`.
- No se pueden repetir reglas identicas dentro de la misma zona.
- Al actualizar zona, las reglas anteriores se reemplazan por las nuevas.
- Desactivar una zona puede afectar disponibilidad para nuevos planes o promociones.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Orden operativo sugerido

Para preparar catalogos comerciales desde cero:

1. Crear proveedores con `LEAD-01`.
2. Crear zonas con `LEAD-22`.
3. Crear cuentas publicitarias con `LEAD-04`.
4. Crear campanas con `LEAD-08`.
5. Crear adicionales con `LEAD-12`.
6. Crear planes con `LEAD-14`.
7. Crear promociones con `LEAD-19`.

Para mantenimiento diario:

1. Revisar proveedores, zonas y cuentas activas.
2. Ajustar campanas si cambia el WhatsApp operativo.
3. Mantener planes y adicionales por proveedor.
4. Desactivar promociones, planes, campanas o cuentas que ya no aplican.

## Limites del rol

Community mantiene catalogos comerciales. No gestiona leads individuales, asignaciones, ventas, cobranzas ni postventa.

Si un cambio de catalogo afecta leads ya creados, el frontend debe tratarlo como mantenimiento de catalogo y no como edicion directa de leads existentes.

## Criterio para frontend futuro

Este documento debe permitir entender responsabilidades y flujos. No debe decidir si se implementa como tablas, formularios, modales, pestañas o paneles de mantenimiento.
