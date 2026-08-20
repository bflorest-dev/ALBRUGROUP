#!/usr/bin/env sh

set -eu

# Prende presencia inmediata en Redis por 90s + shadow 120s.
# Si el asesor sigue en la web, el heartbeat normal deberia tomar el relevo.
#
# Ejecutar:
# docker exec -i albrugroup-redis-1 sh < schedule-service/scripts/fix_fabrizzio_2026_08_20_presence.sh

NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
JSON="{\"empleadoId\":2,\"username\":\"F71083767V@albru.sales.pe\",\"nombreCompleto\":\"Fabrizzio Farith Veliz Kruchinsky\",\"roles\":[\"ASESOR_VENTAS\"],\"status\":\"ONLINE\",\"disponibilidad\":\"DISPONIBLE\",\"disponibilidadDesde\":\"$NOW\",\"lastSeen\":\"$NOW\"}"

redis-cli SET presence:employee:2 "$JSON" EX 90
redis-cli SET presence:shadow:2 "$JSON" EX 120
redis-cli SADD presence:employees 2
redis-cli SADD presence:role:ASESOR_VENTAS:employees 2

redis-cli GET presence:employee:2
