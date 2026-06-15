package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pe.albrugroup.schedule_service.configuration.ScheduleEngineProperties;
import pe.albrugroup.schedule_service.entity.response.horario.JornadaEfectivaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.TramoJornadaResponse;

import java.time.LocalDate;
import java.time.LocalTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class JornadaShadowComparator {

    private final ScheduleEngineProperties properties;
    private final JornadaEfectivaResolver resolver;

    public void compare(
            Long idEmpleado,
            LocalDate fecha,
            boolean laborableLegacy,
            LocalTime entradaLegacy,
            LocalTime salidaLegacy
    ) {
        if (!properties.shadowEnabled(fecha)) {
            return;
        }
        try {
            JornadaEfectivaResponse nueva = resolver.resolver(idEmpleado, fecha);
            TramoJornadaResponse primero = nueva.getTramos().isEmpty() ? null : nueva.getTramos().getFirst();
            TramoJornadaResponse ultimo = nueva.getTramos().isEmpty() ? null : nueva.getTramos().getLast();
            boolean coincide = laborableLegacy == !nueva.getTramos().isEmpty()
                    && equalsTime(entradaLegacy, primero == null ? null : primero.getInicio().toLocalTime())
                    && equalsTime(salidaLegacy, ultimo == null ? null : ultimo.getFin().toLocalTime());
            if (!coincide) {
                log.warn(
                        "SCHEDULE_ENGINE_SHADOW_DIFF empleado={} fecha={} legacy={} {}-{} nuevoTramos={}",
                        idEmpleado, fecha, laborableLegacy, entradaLegacy, salidaLegacy, nueva.getTramos());
            }
        } catch (RuntimeException exception) {
            log.warn(
                    "SCHEDULE_ENGINE_SHADOW_ERROR empleado={} fecha={} mensaje={}",
                    idEmpleado, fecha, exception.getMessage());
        }
    }

    private boolean equalsTime(LocalTime left, LocalTime right) {
        return left == null ? right == null : left.equals(right);
    }
}
