package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;
import pe.albrugroup.schedule_service.entity.enums.OrigenAlmuerzo;
import pe.albrugroup.schedule_service.entity.enums.TipoSesionEstado;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Read model del dia (v3, /asistencia/v2/dia). Reemplazo limpio: el backend entrega ESTADO real +
 * TRAMOS resueltos + POLITICA + VERSION; el frontend deriva las compuertas de marcacion con su reloj
 * vivo (tramo vigente/proximo/hueco, ventanas). El backend re-valida en el write. Ya NO expone
 * booleanos de compuerta (puede*), ni enTurnoActivo/operativo, ni entrada/salida programada planas:
 * todo eso se deriva de {@link #tramos} + {@link #politica} + reloj del cliente.
 */
@Getter
@Setter
@Builder
public class DetalleDiaResponse {

    private Long idEmpleado;
    private LocalDate fecha;
    private Long idHorario;

    // --- Estado real (verdad de servidor) ---
    private EstadoAsistencia estadoActual;
    private Boolean tieneHorario;
    private Boolean jornadaCerrada;
    private LocalDateTime fechaHoraIngreso;
    private LocalDateTime fechaHoraSalida;

    /**
     * Jornada del dia resuelta: todos los tramos (base + extras/compensables) con ventana, tipo y
     * subestado. El frontend deriva de aqui el tramo vigente, el proximo, el hueco y los gates.
     */
    private List<TramoDiaResponse> tramos;

    /** Parametros de politica del rol para que el frontend calcule ventanas (no recalcula el backend). */
    private PoliticaMarcacionResponse politica;

    /** Cambia cuando cambia la jornada o el estado: el frontend detecta un cambio en la sesion abierta. */
    private String version;

    // --- Totales del dia ---
    private Integer minutosObjetivoDia;
    private Integer minutosTrabajados;
    private Integer minutosBalance;
    private Integer minutosExtra;
    private Integer minutosCompensados;

    // --- Almuerzo (split): programado + marcacion real ---
    private LocalTime inicioAlmuerzoProgramado;
    private Integer minutosAlmuerzoProgramado;
    private LocalDateTime almuerzoEstadoDesde;
    private LocalDateTime almuerzoRealInicio;
    private LocalDateTime almuerzoRealFin;
    private OrigenAlmuerzo origenAlmuerzo;
    private Integer minutosAlmuerzoTomados;

    // --- Sub-estados cronometrados (totales del dia + uso, para que el frontend derive sus gates) ---
    private Integer minutosServiciosHoy;
    private Integer minutosPausaActivaHoy;
    private Integer minutosCapacitacionHoy;
    private Integer pausaActivaUsosHoy;
    private Boolean sesionEnCurso;

    // Umbrales/anclas de la sesion abierta (cronometros y aviso de tope en rojo).
    private Integer minutosServiciosTope;
    private Integer maxMinutosPausaActiva;
    private TipoSesionEstado sesionActualTipo;
    private LocalDateTime sesionActualInicio;
}
