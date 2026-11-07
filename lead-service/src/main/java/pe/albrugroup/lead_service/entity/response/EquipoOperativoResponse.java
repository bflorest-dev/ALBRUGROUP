package pe.albrugroup.lead_service.entity.response;

public record EquipoOperativoResponse(
        Long id,
        String nombre,
        String color,
        Boolean activo
) {
}
