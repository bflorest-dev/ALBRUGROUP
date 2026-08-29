package pe.albrugroup.gateway_service.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@Slf4j
@RequiredArgsConstructor
public class SessionInvalidationService {

    private final ReactiveStringRedisTemplate stringRedisTemplate;

    public Mono<Boolean> isInvalidated(Long empleadoId, Long sessionIssuedAt) {
        if (empleadoId == null || sessionIssuedAt == null) {
            return Mono.just(false);
        }
        return stringRedisTemplate.opsForValue()
                .get(SessionInvalidationKeys.userKey(empleadoId))
                .map(value -> sessionIssuedAt <= Long.parseLong(value))
                .defaultIfEmpty(false)
                .onErrorResume(error -> {
                    log.warn("No se pudo validar invalidacion de sesion para empleado {}", empleadoId, error);
                    return Mono.just(false);
                });
    }
}
