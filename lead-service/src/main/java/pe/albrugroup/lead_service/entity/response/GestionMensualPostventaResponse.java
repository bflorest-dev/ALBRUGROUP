package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class GestionMensualPostventaResponse {

    private LocalDate mesGestion;
    private String proveedor;
    private List<GestionMensualFilaResponse> filas;
}
