package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.Builder;
import lombok.Getter;

/**
 * Parametros de politica (por rol) que el frontend necesita para derivar las ventanas de marcacion con
 * su reloj vivo (margen de adelanto, corte de tardanza, topes de pausas, ventana de almuerzo). El backend
 * los entrega; el frontend calcula los gates; el backend re-valida en el write.
 */
@Getter
@Builder
public class PoliticaMarcacionResponse {

    private Integer margenAdelantoMin;
    private Integer bloqueoTardanzaMin;
    private Integer maxMinutosPausaActiva;
    private Integer maxUsosPausaActivaDia;
    private Integer ventanaMarcaAlmuerzoMin;
    /** true = el rol puede marcar ingreso dentro del turno saltando el bloqueo de tardanza (p. ej. OJT). */
    private Boolean permiteIngresoDuranteTurno;
}
