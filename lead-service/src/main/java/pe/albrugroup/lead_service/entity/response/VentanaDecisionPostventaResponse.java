package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class VentanaDecisionPostventaResponse {

    private LocalDate fechaVencimientoObjetivo;
    private LocalDate fechaLimite;
    private boolean vencimientoOcurrido;
    private List<GestionCohorteFilaResponse> filas;
}
