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
        EmployeePresence presence = EmployeePresence.builder()
                .empleadoId(user.empleadoId())
                .username(user.username())
                .nombreCompleto(user.nombreCompleto())
                .roles(user.roles())
                .status("ONLINE")
                .lastSeen(Instant.now())
                .build();

        Mono<Boolean> employeeWrite = presenceRedisTemplate.opsForValue()
                .set(PresenceKeys.employeeKey(user.empleadoId()), presence, ttl);

        Mono<Long> clearOldRoleKeys = stringRedisTemplate.keys(PresenceKeys.rolePatternForEmployee(user.empleadoId()))
                .collectList()
                .flatMap(keys -> keys.isEmpty()
                        ? Mono.just(0L)
                        : stringRedisTemplate.delete(Flux.fromIterable(keys)));

        Mono<Void> roleWrites = Flux.fromIterable(user.roles())
                .flatMap(role -> stringRedisTemplate.opsForValue()
                        .set(PresenceKeys.roleKey(role, user.empleadoId()), "1", ttl))
                .then();

        return employeeWrite
                .then(clearOldRoleKeys)
                .then(roleWrites);
    }

    public Mono<Void> desconectarEmpleadoOffline(AuthenticatedUser user) {
        Mono<Long> deleteEmployee = presenceRedisTemplate.delete(PresenceKeys.employeeKey(user.empleadoId()));
        Mono<Long> deleteRoleKeys = stringRedisTemplate.keys(PresenceKeys.rolePatternForEmployee(user.empleadoId()))
                .collectList()
                .flatMap(keys -> keys.isEmpty()
                        ? Mono.just(0L)
                        : stringRedisTemplate.delete(Flux.fromIterable(keys)));

        return deleteEmployee.then(deleteRoleKeys).then();
    }
}
