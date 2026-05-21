package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;
import pe.albrugroup.schedule_service.entity.response.asistencia.AttendanceRealtimeEvent;
import pe.albrugroup.schedule_service.entity.response.asistencia.EstadoMonitorResponse;

import java.time.Instant;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AttendanceRealtimeNotifier {

    private static final String TOPIC_MONITOR = "/topic/asistencia/monitor";
    private static final String TOPIC_EMPLEADO = "/topic/asistencia/empleado/";

    private final SimpMessagingTemplate messagingTemplate;
    private final AttendanceMonitorResolver attendanceMonitorResolver;

    public void publishAfterCommit(
            String tipo,
            String origen,
            Long idEmpleado,
            LocalDate fecha,
            EstadoAsistencia estadoAnterior
    ) {
        Runnable publishAction = () -> publish(tipo, origen, idEmpleado, fecha, estadoAnterior);
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

    private void publish(
            String tipo,
            String origen,
            Long idEmpleado,
            LocalDate fecha,
            EstadoAsistencia estadoAnterior
    ) {
        EstadoMonitorResponse estadoMonitor = attendanceMonitorResolver.resolveEstadoMonitor(idEmpleado, fecha);
        AttendanceRealtimeEvent event = AttendanceRealtimeEvent.builder()
                .tipo(tipo)
                .origen(origen)
                .idEmpleado(idEmpleado)
                .fecha(estadoMonitor.getFecha())
                .estadoActual(estadoMonitor.getEstadoActual())
                .estadoAnterior(estadoAnterior)
                .desde(estadoMonitor.getDesde())
                .tieneHorarioVigente(estadoMonitor.getTieneHorarioVigente())
                .laborableHoy(estadoMonitor.getLaborableHoy())
                .esperadoHoy(estadoMonitor.getEsperadoHoy())
                .operativo(estadoMonitor.getOperativo())
                .occurredAt(Instant.now())
                .build();

        messagingTemplate.convertAndSend(TOPIC_MONITOR, event);
        messagingTemplate.convertAndSend(TOPIC_EMPLEADO + idEmpleado, event);
    }
}
