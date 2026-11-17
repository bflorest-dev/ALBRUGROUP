package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;

@Builder
public record SupervisorHistoricosEquipoResultadoResponse(
        Long idLead,
        boolean movido,
        String operacion,
        Long idEquipoAnterior,
        Long idEquipoDestino,
        String mensaje
) {
}
