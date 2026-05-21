package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import pe.albrugroup.recruitment_service.entity.Postulacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoBandejaPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.response.PostulacionRealtimeEvent;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class PostulacionRealtimeNotifier {

    private static final String TOPIC_ALL = "/topic/postulaciones";
    private static final String TOPIC_ETAPA = "/topic/postulaciones/etapa/";
    private static final String TOPIC_PUESTO = "/topic/postulaciones/puesto/";

    private final SimpMessagingTemplate messagingTemplate;

    public void publishAfterCommit(
            String tipo,
            String origen,
            Postulacion postulacion,
            Etapa etapaAnterior,
            EstadoPostulacion estadoAnterior,
            EstadoBandejaPostulacion estadoBandejaAnterior,
            Long idGrupoCapacitacion,
            PuestoObjetivo puestoObjetivoAnterior
    ) {
        PostulacionRealtimeEvent event = PostulacionRealtimeEvent.builder()
                .tipo(tipo)
                .origen(origen)
                .idPostulacion(postulacion.getId())
                .etapa(postulacion.getEtapa())
                .etapaAnterior(etapaAnterior)
                .estado(postulacion.getEstado())
                .estadoAnterior(estadoAnterior)
                .estadoBandeja(postulacion.getEstadoBandeja())
                .estadoBandejaAnterior(estadoBandejaAnterior)
                .idGrupoCapacitacion(idGrupoCapacitacion)
                .puestoObjetivo(postulacion.getOfertaLaboral().getPuestoObjetivo())
                .occurredAt(Instant.now())
                .build();

        Runnable publishAction = () -> publish(event, puestoObjetivoAnterior);
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

    private void publish(PostulacionRealtimeEvent event, PuestoObjetivo puestoObjetivoAnterior) {
        messagingTemplate.convertAndSend(TOPIC_ALL, event);
        publishEtapa(event.getEtapa(), event);
        if (event.getEtapaAnterior() != event.getEtapa()) {
            publishEtapa(event.getEtapaAnterior(), event);
        }

        publishPuesto(event.getPuestoObjetivo(), event);
        if (puestoObjetivoAnterior != event.getPuestoObjetivo()) {
            publishPuesto(puestoObjetivoAnterior, event);
        }
    }

    private void publishEtapa(Etapa etapa, PostulacionRealtimeEvent event) {
        if (etapa != null) {
            messagingTemplate.convertAndSend(TOPIC_ETAPA + etapa.name(), event);
        }
    }

    private void publishPuesto(PuestoObjetivo puestoObjetivo, PostulacionRealtimeEvent event) {
        if (puestoObjetivo != null) {
            messagingTemplate.convertAndSend(TOPIC_PUESTO + puestoObjetivo.name(), event);
        }
    }
}
