package pe.albrugroup.lead_service.entity.response;

public record ProvinciaResponse(
        Long id,
        String codigo,
        String nombre,
        Long idDepartamento) {
}
