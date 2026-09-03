package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Reporte por empleado/dia (admin/RRHH): consolida el desglose por tramo (base + extras/compensables,
 * re-derivado, sin snapshot), las sesiones de sub-estado, los tiempos muertos de presencia y los totales.
 * Reusa la misma proyeccion que el read model de marcacion, para cualquier fecha.
 */
@Getter
@Builder
public class ReporteDiaResponse {

    private Long idEmpleado;
    private LocalDate fecha;
    private Boolean tieneHorario;
    private Boolean jornadaCerrada;

    private List<TramoDiaResponse> tramos;
    private List<SesionEstadoResponse> sesiones;
    private List<PresenciaGapResponse> tiemposMuertos;

    // Almuerzo real del dia.
    private LocalDateTime almuerzoRealInicio;
    private LocalDateTime almuerzoRealFin;
    private Integer minutosAlmuerzoTomados;

    // Totales del dia.
    private Integer minutosObjetivoDia;
    private Integer minutosTrabajados;
    private Integer minutosBalance;
    private Integer minutosExtra;
    private Integer minutosCompensados;
}
