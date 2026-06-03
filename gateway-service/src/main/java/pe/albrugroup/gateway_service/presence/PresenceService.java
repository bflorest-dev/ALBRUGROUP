package pe.albrugroup.gateway_service.presence;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pe.albrugroup.gateway_service.entity.enums.Disponibilidad;
import pe.albrugroup.gateway_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.gateway_service.entity.response.ConnectedStatusResponse;
import pe.albrugroup.gateway_service.entity.response.ConnectedUserResponse;
import pe.albrugroup.gateway_service.security.AuthenticatedUser;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PresenceService {

    private static final String PRESENCE_KEY_PREFIX = "presence:employee:";

    private final ReactiveRedisTemplate<String, EmployeePresence> presenceRedisTemplate;
    private final ReactiveStringRedisTemplate stringRedisTemplate;
    private final PresenceRealtimeBroadcaster broadcaster;
    private final Duration ttl;

    public PresenceService(
            ReactiveRedisTemplate<String, EmployeePresence> presenceRedisTemplate,
            ReactiveStringRedisTemplate stringRedisTemplate,
            PresenceRealtimeBroadcaster broadcaster,
            @Value("${presence.ttl:PT2M}") Duration ttl
    ) {
        this.presenceRedisTemplate = presenceRedisTemplate;
        this.stringRedisTemplate = stringRedisTemplate;
        this.broadcaster = broadcaster;
        this.ttl = ttl;
    }

    public Mono<Void> registrarEmpleadoOnline(AuthenticatedUser user) {
        return upsertPresence(user)
                .doOnNext(result -> {
                    if (!result.existed()) {
                        broadcaster.publish(buildEvent("PRESENCE_ONLINE", result.presence(), true, "ONLINE_ENDPOINT"));
                    }
                })
                .then();
    }

    public Mono<Void> renovarHeartbeat(AuthenticatedUser user) {
        return upsertPresence(user)
                .doOnNext(result -> {
                    if (!result.existed()) {
                        broadcaster.publish(buildEvent("PRESENCE_ONLINE", result.presence(), true, "HEARTBEAT_RECOVERY"));
                    }
                })
                .then();
    }

    public Mono<Void> desconectarEmpleadoOffline(AuthenticatedUser user) {
        String employeeId = String.valueOf(user.empleadoId());

        return presenceRedisTemplate.opsForValue()
                .get(PresenceKeys.employeeKey(user.empleadoId()))
                .defaultIfEmpty(EmployeePresence.builder().roles(user.roles()).build())
                .flatMap(existingPresence -> {
                    EmployeePresence offlinePresence = EmployeePresence.builder()
                            .empleadoId(user.empleadoId())
                            .username(existingPresence.getUsername())
                            .nombreCompleto(existingPresence.getNombreCompleto() == null ? user.nombreCompleto() : existingPresence.getNombreCompleto())
                            .roles(safeRoles(existingPresence.getRoles()).isEmpty() ? user.roles() : existingPresence.getRoles())
                            .status("OFFLINE")
                            .disponibilidad(existingPresence.getDisponibilidad())
                            .lastSeen(Instant.now())
                            .build();

                    return removePresence(employeeId, offlinePresence)
                            .doOnSuccess(ignored ->
                                    broadcaster.publish(buildEvent("PRESENCE_OFFLINE", offlinePresence, false, "OFFLINE_ENDPOINT"))
                            );
                });
    }

    public Mono<List<ConnectedUserResponse>> listarUsuariosConectados(PuestoTrabajo role) {
        return obtenerEmpleadoIdsActivos(role)
                .collectList()
                .flatMap(employeeIds -> {
                    if (employeeIds.isEmpty()) {
                        return Mono.just(List.of());
                    }

                    List<String> employeeKeys = employeeIds.stream()
                            .map(Long::valueOf)
                            .map(PresenceKeys::employeeKey)
                            .toList();

                    return presenceRedisTemplate.opsForValue()
                            .multiGet(employeeKeys)
                            .flatMap(presences -> {
                                Set<String> activeIds = presences.stream()
                                        .filter(Objects::nonNull)
                                        .map(EmployeePresence::getEmpleadoId)
                                        .map(String::valueOf)
                                        .collect(Collectors.toSet());

                                Set<String> staleIds = employeeIds.stream()
                                        .filter(employeeId -> !activeIds.contains(employeeId))
                                        .collect(Collectors.toSet());

                                return limpiarIndicesHuerfanos(role, staleIds)
                                        .thenReturn(presences.stream()
                                                .filter(Objects::nonNull)
                                                .map(this::toResponse)
                                                .sorted(Comparator.comparing(ConnectedUserResponse::getNombreCompleto, String.CASE_INSENSITIVE_ORDER))
                                                .toList());
                            });
                });
    }

    public Mono<ConnectedStatusResponse> estaConectado(Long empleadoId) {
        return stringRedisTemplate.hasKey(PresenceKeys.employeeKey(empleadoId))
                .map(connected -> ConnectedStatusResponse.builder()
                        .empleadoId(empleadoId)
                        .conectado(Boolean.TRUE.equals(connected))
                        .build());
    }

    public Mono<Void> actualizarDisponibilidad(AuthenticatedUser user, Disponibilidad disponibilidad) {
        String key = PresenceKeys.employeeKey(user.empleadoId());

        return presenceRedisTemplate.opsForValue()
                .get(key)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "El empleado no tiene presencia activa en Redis"
                )))
                .flatMap(existingPresence -> {
                    boolean changed = existingPresence.getDisponibilidad() != disponibilidad;
                    // Solo se reinicia cuando la disponibilidad realmente cambia de valor.
                    Instant disponibilidadDesde = changed || existingPresence.getDisponibilidadDesde() == null
                            ? Instant.now()
                            : existingPresence.getDisponibilidadDesde();
                    EmployeePresence updatedPresence = EmployeePresence.builder()
                            .empleadoId(existingPresence.getEmpleadoId())
                            .username(existingPresence.getUsername())
                            .nombreCompleto(existingPresence.getNombreCompleto())
                            .roles(existingPresence.getRoles())
                            .status(existingPresence.getStatus())
                            .disponibilidad(disponibilidad)
                            .disponibilidadDesde(disponibilidadDesde)
                            .lastSeen(Instant.now())
                            .build();

                    return writePresence(updatedPresence, existingPresence.getRoles(), existingPresence.getRoles())
                            .doOnSuccess(ignored -> {
                                if (changed) {
                                    broadcaster.publish(buildEvent(
                                            "PRESENCE_DISPONIBILIDAD_ACTUALIZADA",
                                            updatedPresence,
                                            true,
                                            "DISPONIBILIDAD_ENDPOINT"
                                    ));
                                }
                            });
                });
    }

    public Mono<Void> handlePresenceExpiration(String expiredKey) {
        Long empleadoId = parseEmployeeId(expiredKey);
        if (empleadoId == null) {
            return Mono.empty();
        }

        String employeeId = String.valueOf(empleadoId);
        String shadowKey = PresenceKeys.employeeShadowKey(empleadoId);
        String activeKey = PresenceKeys.employeeKey(empleadoId);

        return stringRedisTemplate.hasKey(activeKey)
                .flatMap(exists -> {
                    if (Boolean.TRUE.equals(exists)) {
                        return Mono.empty();
                    }

                    return presenceRedisTemplate.opsForValue()
                            .get(shadowKey)
                            .flatMap(shadowPresence -> removePresence(employeeId, shadowPresence)
                                    .doOnSuccess(ignored -> broadcaster.publish(buildEvent(
                                            "PRESENCE_EXPIRED",
                                            shadowPresence,
                                            false,
                                            "REDIS_TTL"
                                    ))))
                            .switchIfEmpty(stringRedisTemplate.opsForSet()
                                    .remove(PresenceKeys.employeeIndexKey(), employeeId)
                                    .then());
                });
    }

    private Mono<PresenceUpsertResult> upsertPresence(AuthenticatedUser user) {
        return presenceRedisTemplate.opsForValue()
                .get(PresenceKeys.employeeKey(user.empleadoId()))
                .flatMap(existingPresence -> persistPresence(user, existingPresence, true))
                .switchIfEmpty(persistPresence(user, null, false));
    }

    private Mono<PresenceUpsertResult> persistPresence(
            AuthenticatedUser user,
            EmployeePresence existingPresence,
            boolean existed
    ) {
        Set<String> previousRoles = new HashSet<>(safeRoles(existingPresence == null ? List.of() : existingPresence.getRoles()));
        Set<String> currentRoles = new HashSet<>(safeRoles(user.roles()));
        Disponibilidad disponibilidad = existingPresence == null || existingPresence.getDisponibilidad() == null
                ? Disponibilidad.DISPONIBLE
                : existingPresence.getDisponibilidad();
        // El heartbeat NO debe reiniciar el inicio de la disponibilidad: se conserva el existente.
        Instant disponibilidadDesde = existingPresence == null || existingPresence.getDisponibilidadDesde() == null
                ? Instant.now()
                : existingPresence.getDisponibilidadDesde();

        EmployeePresence presence = EmployeePresence.builder()
                .empleadoId(user.empleadoId())
                .username(user.username())
                .nombreCompleto(user.nombreCompleto())
                .roles(user.roles())
                .status("ONLINE")
                .disponibilidad(disponibilidad)
                .disponibilidadDesde(disponibilidadDesde)
                .lastSeen(Instant.now())
                .build();

        return writePresence(presence, previousRoles, currentRoles)
                .thenReturn(new PresenceUpsertResult(presence, existed));
    }

    private Mono<Void> writePresence(EmployeePresence presence, List<String> previousRoles, List<String> currentRoles) {
        return writePresence(presence, new HashSet<>(safeRoles(previousRoles)), new HashSet<>(safeRoles(currentRoles)));
    }

    private Mono<Void> writePresence(EmployeePresence presence, Set<String> previousRoles, Set<String> currentRoles) {
        String employeeId = String.valueOf(presence.getEmpleadoId());

        Mono<Boolean> employeeWrite = presenceRedisTemplate.opsForValue()
                .set(PresenceKeys.employeeKey(presence.getEmpleadoId()), presence, ttl);

        Mono<Boolean> shadowWrite = presenceRedisTemplate.opsForValue()
                .set(PresenceKeys.employeeShadowKey(presence.getEmpleadoId()), presence, ttl.plusSeconds(30));

        Mono<Long> registerEmployee = stringRedisTemplate.opsForSet()
                .add(PresenceKeys.employeeIndexKey(), employeeId);

        Mono<Void> removeOldRoles = Flux.fromIterable(previousRoles)
                .filter(role -> !currentRoles.contains(role))
                .flatMap(role -> stringRedisTemplate.opsForSet()
                        .remove(PresenceKeys.roleIndexKey(role), employeeId))
                .then();

        Mono<Void> addCurrentRoles = Flux.fromIterable(currentRoles)
                .flatMap(role -> stringRedisTemplate.opsForSet()
                        .add(PresenceKeys.roleIndexKey(role), employeeId))
                .then();

        return employeeWrite
                .then(shadowWrite)
                .then(registerEmployee)
                .then(removeOldRoles)
                .then(addCurrentRoles);
    }

    private List<String> safeRoles(List<String> roles) {
        return roles == null ? List.of() : roles;
    }

    private Flux<String> obtenerEmpleadoIdsActivos(PuestoTrabajo role) {
        String key = role == null
                ? PresenceKeys.employeeIndexKey()
                : PresenceKeys.roleIndexKey(role.name());
        return stringRedisTemplate.opsForSet().members(key);
    }

    private Mono<Long> limpiarIndicesHuerfanos(PuestoTrabajo role, Set<String> staleIds) {
        if (staleIds == null || staleIds.isEmpty()) {
            return Mono.just(0L);
        }

        Mono<Long> removeGlobal = stringRedisTemplate.opsForSet()
                .remove(PresenceKeys.employeeIndexKey(), staleIds.toArray(String[]::new));

        if (role == null) {
            return removeGlobal;
        }

        return removeGlobal.then(stringRedisTemplate.opsForSet()
                .remove(PresenceKeys.roleIndexKey(role.name()), staleIds.toArray(String[]::new)));
    }

    private ConnectedUserResponse toResponse(EmployeePresence presence) {
        return ConnectedUserResponse.builder()
                .empleadoId(presence.getEmpleadoId())
                .nombreCompleto(presence.getNombreCompleto())
                .roles(presence.getRoles())
                .status(presence.getStatus())
                .disponibilidad(presence.getDisponibilidad())
                .disponibilidadDesde(presence.getDisponibilidadDesde())
                .lastSeen(presence.getLastSeen())
                .build();
    }

    private Mono<Void> removePresence(String employeeId, EmployeePresence presence) {
        Long empleadoId = Long.valueOf(employeeId);
        Mono<Long> deleteEmployee = presenceRedisTemplate.delete(PresenceKeys.employeeKey(empleadoId));
        Mono<Long> deleteShadow = presenceRedisTemplate.delete(PresenceKeys.employeeShadowKey(empleadoId));
        Mono<Long> removeEmployee = stringRedisTemplate.opsForSet()
                .remove(PresenceKeys.employeeIndexKey(), employeeId);
        Mono<Void> removeRoles = Flux.fromIterable(safeRoles(presence.getRoles()))
                .flatMap(role -> stringRedisTemplate.opsForSet()
                        .remove(PresenceKeys.roleIndexKey(role), employeeId))
                .then();

        return deleteEmployee
                .then(deleteShadow)
                .then(removeEmployee)
                .then(removeRoles);
    }

    private PresenceRealtimeEvent buildEvent(String tipo, EmployeePresence presence, boolean online, String source) {
        return PresenceRealtimeEvent.builder()
                .tipo(tipo)
                .empleadoId(presence.getEmpleadoId())
                .nombreCompleto(presence.getNombreCompleto())
                .roles(safeRoles(presence.getRoles()))
                .disponibilidad(presence.getDisponibilidad() == null ? null : presence.getDisponibilidad().name())
                .lastSeen(presence.getLastSeen())
                .online(online)
                .source(source)
                .occurredAt(Instant.now())
                .build();
    }

    private Long parseEmployeeId(String expiredKey) {
        if (!expiredKey.startsWith(PRESENCE_KEY_PREFIX)) {
            return null;
        }

        try {
            return Long.valueOf(expiredKey.substring(PRESENCE_KEY_PREFIX.length()));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private record PresenceUpsertResult(EmployeePresence presence, boolean existed) {
    }
}
