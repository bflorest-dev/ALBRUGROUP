package pe.albrugroup.lead_service.entity.response;

public record TelefonoResponse(
        Long id,
        Integer minutos,
        String descripcion
) {
}
