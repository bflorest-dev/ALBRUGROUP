package pe.albrugroup.gateway_service.presence;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.connection.ReactiveSubscription;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.ReactiveRedisMessageListenerContainer;
import org.springframework.stereotype.Component;
import reactor.core.Disposable;

@Component
public class PresenceExpirationListener {

    private final ReactiveRedisMessageListenerContainer listenerContainer;
    private final PresenceService presenceService;
    private final String expiredPattern;
    private Disposable subscription;

    public PresenceExpirationListener(
            ReactiveRedisConnectionFactory connectionFactory,
            PresenceService presenceService,
            @Value("${presence.redis.expired-pattern:__keyevent@*__:expired}") String expiredPattern
    ) {
        this.listenerContainer = new ReactiveRedisMessageListenerContainer(connectionFactory);
        this.presenceService = presenceService;
        this.expiredPattern = expiredPattern;
    }

    @PostConstruct
    public void subscribe() {
        subscription = listenerContainer.receive(PatternTopic.of(expiredPattern))
                .map(ReactiveSubscription.Message::getMessage)
                .map(buffer -> new String(buffer))
                .filter(message -> message.startsWith("presence:employee:"))
                .flatMap(presenceService::handlePresenceExpiration)
                .onErrorContinue((error, ignored) -> {
                })
                .subscribe();
    }

    @PreDestroy
    public void destroy() {
        if (subscription != null) {
            subscription.dispose();
        }
        listenerContainer.destroyLater().subscribe();
    }
}
