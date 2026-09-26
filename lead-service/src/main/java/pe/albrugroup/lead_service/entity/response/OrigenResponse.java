package pe.albrugroup.lead_service.entity.response;

public record OrigenResponse(
        Long id,
        String codigo,
        String nombre,
        boolean esOrganico,
        boolean esCampana
) {}
