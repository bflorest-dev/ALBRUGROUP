package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.response.GrupoCapacitacionRealtimeEvent;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class GrupoCapacitacionRealtimeNotifier {

    private static final String TOPIC = "/topic/grupos-capacitacion";

    private final SimpMessagingTemplate messagingTemplate;

    public void publishAfterCommit(String tipo, String origen, GrupoCapacitacion grupo) {
        GrupoCapacitacionRealtimeEvent event = GrupoCapacitacionRealtimeEvent.builder()
                .tipo(tipo)
                .origen(origen)
                .idGrupoCapacitacion(grupo.getId())
                .codigo(grupo.getCodigo())
                .estado(grupo.getEstado())
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
