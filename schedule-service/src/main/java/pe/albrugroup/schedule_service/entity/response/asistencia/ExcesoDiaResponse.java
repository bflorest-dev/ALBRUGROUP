package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Un exceso del dia que pesa en el balance y se pinta en la linea de Incidencias: el tramo de tiempo que
 * paso del tope de un estado. {@code tipo} = ALMUERZO | PAUSA_ACTIVA. El rango [inicio, fin] es el pedazo
 * que se paso (la "cola" sobre lo permitido); {@code minutos} su duracion.
 */
@Getter
@Builder
@AllArgsConstructor
public class ExcesoDiaResponse {
    private String tipo;
    private LocalDateTime inicio;
    private LocalDateTime fin;
    private Integer minutos;
}
