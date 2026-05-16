package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.LeadRealtimeEvent;

@Service
@RequiredArgsConstructor
public class LeadRealtimeNotifier {

    private static final String TOPIC_ALL = "/topic/leads";
    private static final String TOPIC_ETAPA = "/topic/leads/etapa/";
    private static final String TOPIC_ASESOR = "/topic/leads/asesor/";

    private final SimpMessagingTemplate messagingTemplate;

    public void publishAfterCommit(LeadRealtimeEvent event) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish(event);
                }
            });
            return;
        }

        publish(event);
    }

    private void publish(LeadRealtimeEvent event) {
        messagingTemplate.convertAndSend(TOPIC_ALL, event);
        publishEtapa(event.getEtapa(), event);
        if (event.getEtapaAnterior() != event.getEtapa()) {
            publishEtapa(event.getEtapaAnterior(), event);
        }

        publishAsesor(event.getIdAsesorAsignado(), event);
        if (!equals(event.getIdAsesorAnterior(), event.getIdAsesorAsignado())) {
            publishAsesor(event.getIdAsesorAnterior(), event);
        }
    }

    private void publishEtapa(Etapa etapa, LeadRealtimeEvent event) {
        if (etapa != null) {
            messagingTemplate.convertAndSend(TOPIC_ETAPA + etapa.name(), event);
        }
    }

    private void publishAsesor(Long idAsesor, LeadRealtimeEvent event) {
        if (idAsesor != null) {
            messagingTemplate.convertAndSend(TOPIC_ASESOR + idAsesor, event);
        }
    }

    private boolean equals(Long left, Long right) {
        return left == null ? right == null : left.equals(right);
    }
}
