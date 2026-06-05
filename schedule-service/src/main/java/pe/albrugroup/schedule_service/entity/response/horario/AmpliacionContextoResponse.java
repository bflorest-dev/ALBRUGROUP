package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Contexto que necesita la UI para plantear una ampliacion de un empleado en una fecha,
 * sin pedir IDs tecnicos ni requerir READ_HORARIOS.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AmpliacionContextoResponse {

    private Long idEmpleado;
    private LocalDate fecha;

    private Boolean tieneHorarioVigente;
    private Boolean laborable;

    /** Ventana vigente efectiva del dia (base + ampliaciones ya aplicadas). */
    private LocalTime entradaProgramada;
    private LocalTime salidaProgramada;

    private EstadoAsistencia estadoActual;
    /** El empleado ya marco ingreso hoy. */
    private Boolean tieneRegistro;
    /** La jornada del dia ya fue cerrada (marco salida). Habilita el flujo de reapertura. */
    private Boolean jornadaCerrada;
}
