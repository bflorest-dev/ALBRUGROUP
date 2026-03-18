package pe.albrugroup.gateway_service.presence;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
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

    private final ReactiveRedisTemplate<String, EmployeePresence> presenceRedisTemplate;
    private final ReactiveStringRedisTemplate stringRedisTemplate;
    private final Duration ttl;

    public PresenceService(
            ReactiveRedisTemplate<String, EmployeePresence> presenceRedisTemplate,
            ReactiveStringRedisTemplate stringRedisTemplate,
            @Value("${presence.ttl:PT2M}") Duration ttl
    ) {
        this.presenceRedisTemplate = presenceRedisTemplate;
        this.stringRedisTemplate = stringRedisTemplate;
        this.ttl = ttl;
    }

    public Mono<Void> registrarEmpleadoOnline(AuthenticatedUser user) {
        String employeeId = String.valueOf(user.empleadoId());
        EmployeePresence presence = EmployeePresence.builder()
                .empleadoId(user.empleadoId())
                .username(user.username())
                .nombreCompleto(user.nombreCompleto())
                .roles(user.roles())
                .status("ONLINE")
                .disponibilidad(Disponibilidad.DISPONIBLE)
                .lastSeen(Instant.now())
                .build();

        return presenceRedisTemplate.opsForValue()
                .get(PresenceKeys.employeeKey(user.empleadoId()))
                .defaultIfEmpty(EmployeePresence.builder().roles(List.of()).build())
                .flatMap(existingPresence -> {
                    Set<String> previousRoles = new HashSet<>(safeRoles(existingPresence.getRoles()));
                    Set<String> currentRoles = new HashSet<>(safeRoles(user.roles()));

                    Mono<Boolean> employeeWrite = presenceRedisTemplate.opsForValue()
                            .set(PresenceKeys.employeeKey(user.empleadoId()), presence, ttl);

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
                            .then(registerEmployee)
                            .then(removeOldRoles)
                            .then(addCurrentRoles);
                });
    }

    public Mono<Void> desconectarEmpleadoOffline(AuthenticatedUser user) {
        String employeeId = String.valueOf(user.empleadoId());

        return presenceRedisTemplate.opsForValue()
                .get(PresenceKeys.employeeKey(user.empleadoId()))
                .defaultIfEmpty(EmployeePresence.builder().roles(user.roles()).build())
                .flatMap(existingPresence -> {
                    Mono<Long> deleteEmployee = presenceRedisTemplate.delete(PresenceKeys.employeeKey(user.empleadoId()));
                    Mono<Long> removeEmployee = stringRedisTemplate.opsForSet()
                            .remove(PresenceKeys.employeeIndexKey(), employeeId);
                    Mono<Void> removeRoles = Flux.fromIterable(safeRoles(existingPresence.getRoles()))
                            .flatMap(role -> stringRedisTemplate.opsForSet()
                                    .remove(PresenceKeys.roleIndexKey(role), employeeId))
                            .then();

                    return deleteEmployee
                            .then(removeEmployee)
                            .then(removeRoles);
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
                    EmployeePresence updatedPresence = EmployeePresence.builder()
                            .empleadoId(existingPresence.getEmpleadoId())
                            .username(existingPresence.getUsername())
                            .nombreCompleto(existingPresence.getNombreCompleto())
                            .roles(existingPresence.getRoles())
                            .status(existingPresence.getStatus())
                            .disponibilidad(disponibilidad)
                            .lastSeen(Instant.now())
                            .build();
                    return presenceRedisTemplate.opsForValue().set(key, updatedPresence, ttl).then();
                });
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
                .lastSeen(presence.getLastSeen())
                .build();
    }
}
