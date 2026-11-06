package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CumplimientoDetalleDiaResponse {

    private LocalDate fecha;
    private Boolean laborable;
    /** Tipo del dia no laborable (FERIADO, VACACIONES, DESCANSO_MEDICO, PERMISO) cuando el dia es libre por una
     *  declaracion de dia no laborable. Null cuando es laborable o cuando el dia libre viene del horario base
     *  (descanso) o de una excepcion generica sin tipo. */
    private String tipoDiaNoLaborable;
    private LocalTime horaEntradaEstablecida;
    private LocalTime horaEntradaAsistencia;
    private LocalTime horaSalidaEstablecida;
    private LocalTime horaSalidaAsistencia;
    /** true cuando la salida fue cerrada automáticamente o por reconciliación, no por marca manual. */
    private Boolean salidaForzada;
    private Boolean jornadaCerrada;
    private Integer minutosObjetivoDia;
    /** Horas PROGRAMADAS del dia (concepto 2): minutos realmente asignados en el horario, netos de almuerzo.
     *  Distinto del objetivo contractual (minutosObjetivoDia): el objetivo es la meta de la modalidad; lo
     *  programado es lo que el gestor efectivamente puso en el calendario para ese dia. */
    private Integer minutosProgramadoDia;
    private Integer minutosTrabajados;
    /** Presencia neta por marcaciones del dia: (salida - ingreso) - almuerzo. Independiente del tiempo productivo. */
    private Integer minutosTrabajadosMarcacion;
    private Integer minutosBalance;
    private Integer minutosServiciosAcumulados;
    private Boolean excedioServicios;
    private Boolean tardanza;

    // Almuerzo del dia (programado + real) para la fila de resumen: base + almuerzo, lo mas consultado.
    private LocalTime inicioAlmuerzoProgramado;
    private LocalTime finAlmuerzoProgramado;
    private LocalTime almuerzoRealInicio;
    private LocalTime almuerzoRealFin;

    // Split para los badges de la fila (+ Extra / + Comp). 0 en dias normales.
    private Integer minutosExtra;
    private Integer minutosCompensados;

    /** Tramos del dia cuando fue partido por una ampliacion (reapertura). Vacio en dias normales. */
    private List<TramoAsistenciaResponse> tramos;
}
