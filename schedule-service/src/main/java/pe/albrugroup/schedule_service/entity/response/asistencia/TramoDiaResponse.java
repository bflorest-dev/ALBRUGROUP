package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.schedule_service.entity.enums.EstadoTramoDia;
import pe.albrugroup.schedule_service.entity.enums.TipoTramoDia;

import java.time.LocalDateTime;

/**
 * Un tramo de la jornada efectiva del dia (base + extras/compensables) para el read model v3. El
 * frontend deriva de esta lista, con su reloj vivo, el tramo vigente/proximo y las compuertas de
 * marcacion. El {@code estado} es subestado de reporte (no se pinta en el bloque de marcacion).
 */
@Getter
@Builder
public class TramoDiaResponse {

    private Long idAjuste;
    private TipoTramoDia tipo;
    private LocalDateTime inicio;
    private LocalDateTime fin;
    private EstadoTramoDia estado;

    /** Marca de ingreso atribuida a este tramo (si la hubo), y salida. */
    private LocalDateTime ingresoReal;
    private LocalDateTime salidaReal;

    /** Minutos ya acreditados a este tramo (envelope ∩ ventana ∩ presencia, con nulidad para extra/comp). */
    private Integer minutosAcreditados;
}
