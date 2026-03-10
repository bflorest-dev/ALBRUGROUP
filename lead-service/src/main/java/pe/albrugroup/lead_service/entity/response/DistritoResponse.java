package pe.albrugroup.lead_service.entity.response;

public record DistritoResponse(
        Long id,
        String codigo,
        String nombre,
        Long idProvincia,
        Long idDepartamento) {
}
