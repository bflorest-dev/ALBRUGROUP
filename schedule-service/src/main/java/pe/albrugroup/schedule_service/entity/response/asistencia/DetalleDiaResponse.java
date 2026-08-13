package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;
import pe.albrugroup.schedule_service.entity.enums.OrigenAlmuerzo;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Read model del dia para la marcacion nueva (/asistencia/v2). Refleja el estado del dia del
 * empleado: snapshot de horario, estado actual, marcaciones, y totales de sub-estados (derivados
 * de sesion_estado). Reemplaza a DetalleAsistenciaResponse en el flujo v2.
 */
@Getter
@Setter
@Builder
public class DetalleDiaResponse {

    private Long idEmpleado;
    private LocalDate fecha;
    private Long idHorario;

    private EstadoAsistencia estadoActual;
    private Boolean tieneHorario;
    private Boolean dentroHorario;
    private Boolean operativo;
    private Boolean jornadaCerrada;

    private LocalTime entradaProgramada;
    private LocalTime salidaProgramada;
    private LocalDateTime fechaHoraIngreso;
    private LocalDateTime fechaHoraSalida;

    private Integer minutosObjetivoDia;
    private Integer minutosTrabajados;
    private Integer minutosBalance;
    private Integer minutosExtra;
    private Integer minutosCompensados;

    // Almuerzo (split): estado vs. marcacion real.
    private LocalDateTime almuerzoEstadoDesde;
    private LocalDateTime almuerzoRealInicio;
    private LocalDateTime almuerzoRealFin;
    private OrigenAlmuerzo origenAlmuerzo;
    private Integer minutosAlmuerzoTomados;

    // Sub-estados cronometrados (totales del dia, derivados de sesion_estado; en curso hasta ahora).
    private Integer minutosServiciosHoy;
    private Integer minutosPausaActivaHoy;
    private Integer minutosCapacitacionHoy;
    private Boolean sesionEnCurso;

    /**
     * Desglose de tramos del dia. Solo se llena en dias partidos (jornada reabierta por una
     * ampliacion): tramos base (mañana) + tramos extra (tarde). En dias normales queda vacio.
     */
    private List<TramoAsistenciaResponse> tramos;
}
