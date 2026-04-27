# Migracion masiva de leads legacy

Este seed toma el backup filtrado `clientes_campos_utiles_full.csv` y lo transforma a la estructura actual de `lead-service`.

## Como se ejecuta

- `docker-compose.yml` ahora monta `BACKUP` en `/seed-data/legacy`.
- `run-seeds.sh` sigue ejecutando `05-lead-migration-seed.sql` despues de `02-lead-seed.sql`.
- No hace falta mover el CSV a otra carpeta mientras el archivo siga llamandose `clientes_campos_utiles_full.csv`.

## Criterios de transformacion

- Se usa `telefono` limpio como `lead.lead` y se fija `prefijo = +51`.
- Si el CSV trae el mismo telefono varias veces, solo se toma una fila canonica.
- La prioridad favorece:
  - filas con tipificacion reconocible
  - filas con mas datos utiles
  - filas con actividad mas reciente
- `tipo_base` se traduce asi:
  - `LEADS` y `BASE` -> `WHATSAPP`
  - `MASIVO` -> `MASIVO`
  - `PREDICTIVO` -> `PREDICTIVO`
  - `REFERIDO` y `REFERIDOS` -> `REFERIDO`
  - `SEG LEAD` -> `RECONTACTO`
  - `FACEBOOK` -> `MESSENGER`
- `compania` no se inserta directo en `lead`.
  - primero se resuelve el `proveedor`
  - luego se busca una `campana` de ese proveedor
  - si el proveedor no tiene campana, se crea una `Migracion Legacy - {PROVEEDOR}`
- Siempre se crea `evento.REGISTRO`.
- Solo se crea `evento.TIPIFICACION` cuando la pareja `tipificacion/subtipificacion` existe en los catalogos actuales.
- `id_plan` se intenta resolver por `proveedor + precio + velocidad`.
- Si no hay match exacto de plan, igual se conservan `nombre_plan_snapshot`, `nombre_proveedor_snapshot` y `precio_plan_snapshot`.

## Matriz principal de tipificacion

- `Preventa completa / Venta cerrada` -> `PREVENTA_COMPLETA / VENTA_CERRADA`
- `Preventa incompleta / Preventa incompleta` -> `SCORE_PREVENTA / PREVENTA_INCOMPLETA`
- `Sin contacto / No contesta` -> `SIN_CONTACTO / NO_CONTESTA`
- `Sin contacto / Buzon` -> `SIN_CONTACTO / BUZON_DE_VOZ`
- `Sin contacto / Numero equivocado` -> `SIN_CONTACTO / NUMERO_EQUIVOCADO`
- `Sin contacto / Fuera de servicio` -> `SIN_CONTACTO / FUERA_DE_SERVICIO`
- `Seguimiento / Seguimiento` -> `SEGUIMIENTO / SEGUIMIENTO`
- `Seguimiento / Solo info` -> `SEGUIMIENTO / SOLO_INFORMACION`
- `Seguimiento / Gestion o chat` -> `SEGUIMIENTO / GESTION_CHAT`
- `Seguimiento / Llamada interrumpida` -> `SEGUIMIENTO / LLAMADA_INTERRUMPIDA`
- `Agendado / Agendado` -> `AGENDADO / AGENDADO`
- `Agendado / Consultara con familiar` -> `AGENDADO / CONSULTARA_CON_FAMILIAR`
- `Agendado / Fin de mes` -> `AGENDADO / FIN_DE_MES`
- `Rechazado / No desea` -> `RECHAZADO / NO_DESEA`
- `Rechazado / No califica` -> `RECHAZADO / NO_CALIFICA`
- `Rechazado / Con programacion` -> `RECHAZADO / CON_PROGRAMACION`
- `Rechazado / Venta cerrada desaprobada` -> `RECHAZADO / VC_DESAPROBADA`
- `Rechazado / Zona fraude` -> `RECHAZADO / ZONA_FRAUDE`
- `Sin facilidades / Sin cobertura` -> `SIN_FACILIDADES / SIN_COBERTURA`
- `Sin facilidades / Servicio activo` -> `SIN_FACILIDADES / SERVICIO_ACTIVO`
- `Sin facilidades / Edificio sin liberar` -> `SIN_FACILIDADES / EDIFICIO_SIN_LIBERAR`
- `Sin facilidades / Sin CTO` -> `SIN_FACILIDADES / SIN_CTO`
- `Retirado / No desea publicidad` -> `REITERADO / ND_PUBLICIDAD`
- `Lista negra / Lista negra` -> `LISTA_NEGRA / BLACKLIST`

## Alcance validado sobre el CSV

- Filas totales: `24949`
- Telefonos unicos detectados: `23105`
- Telefonos con duplicados: `1598`
- Filas involucradas en duplicados: `3442`
- Proveedor dominante: `WIN`
- Base dominante: `LEADS`, seguida por `MASIVO`

## Ejemplos de conversion

- `legacy id=1086`
  - origen: `WIN`, `LEADS`, `CAMPAÑA 08`, `Preventa completa / Venta cerrada`, `Duo`, `Fibra, WinTV Plus`, `850 Mbps`, `119.90`
  - destino: `base=WHATSAPP`, `campana` de proveedor `WIN`, `PREVENTA_COMPLETA / VENTA_CERRADA`, snapshots de plan y 2 eventos
- `legacy id=2316`
  - origen: `WIN`, `LEADS`, `CAMPAÑA 09`, `Sin facilidades / Sin cobertura`
  - destino: `base=WHATSAPP`, `campana` de proveedor `WIN`, `SIN_FACILIDADES / SIN_COBERTURA`
- `legacy id=2940`
  - origen: `WIN`, `MASIVO`, `MASIVO`, `Sin contacto / No contesta`
  - destino: `base=MASIVO`, `campana` de proveedor `WIN`, `SIN_CONTACTO / NO_CONTESTA`

## Limites de esta primera version

- El match de plan real depende de que existan planes cargados para ese proveedor en tu catalogo.
- Si despues aparecen nuevas combinaciones legacy, solo hay que ampliar los `CASE` del seed.
