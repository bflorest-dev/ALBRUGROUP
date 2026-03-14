package pe.albrugroup.lead_service.security;

public record UserSession(String username, Long empleadoId, String nombreCompleto) {
}
