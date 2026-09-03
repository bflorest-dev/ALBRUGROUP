package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Tiempo muerto detectado: intervalo en que el empleado se desconecto y luego volvio (hueco entre dos
 * tramos de presencia). {@code motivo} = origen de la desconexion (INACTIVIDAD / CIERRE_MANUAL / ...);
 * {@code estadoAlDesconectar} = estado de asistencia al momento de perder presencia.
 */
@Getter
@Builder
public class PresenciaGapResponse {
    private LocalDateTime inicio;
    private LocalDateTime fin;
    private Integer minutos;
    private String motivo;
    private String estadoAlDesconectar;
}
