package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class GestionCohortePostventaResponse {

    private LocalDate mesCohorte;
    private LocalDate ultimaMesCohorte;
    private LocalDate fechaOperacion;
    private String proveedor;
    private List<GestionCohorteFilaResponse> filas;
    private VentanaDecisionPostventaResponse ventanaDecision;
}
