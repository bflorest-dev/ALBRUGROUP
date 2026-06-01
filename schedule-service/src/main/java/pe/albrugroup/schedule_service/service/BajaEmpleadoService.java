package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BajaEmpleadoService {

    private static final String TOPIC_SESION_BAJA = "/topic/sesion/baja/";

    private final HorarioRepository horarioRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void procesarBajaEmpleado(Long empleadoId) {
        LocalDate hoy = OperationalDateTime.nowLocalDateTime().toLocalDate();
        LocalDateTime ahora = OperationalDateTime.nowLocalDateTime();

        cerrarHorarioVigente(empleadoId, hoy);
        cerrarAsistenciaAbierta(empleadoId, hoy, ahora);

        publicarBajaPostCommit(empleadoId);
    }

    private void cerrarHorarioVigente(Long empleadoId, LocalDate hoy) {
        Optional<Horario> horarioOpt = horarioRepository.findHorarioVigente(empleadoId, hoy);
        if (horarioOpt.isEmpty()) {
            log.info("Empleado {}: sin horario vigente al momento de la baja.", empleadoId);
            return;
        }
        Horario horario = horarioOpt.get();
        horario.setFechaFin(hoy);
        horarioRepository.save(horario);
        log.info("Empleado {}: horario {} cerrado con fechaFin={}.", empleadoId, horario.getId(), hoy);
    }

    private void cerrarAsistenciaAbierta(Long empleadoId, LocalDate hoy, LocalDateTime ahora) {
        Optional<Asistencia> asistenciaOpt = asistenciaRepository.findByIdEmpleadoAndFecha(empleadoId, hoy);
        if (asistenciaOpt.isEmpty()) {
            return;
        }
        Asistencia asistencia = asistenciaOpt.get();
        if (asistencia.getEstadoActual() == EstadoAsistencia.OFFLINE) {
            return;
        }
        EstadoAsistencia estadoAnterior = asistencia.getEstadoActual();
        asistencia.setEstadoActual(EstadoAsistencia.OFFLINE);
        if (asistencia.getFechaHoraSalida() == null) {
            asistencia.setFechaHoraSalida(ahora);
        }
        asistenciaRepository.save(asistencia);
        log.info("Empleado {}: asistencia cerrada forzosamente desde {} a OFFLINE.", empleadoId, estadoAnterior);
    }

    private void publicarBajaPostCommit(Long empleadoId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    Map<String, Object> evento = Map.of(
                            "tipo", "EMPLEADO_DADO_DE_BAJA",
                            "empleadoId", empleadoId,
                            "occurredAt", Instant.now().toString()
                    );
                    messagingTemplate.convertAndSend(TOPIC_SESION_BAJA + empleadoId, evento);
                    log.info("Empleado {}: evento EMPLEADO_DADO_DE_BAJA publicado.", empleadoId);
                } catch (Exception e) {
                    log.error("Empleado {}: error al publicar evento de baja por WebSocket.", empleadoId, e);
                }
            }
        });
    }
}
