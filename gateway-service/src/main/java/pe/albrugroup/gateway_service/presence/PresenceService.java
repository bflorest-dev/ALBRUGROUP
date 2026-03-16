package pe.albrugroup.gateway_service.presence;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;
import pe.albrugroup.gateway_service.security.AuthenticatedUser;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    private List<String> safeRoles(List<String> roles) {
        return roles == null ? List.of() : roles;
    }
}
