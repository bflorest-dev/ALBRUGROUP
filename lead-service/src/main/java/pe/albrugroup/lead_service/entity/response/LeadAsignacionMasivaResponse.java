package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LeadAsignacionMasivaResponse {

    private int totalSolicitados;
    private int totalProcesados;
    private int totalAsignados;
    private int totalFallidos;
    private List<LeadAsignacionResultadoResponse> resultados;
}
