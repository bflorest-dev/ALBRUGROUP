package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Un intervalo de presencia real (conectado) del dia, desde presencia_tramo. {@code fin} nulo = tramo
 * abierto (sigue conectado). El reporte lo usa como evidencia autoritativa de la linea de Marcaciones,
 * en vez de reconstruirla en el frontend restando huecos.
 */
@Getter
@Builder
@AllArgsConstructor
public class IntervaloPresenciaResponse {
    private LocalDateTime inicio;
    private LocalDateTime fin;
}
