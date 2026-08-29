package pe.albrugroup.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import pe.albrugroup.auth_service.security.SessionInvalidationKeys;

import java.time.Duration;

@Service
@Slf4j
@RequiredArgsConstructor
public class SessionInvalidationService {

    private final StringRedisTemplate stringRedisTemplate;

    @Value("${session.invalidation.ttl:24h}")
    private Duration invalidationTtl;

    public void invalidateAfterCommit(Long empleadoId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    invalidate(empleadoId);
                }
            });
            return;
        }
        invalidate(empleadoId);
    }

    public boolean isInvalidated(Long empleadoId, Long sessionIssuedAt) {
        if (empleadoId == null || sessionIssuedAt == null) {
            return false;
        }
        try {
            String value = stringRedisTemplate.opsForValue().get(SessionInvalidationKeys.userKey(empleadoId));
            if (value == null || value.isBlank()) {
                return false;
            }
            return sessionIssuedAt <= Long.parseLong(value);
        } catch (RuntimeException ex) {
            log.warn("No se pudo validar invalidacion de sesion para empleado {}", empleadoId, ex);
            return false;
        }
    }

    private void invalidate(Long empleadoId) {
        try {
            stringRedisTemplate.opsForValue().set(
                    SessionInvalidationKeys.userKey(empleadoId),
                    String.valueOf(System.currentTimeMillis()),
                    invalidationTtl
            );
        } catch (RuntimeException ex) {
            log.warn("No se pudo registrar invalidacion de sesion para empleado {}", empleadoId, ex);
        }
    }
}
