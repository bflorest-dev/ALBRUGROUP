# Frontend Architecture

## Objetivo

Definir una convención estable para el frontend basada en `Smart Component + Facade + Presentational Components`, de modo que la lógica funcional, la orquestación de estado y el renderizado visual queden desacoplados.

La meta es permitir:
- cambiar diseño o estructura visual sin afectar reglas de negocio
- cambiar reglas de negocio o flujos sin reescribir componentes visuales
- escalar features sin concentrar toda la lógica en componentes de página

## Principios

- Cada feature debe organizarse por responsabilidad, no por tipo técnico global.
- El componente de página no debe hablar directamente con HTTP.
- La lógica de estado y orquestación debe vivir en un facade.
- Los componentes presentacionales no deben conocer servicios, endpoints ni detalles de persistencia.
- Los modelos de request/response del backend no deben contaminar innecesariamente la capa visual.

## Capas

### 1. Smart Component

Responsabilidad:
- componer la página
- conectar la ruta con el facade
- pasar datos a componentes hijos
- escuchar eventos emitidos por componentes hijos

Reglas:
- puede inyectar el facade
- no debe inyectar servicios HTTP del feature
- no debe contener lógica de negocio compleja
- no debe concentrar manejo manual de estado remoto si eso puede vivir en el facade

Ejemplo de responsabilidad correcta:
- abrir una sección
- leer params de ruta
- delegar `load`, `create`, `update`, `filter` al facade

### 2. Facade

Responsabilidad:
- exponer estado reactivo del feature
- encapsular llamadas a servicios
- orquestar carga, errores, éxito y transformaciones de datos
- centralizar reglas funcionales de frontend

Reglas:
- puede inyectar servicios de datos
- debe exponer una API simple para la página
- debe ser la única puerta de entrada funcional del feature desde la UI
- debe evitar lógica de renderizado o decisiones puramente visuales

Ejemplo de API esperada:
- `loadOffers()`
- `updateOfferStatus(id, estado)`
- `createOffer(payload)`
- `offers()`
- `isLoading()`
- `error()`

### 3. Presentational Components

Responsabilidad:
- renderizar datos
- emitir eventos de interacción

Reglas:
- solo reciben `input` y emiten `output`
- no deben inyectar facades ni servicios de datos
- no deben conocer endpoints, DTOs HTTP ni reglas de negocio de backend
- pueden tener lógica local de UI si es puramente visual o de interacción inmediata

Ejemplo de lógica permitida:
- expandir/cerrar un panel local
- gestionar foco
- mostrar estados visuales
- formatear texto para render

Ejemplo de lógica no permitida:
- llamar API
- decidir reglas de negocio
- sincronizar entidades con backend

### 4. Data Services

Responsabilidad:
- encapsular acceso HTTP
- mapear requests/responses
- mantener el detalle de endpoints fuera de la UI

Reglas:
- no deben contener lógica de pantalla
- no deben manejar estado de UI
- devuelven datos y errores al facade

## Dependencias permitidas

Flujo correcto:

`Page Component -> Facade -> Data Service -> API`

`Page Component -> Presentational Component`

`Presentational Component -> Output -> Page Component -> Facade`

Flujos prohibidos:

- `Presentational Component -> Service`
- `Presentational Component -> Facade`
- `Page Component -> HTTP Service`
- `Presentational Component -> API DTOs`, salvo casos triviales y controlados

## Estructura sugerida por feature

Ejemplo:

```text
frontend/src/app/features/admin/employability/
  facade/
    employability.facade.ts
  services/
    employability-api.service.ts
  models/
    employability.vm.ts
    employability-form.model.ts
  pages/
    admin-employability-page/
      admin-employability-page.component.ts
      admin-employability-page.component.html
      admin-employability-page.component.scss
  components/
    offer-list/
      offer-list.component.ts
      offer-list.component.html
      offer-list.component.scss
    offer-card/
      offer-card.component.ts
      offer-card.component.html
      offer-card.component.scss
    offer-status-form/
      offer-status-form.component.ts
      offer-status-form.component.html
      offer-status-form.component.scss
```

## Convenciones

- Un facade por feature principal.
- Si una pantalla crece mucho pero sigue perteneciendo al mismo flujo, mantener el mismo facade mientras la cohesión siga siendo clara.
- Si aparece un subdominio funcional distinto, crear otro facade.
- Los componentes visuales reutilizables del feature viven dentro del feature.
- Solo mover algo a `shared` cuando ya esté probado que sirve para más de un feature.
- Ningún componente debe concentrar la pantalla completa. Una página con tabla principal + varios diálogos + drawer se divide en sub-componentes (uno por bloque), no se deja en un solo archivo.

## Tamaño de componentes (budget de estilos)

El `anyComponentStyle` budget de Angular (warning 8 kB / error 12 kB en `angular.json`) es una señal de organización, no de rendimiento. Cuando un componente lo dispara, la respuesta correcta es **dividirlo**, no subir el budget.

Indicadores de que toca dividir:

- Template de más de ~300-400 líneas o con bloques visuales claramente independientes.
- SCSS sobre ~8 kB o con paletas/estilos repetidos.

Patrón de división (ver `features/gtr` como referencia):

- La página queda como orquestador delgado y provee el facade.
- Cada bloque (tabla, drawer, cada diálogo) es un sub-componente `OnPush` que comparte ese facade por DI; la coordinación sigue por signals, sin reescribir lógica.
- Los estilos pesados compartidos entre sub-componentes se extraen a un partial SCSS del feature (`_*-shared.scss`) consumido con `@use`.

Subir el budget solo es un parche temporal documentado para desbloquear un build; debe revertirse al refactorizar. La regla normativa completa está en `AGENTS.md`.

## Estado

- El estado remoto del feature debe vivir en el facade.
- El estado efímero puramente visual puede vivir en el presentational component o en la página.
- Si un estado visual afecta reglas del flujo completo, debe subir al facade.

Ejemplos de estado del facade:
- listas cargadas desde API
- loading
- error
- selección funcional
- filtros persistentes de pantalla

Ejemplos de estado local:
- dropdown abierto
- foco actual
- animación activa
- expansión visual temporal

### Operational Gate

En este proyecto existe una regla transversal para pantallas operativas como `GTR`, `ASESOR_VENTAS` y `BACKOFFICE`.

Objetivo:
- evitar que la UI permita ver o modificar datos operativos cuando el usuario aun no esta habilitado para ese flujo
- centralizar esta decision en una sola capa reutilizable

Reglas:
- la decision no debe duplicarse manualmente en cada boton, tabla o formulario
- la puerta de control debe vivir en `core` y exponerse a los features como una dependencia reutilizable
- la pagina o facade consume la gate; no redefine la regla base

Senales principales:
- `canDisplayOperationalData`: controla si la pantalla puede mostrar bandejas, tablas o datos operativos
- `canMutateOperationalData`: controla si la pantalla puede ejecutar acciones como asignar, guardar, tipificar o editar

Interpretacion funcional:
- `display` y `mutate` no siempre significan lo mismo
- un flujo puede permitir mostrar datos antes de permitir modificaciones
- las acciones operativas solo deben habilitarse cuando el usuario esta realmente operativo

Regla de implementacion:
- si una vista necesita bloquear acciones segun asistencia, presencia o estado operativo, debe consumir `OperationalGateService`
- si el bloqueo afecta a todo el flujo, la decision debe concentrarse en el facade o en un servicio de `core`, no en condiciones dispersas dentro del HTML

Beneficio esperado:
- mantener consistencia visual y funcional entre vistas
- evitar regresiones donde una pantalla deja editar aunque otra equivalente no lo permita
- poder ajustar la regla operativa en un solo punto

## Modelos

Separar cuando aporte claridad:

- `Request/Response models`: representan contratos con backend
- `View models`: representan lo que la UI necesita mostrar
- `Form models`: representan la estructura del formulario

No es obligatorio crear capas extra si el caso es trivial, pero sí cuando:
- el DTO backend arrastra demasiados campos
- la UI combina varias fuentes
- la estructura visual empieza a divergir del contrato HTTP

## Testing

- Facade: pruebas de flujos, estado, errores y orquestación
- Presentational components: pruebas de render y emisión de eventos
- Page components: pruebas mínimas de integración con facade y composición
- Services: pruebas de integración HTTP solo donde aporte valor

## Aplicación en este proyecto

Estado actual observado:
- ya existe separación entre servicios, modelos y vistas
- todavía hay lógica de orquestación concentrada en algunos componentes de página

Dirección deseada:
- mover la lógica funcional de páginas complejas hacia facades
- dividir páginas grandes en componentes presentacionales pequeños
- mantener HTML y SCSS libres de decisiones funcionales

## Regla práctica

Si un cambio de diseño obliga a tocar llamadas HTTP o reglas de negocio, la arquitectura está mal separada.

Si un cambio de flujo obliga a reescribir componentes visuales sin razón real, la arquitectura está mal separada.
