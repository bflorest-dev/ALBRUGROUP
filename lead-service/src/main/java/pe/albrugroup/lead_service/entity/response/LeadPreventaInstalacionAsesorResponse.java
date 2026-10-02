package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadPreventaInstalacionAsesorResponse {

    private Long idAsesor;
    private String nombreAsesor;
    private long totalPreventas;
    private long instalados;
    private long cumplenMismaSemana;
    private long noCumplenMismaSemana;
    private long pendientesInstalacion;
}
