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
public class LeadIntakeMasivoExcelResponse {

    private int totalSolicitados;
    private int totalProcesados;
    private int totalRegistrados;
    private int totalFallidos;
    private List<LeadIntakeMasivoExcelResultadoResponse> resultados;
}
