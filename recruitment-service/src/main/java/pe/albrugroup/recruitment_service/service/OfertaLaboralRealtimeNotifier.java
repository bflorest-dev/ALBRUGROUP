package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import pe.albrugroup.recruitment_service.entity.OfertaLaboral;
import pe.albrugroup.recruitment_service.entity.response.OfertaLaboralRealtimeEvent;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class OfertaLaboralRealtimeNotifier {

    private static final String TOPIC = "/topic/ofertas-laborales";

    private final SimpMessagingTemplate messagingTemplate;

    public void publishAfterCommit(String tipo, String origen, OfertaLaboral oferta) {
        OfertaLaboralRealtimeEvent event = OfertaLaboralRealtimeEvent.builder()
                .tipo(tipo)
                .origen(origen)
                .idOfertaLaboral(oferta.getId())
                .codigo(oferta.getCodigo())
                .estado(oferta.getEstado())
                .occurredAt(Instant.now())
                .build();

        Runnable publishAction = () -> messagingTemplate.convertAndSend(TOPIC, event);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publishAction.run();
                }
            });
            return;
        }

        publishAction.run();
    }
}
