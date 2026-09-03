package pe.albrugroup.schedule_service.entity.request.asistencia;

import java.time.LocalTime;

/**
 * Ajuste puntual del almuerzo programado de un dia. {@code inicio}/{@code fin} en HH:mm; ambos nulos =
 * quitar el almuerzo de ese dia. El backend valida que caiga dentro del horario base y que el almuerzo
 * aun no se haya marcado.
 */
public record AjustarAlmuerzoRequest(LocalTime inicio, LocalTime fin) {
}
