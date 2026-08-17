package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.PresenciaTramo;
import pe.albrugroup.schedule_service.entity.enums.OrigenPresencia;
import pe.albrugroup.schedule_service.entity.request.asistencia.PresenciaEventoRequest;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.PresenciaTramoRepository;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PresenciaTramoService {

    private static final long INACTIVITY_BACKDATE_MINUTES = 15;

    private final PresenciaTramoRepository presenciaTramoRepository;
    private final AsistenciaRepository asistenciaRepository;

    @Transactional
    public void procesarEvento(PresenciaEventoRequest request) {
        OrigenPresencia origen = OrigenPresencia.valueOf(request.origen());
        LocalDateTime timestamp = LocalDateTime.ofInstant(request.timestamp(), OperationalDateTime.ZONE);

        if ("CONECTADO".equals(request.tipo())) {
            registrarConexion(request.empleadoId(), timestamp, origen);
        } else if ("DESCONECTADO".equals(request.tipo())) {
            registrarDesconexion(request.empleadoId(), timestamp, origen);
        } else {
            log.warn("Tipo de evento de presencia desconocido: {}", request.tipo());
        }
    }

    private void registrarConexion(Long idEmpleado, LocalDateTime timestamp, OrigenPresencia origen) {
        LocalDate fecha = timestamp.toLocalDate();
        if (presenciaTramoRepository.findFirstByIdEmpleadoAndFechaAndFinIsNullOrderByIdDesc(idEmpleado, fecha).isPresent()) {
            return;
        }
        PresenciaTramo tramo = PresenciaTramo.builder()
                .idEmpleado(idEmpleado)
                .fecha(fecha)
                .inicio(timestamp)
                .origenInicio(origen)
                .build();
        presenciaTramoRepository.save(tramo);
    }

    private void registrarDesconexion(Long idEmpleado, LocalDateTime timestamp, OrigenPresencia origen) {
        LocalDate fecha = timestamp.toLocalDate();
        PresenciaTramo tramo = presenciaTramoRepository
                .findFirstByIdEmpleadoAndFechaAndFinIsNullOrderByIdDesc(idEmpleado, fecha)
                .orElse(null);
        if (tramo == null) {
            return;
        }

        String estadoActual = resolverEstadoAsistencia(idEmpleado, fecha);
        tramo.setEstadoAlDesconectar(estadoActual);
        tramo.setOrigenFin(origen);

        if (origen == OrigenPresencia.INACTIVIDAD && "ONLINE".equals(estadoActual)) {
            LocalDateTime finBackdated = timestamp.minusMinutes(INACTIVITY_BACKDATE_MINUTES);
            tramo.setFin(finBackdated.isBefore(tramo.getInicio()) ? tramo.getInicio() : finBackdated);
        } else {
            tramo.setFin(timestamp);
        }

        presenciaTramoRepository.save(tramo);
    }

    private String resolverEstadoAsistencia(Long idEmpleado, LocalDate fecha) {
        return asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, fecha)
                .map(a -> a.getEstadoActual().name())
                .orElse("OFFLINE");
    }

    public int calcularMinutosBrechaPresencia(Long idEmpleado, LocalDate fecha,
                                               LocalDateTime windowStart, LocalDateTime windowEnd) {
        List<PresenciaTramo> tramos = presenciaTramoRepository
                .findByIdEmpleadoAndFechaOrderByInicioAsc(idEmpleado, fecha);

        if (tramos.isEmpty()) {
            return 0;
        }

        int totalGapMinutes = 0;

        for (int i = 0; i < tramos.size() - 1; i++) {
            PresenciaTramo current = tramos.get(i);
            PresenciaTramo next = tramos.get(i + 1);

            if (current.getFin() == null || next.getInicio() == null) {
                continue;
            }

            if (!"ONLINE".equals(current.getEstadoAlDesconectar())) {
                continue;
            }

            LocalDateTime gapStart = current.getFin().isBefore(windowStart) ? windowStart : current.getFin();
            LocalDateTime gapEnd = next.getInicio().isAfter(windowEnd) ? windowEnd : next.getInicio();

            if (gapStart.isBefore(gapEnd)) {
                totalGapMinutes += (int) Duration.between(gapStart, gapEnd).toMinutes();
            }
        }

        return totalGapMinutes;
    }
}
