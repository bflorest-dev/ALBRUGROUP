package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Resultado de registrar una ampliacion de horario.
 * Devuelve la excepcion persistida mas la ventana efectiva resultante y el estado de la jornada,
 * para que el frontend refleje el cambio sin re-consultar.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AmpliacionHorarioResponse {

    private Long idEmpleado;
    private LocalDate fecha;

    /** Excepcion AMPLIACION creada o actualizada. */
    private ExcepcionHorarioResponse excepcion;

    /** EXTENDIDA: se amplio una jornada continua (entrar antes / salir despues).
     *  REABIERTA: se reabrio una jornada ya cerrada con un tramo nuevo.
     *  HABILITADA: se convirtio un dia de descanso en jornada extraordinaria. */
    private String resultado;

    /** Ventana efectiva del dia tras la ampliacion (para EXTENDIDA es la jornada completa;
     *  para REABIERTA es el tramo nuevo). */
    private LocalTime entradaEfectiva;
    private LocalTime salidaEfectiva;

    /** true si la jornada quedo reabierta y el empleado debe volver a marcar ingreso. */
    private boolean jornadaReabierta;
}
