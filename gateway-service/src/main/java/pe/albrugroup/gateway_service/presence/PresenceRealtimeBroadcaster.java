package pe.albrugroup.gateway_service.presence;

import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

@Component
public class PresenceRealtimeBroadcaster {

    private final Sinks.Many<PresenceRealtimeEvent> sink = Sinks.many().multicast().directBestEffort();

    public void publish(PresenceRealtimeEvent event) {
        sink.emitNext(event, Sinks.EmitFailureHandler.busyLooping(java.time.Duration.ofMillis(250)));
    }

    public Flux<PresenceRealtimeEvent> stream() {
        return sink.asFlux();
    }
}
