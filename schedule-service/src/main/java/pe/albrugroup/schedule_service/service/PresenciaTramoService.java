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

    /** true si el empleado tiene al menos un tramo de presencia registrado ese dia (fail-open si no). */
    public boolean tienePresencia(Long idEmpleado, LocalDate fecha) {
        return !presenciaTramoRepository.findByIdEmpleadoAndFechaOrderByInicioAsc(idEmpleado, fecha).isEmpty();
    }

    /**
     * Minutos de la ventana [windowStart, windowEnd] efectivamente CUBIERTOS por tramos de presencia
     * (modelo de cobertura, no de brecha): solo cuenta el tiempo realmente conectado. Un tramo abierto
     * (fin == null) se considera cubierto hasta el fin de la ventana. Fail-open lo decide el llamador
     * via {@link #tienePresencia}: sin tramos, no llamar a este metodo (se acredita lo marcado).
     */
    public int minutosCubiertos(Long idEmpleado, LocalDate fecha,
                                LocalDateTime windowStart, LocalDateTime windowEnd) {
        if (windowStart == null || windowEnd == null || !windowStart.isBefore(windowEnd)) {
            return 0;
        }
        int total = 0;
        for (PresenciaTramo tramo : presenciaTramoRepository.findByIdEmpleadoAndFechaOrderByInicioAsc(idEmpleado, fecha)) {
            if (tramo.getInicio() == null) {
                continue;
            }
            LocalDateTime fin = tramo.getFin() != null ? tramo.getFin() : windowEnd;
            LocalDateTime inicio = tramo.getInicio().isAfter(windowStart) ? tramo.getInicio() : windowStart;
            LocalDateTime cierre = fin.isBefore(windowEnd) ? fin : windowEnd;
            if (inicio.isBefore(cierre)) {
                total += (int) Duration.between(inicio, cierre).toMinutes();
            }
        }
        return total;
    }

    /** true si el instante cae dentro de algun tramo de presencia (handoff/cierre coherente de extras). */
    public boolean estuvoConectadoEn(Long idEmpleado, LocalDate fecha, LocalDateTime instante) {
        if (instante == null) {
            return false;
        }
        return presenciaTramoRepository.findByIdEmpleadoAndFechaOrderByInicioAsc(idEmpleado, fecha).stream()
                .anyMatch(t -> t.getInicio() != null
                        && !instante.isBefore(t.getInicio())
                        && (t.getFin() == null || instante.isBefore(t.getFin())));
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
