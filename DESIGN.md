---
name: ALBRU GROUP
description: Consola operativa de precision para trabajo interno multirol.
colors:
  ground: "#eef0f3"
  panel: "#ffffff"
  panel-secondary: "#f6f7f9"
  ink: "#171b22"
  ink-muted: "#5a6472"
  line: "#dce0e7"
  line-strong: "#c6ccd5"
  signal: "#b5680e"
  signal-fill: "#e79a3a"
  focus: "#2c6e8f"
  admin-role: "#103528"
typography:
  headline:
    fontFamily: "Archivo, Segoe UI, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Archivo, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  data:
    fontFamily: "Spline Sans Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  control: "8px"
  panel: "11px"
  modal: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "30px"
components:
  nav-item:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  nav-item-active:
    backgroundColor: "{colors.panel-secondary}"
    textColor: "{colors.signal}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
---

# Design System: ALBRU GROUP

## Overview

**Creative North Star: "Consola de precision"**

La interfaz se siente como un instrumento operativo serio: superficies frias y limpias, jerarquia
firme, lineas finas y color escaso con significado. La densidad es deliberada y comoda; el sistema
privilegia orientacion, legibilidad y velocidad sobre decoracion.

**Key Characteristics:**

- Estructura por hairlines y planos, no por tarjetas apiladas.
- Un acento reservado para accion o estado dominante.
- Datos reales en mono; lenguaje y navegacion en Archivo.
- Color de rol como contexto semantico, sin teñir toda la interfaz.

## Colors

Neutros frios sostienen el trabajo. El ambar es señal; el color de rol identifica contexto y nunca
reemplaza estados de negocio.

**The One Signal Rule.** El acento fuerte aparece solo donde comunica la accion o estado dominante.

## Typography

**Display and Body Font:** Archivo, con Segoe UI como respaldo.

**Data Font:** Spline Sans Mono, exclusivamente para mediciones, codigos, fechas y conteos.

La jerarquia nace de escala, peso y ritmo. Las etiquetas de grupo pueden usar mayusculas compactas;
el texto de navegacion conserva caja natural para leerse rapidamente.

**The Honest Mono Rule.** Mono significa dato real; nunca se usa para simular una estetica tecnica.

## Layout

El shell reserva el maximo ancho al trabajo. El sidebar nuevo usa un rail compacto permanente y
revela complejidad en capas superpuestas. Encabezado, navegacion y usuario conservan zonas propias;
solo la lista de rutas puede desplazarse. El layout responde a contenido, no a una cantidad fija de
opciones.

## Elevation & Depth

Las superficies permanecen planas por defecto. Hairlines y cambios tonales crean estructura; la
sombra aparece solo en overlays, drawers y elementos que realmente se separan del plano.

**The Earned Elevation Rule.** Un elemento recibe sombra solo cuando se mueve sobre otro plano.

## Shapes

Controles con esquinas suavemente curvas de 7–8px; paneles entre 9–12px. Pills se reservan para
estados y conteos. Los bordes son siempre hairlines de 1px.

## Components

### Navigation

Los iconos ocupan un slot estable. Hover, foco y activo son distintos; el estado activo combina
contraste tonal, indicador de 2px y etiqueta accesible. Los paneles contextuales conservan la ruta
padre visible y permiten profundizar sin cerrar prematuramente. Hover o foco abren el panel; un clic
en el rail reafirma la seleccion sin cerrarlo y confirma la accion con dos pulsos ambar en el
perimetro. Con movimiento reducido, la confirmacion se conserva como un borde estatico breve. El
mouseleave es el cierre implicito; `Escape`, el boton de cierre y la navegacion son cierres explicitos.
Cuando la ruta supera el ancho disponible, cada cambio de nivel ancla automaticamente el breadcrumb
en su extremo derecho sin desactivar el desplazamiento horizontal manual.
Las opciones de navegacion usan filas compactas de 48px y esquinas de 6px. En los grupos, el conteo
de opciones comparte la linea principal y se alinea inmediatamente antes del indicador de avance.
El perfil conserva el avatar claro al abrirse y comunica seleccion mediante un anillo ambar. Sus
herramientas administrativas reutilizan las filas compactas de navegacion y se agrupan arriba; el
cierre de sesion permanece aislado al pie por ser una accion de salida.
La marca del rail usa un simbolo generico de empresa y un reflejo diagonal breve cada siete segundos.
Es un detalle ambiental, no una alerta; desaparece por completo con movimiento reducido.

### Buttons and Fields

Controles de 8px, tipografia 12.5–14px, foco de 2px y estados completos. El primario usa la señal
reservada; el secundario permanece neutral.

### Overlays

Paneles superpuestos con fondo opaco, borde fino y sombra direccional. El flyout administrativo usa
un scrim funcional con oscurecimiento suave y blur para mantener el foco sin desplazar la vista. Este
tratamiento pertenece al estado abierto y nunca se usa como decoracion permanente.

## Do's and Don'ts

### Do:

- **Do** conservar el area de trabajo como superficie dominante.
- **Do** mostrar foco visible, tooltips y nombres accesibles en controles iconicos.
- **Do** usar color de rol como una firma contenida y consistente.

### Don't:

- **Don't** usar glass o blur decorativo en navegacion densa.
- **Don't** anidar tarjetas para fabricar jerarquia.
- **Don't** depender solo del color para comunicar seleccion o estado.
- **Don't** estirar las opciones para rellenar la altura disponible.
