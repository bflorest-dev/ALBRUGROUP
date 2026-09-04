# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personal interno de ALBRU GROUP que opera procesos de administracion, recursos humanos,
reclutamiento, ventas, GTR, backoffice, postventa y community desde una aplicacion con navegacion
y permisos definidos por rol. Para el rediseño del shell, `ADMINISTRADOR` es el caso de mayor
complejidad y funciona como prueba principal; los demas roles deben conservar una experiencia
coherente con menos opciones.

## Product Purpose

Centralizar el trabajo operativo de distintos equipos en una interfaz privada. El shell debe permitir
que cada persona identifique rapidamente su contexto, llegue a la herramienta correcta y mantenga
visibles su estado operativo y las acciones de sesion.

## Positioning

La navegacion se construye dinamicamente por rol, permisos y equipos activos, incluyendo jerarquias
de varios niveles y estados operativos en tiempo real dentro del mismo shell.

## Operating Context

Uso recurrente durante la jornada laboral, principalmente en escritorio y tablet, con soporte movil.
La navegacion convive con vistas densas de datos y flujos donde perder ancho util o contexto resulta
costoso. Algunos roles requieren selector de proveedor, alertas, control de asistencia y acceso a
acciones administrativas.

## Capabilities and Constraints

- Angular standalone con PrimeNG, PrimeIcons y Tabler Icons disponibles.
- Menu filtrado por rol con rutas directas, grupos y subgrupos anidados.
- Header de marca, navegacion con scroll propio y bloque de usuario siempre accesible.
- Estados activos, alertas, badges, selector de proveedor, asistencia, perfil y cierre de sesion.
- El sidebar actual funciona y debe permanecer disponible; el rediseño se implementa en paralelo.
- La alternativa propuesta usa un rail compacto permanente y un panel contextual superpuesto para
  revelar etiquetas y jerarquias sin reducir permanentemente el area de trabajo.
- Tema y acento pueden variar semanticamente por rol, sin convertir el color en decoracion.

## Brand Commitments

- Nombre de producto y empresa: ALBRU GROUP.
- Voz sobria, operativa y directa.
- `DESIGN_SYSTEM_V2.md` es una referencia visual apreciada: instrumento de precision, tipografia
  Archivo, datos en Spline Sans Mono, hairlines, superficies planas y un acento con significado.
  Puede evolucionar si una direccion nueva mejora claridad y navegacion.

## Evidence on Hand

- Sidebar actual funcional con navegacion real de todos los roles.
- Contrato documentado de layout, scroll y zonas persistentes.
- Sistema visual V2 y una implementacion de referencia en Bitacora.
- No se deben inventar clientes, metricas de negocio ni capacidades inexistentes.

## Product Principles

- El contexto operativo debe entenderse de un vistazo.
- La navegacion compleja no debe robar ancho permanente al trabajo principal.
- La jerarquia se revela progresivamente sin ocultar rutas ni estados importantes.
- El color comunica rol, estado o accion; nunca rellena espacio.
- Teclado, foco, contraste y area tactil son parte del comportamiento, no acabados opcionales.

## Accessibility & Inclusion

Navegacion completa por teclado, foco visible, nombres accesibles para controles iconicos, areas
tactiles suficientes, contraste legible y una alternativa de movimiento reducido. El comportamiento
debe seguir siendo comprensible sin depender exclusivamente del color.
