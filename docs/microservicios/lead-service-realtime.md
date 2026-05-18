# lead-service realtime

Este documento describe la capa WebSocket/STOMP agregada a `lead-service` para que el frontend pueda refrescar bandejas operativas cuando un lead cambia por registro, asignacion, contacto, tipificacion o edicion.

## Estado actual

- `lead-service` ya expone WebSocket/STOMP en `/ws/leads`.
- La conexion STOMP exige JWT en el header nativo `Authorization`.
- Los eventos se publican despues del commit de la transaccion. Si la operacion falla y no se guarda en BD, no se notifica al frontend.
- El payload del evento es liviano: sirve para saber que bandejas invalidar o refrescar, no reemplaza necesariamente el detalle completo del lead.
- `gateway-service` expone la ruta `/leads/ws/leads` y reenvia el trafico WebSocket a `lead-service`.
- En esta version se valida JWT al conectar, pero no hay autorizacion granular por topic. Esa limitacion se acepta temporalmente.

## Conexion frontend

Conexion recomendada desde frontend por `gateway-service`:

```ts
import { Client } from '@stomp/stompjs';

const token = authService.getAccessToken();

const client = new Client({
  brokerURL: 'ws://localhost:8080/leads/ws/leads',
  connectHeaders: {
    Authorization: `Bearer ${token}`,
  },
  reconnectDelay: 5000,
});

client.activate();
```

Conexion directa a `lead-service` solo para pruebas aisladas:

```ts
const client = new Client({
  brokerURL: 'ws://localhost:8083/ws/leads',
  connectHeaders: {
    Authorization: `Bearer ${token}`,
  },
  reconnectDelay: 5000,
});
```

En navegador, `connectHeaders.Authorization` viaja dentro del frame STOMP `CONNECT`, no como header HTTP del handshake WebSocket. Por eso `gateway-service` permite el handshake `/leads/ws/**` y `lead-service` valida el JWT al recibir el `CONNECT`.

## Topics disponibles

- `/topic/leads`: recibe todos los cambios de leads.
- `/topic/leads/etapa/PREVENTA`: cambios que afectan la etapa preventa.
- `/topic/leads/etapa/VENTA`: cambios que afectan la etapa venta.
- `/topic/leads/etapa/POSTVENTA`: cambios que afectan la etapa postventa.
- `/topic/leads/etapa/COBRANZA`: cambios que afectan la etapa cobranza.
- `/topic/leads/asesor/{idAsesor}`: cambios que afectan la bandeja del asesor indicado.

Para una bandeja operativa de asesor, el frontend debe suscribirse como minimo a:

```ts
client.onConnect = () => {
  client.subscribe(`/topic/leads/asesor/${empleadoId}`, message => {
    const event = JSON.parse(message.body) as LeadRealtimeEvent;
    refreshCurrentInbox(event);
  });
};
```

## Payload

```ts
type LeadRealtimeEvent = {
  tipo:
    | 'REGISTRO'
    | 'ASIGNACION'
    | 'CONTACTO'
    | 'TIPIFICACION'
    | 'SNAPSHOTS_ACTUALIZADOS'
    | 'DATOS_PREVENTA_ACTUALIZADOS'
    | 'DIRECCION_ACTUALIZADA'
    | 'OFERTA_COMERCIAL_ACTUALIZADA';
  idLead: number;
  etapa: 'PREVENTA' | 'VENTA' | 'POSTVENTA' | 'COBRANZA';
  etapaAnterior?: 'PREVENTA' | 'VENTA' | 'POSTVENTA' | 'COBRANZA' | null;
  estado: string;
  estadoPostventa?: string | null;
  idAsesorAsignado?: number | null;
  idAsesorAnterior?: number | null;
  codigoTipificacion?: string | null;
  codigoSubtipificacion?: string | null;
  occurredAt: string;
};
```

## Comportamiento esperado por flujo

### Asignacion de lead

Cuando se usa un endpoint de asignacion, `lead-service` publica un evento `ASIGNACION`.

El evento se envia a:

- `/topic/leads`
- `/topic/leads/etapa/{etapaActual}`
- `/topic/leads/asesor/{idAsesorAsignado}`
- `/topic/leads/asesor/{idAsesorAnterior}`, si existia un asesor anterior distinto

Caso esperado: si cualquier rol con capacidad de asignacion, incluido un administrador, asigna un lead al asesor `15`, el frontend del asesor `15`, suscrito a `/topic/leads/asesor/15`, recibe `ASIGNACION` y debe refrescar su bandeja actual.

Recomendacion frontend:

```ts
function refreshCurrentInbox(event: LeadRealtimeEvent) {
  if (event.tipo === 'ASIGNACION') {
    reloadInboxPage();
    return;
  }

  if (isLeadVisibleInCurrentView(event.idLead)) {
    reloadInboxPage();
  }
}
```

### Tipificacion

Cuando se tipifica un lead, `lead-service` publica `TIPIFICACION`.

Si la tipificacion cambia de etapa, el evento se envia tanto al topic de la etapa nueva como al topic de la etapa anterior. Esto permite que una bandeja remueva el lead y otra bandeja lo agregue o refresque.

Ejemplo: `PREVENTA -> VENTA`

- `/topic/leads/etapa/PREVENTA`
- `/topic/leads/etapa/VENTA`
- topic del asesor anterior, si aplica

### Modificacion de datos del lead

Las ediciones publican eventos especificos:

- `SNAPSHOTS_ACTUALIZADOS`
- `DATOS_PREVENTA_ACTUALIZADOS`
- `DIRECCION_ACTUALIZADA`
- `OFERTA_COMERCIAL_ACTUALIZADA`

Para estas operaciones, si el lead esta visible en la bandeja o detalle actual, el frontend debe refrescar la vista o volver a consultar el detalle.

### Contacto

Cuando se registra contacto, se publica `CONTACTO`.

Este evento normalmente cambia el estado de `ASIGNADO` a `EN_GESTION`, por lo que la bandeja del asesor debe refrescar si muestra estado o contadores.

### Registro o reingreso

Cuando ingresa o reingresa un lead, se publica `REGISTRO`.

Las bandejas GTR o vistas de entrada pueden suscribirse al topic de etapa para refrescar listados del dia.

## Ruta gateway-service

`gateway-service` tiene una ruta especifica para WebSocket:

- Entrada frontend: `/leads/ws/leads`
- Destino interno: `/ws/leads` en `lead-service`
- Variable de destino: `LEAD_SERVICE_WS_URI`
- Default: `ws://lead-service:8083`

La ruta WebSocket esta antes de la ruta HTTP general `/leads/**`, para que el upgrade WebSocket no se procese como una llamada HTTP comun.

## Estrategia recomendada para bandejas

El evento realtime debe usarse como senal de invalidacion:

- Si llega un evento para la bandeja activa, volver a consultar el listado paginado actual.
- Si el usuario esta en detalle del lead afectado, volver a consultar el detalle.
- Si llega un evento de otra etapa o asesor que no afecta la vista actual, ignorarlo.
- El frontend no debe asumir que el payload reemplaza la respuesta HTTP final; la fuente de verdad sigue siendo el endpoint REST correspondiente.

Esto mantiene el backend simple y evita que el frontend intente reconstruir localmente todos los filtros, paginacion y reglas de visibilidad.
