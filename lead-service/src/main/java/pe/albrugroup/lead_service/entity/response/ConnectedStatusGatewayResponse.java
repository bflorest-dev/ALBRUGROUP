package pe.albrugroup.lead_service.entity.response;

public record ConnectedStatusGatewayResponse(
        Long empleadoId,
        boolean conectado,
        Long equipoActivoId
) {
}
