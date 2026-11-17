package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;

import java.util.List;

@Builder
public record SupervisorHistoricosEquipoMasivoResponse(
        int totalSolicitados,
        int totalProcesados,
        int totalMovidos,
        int totalFallidos,
        List<SupervisorHistoricosEquipoResultadoResponse> resultados
) {
}
