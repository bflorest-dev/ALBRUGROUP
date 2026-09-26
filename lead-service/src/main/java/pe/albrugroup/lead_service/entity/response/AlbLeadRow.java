package pe.albrugroup.lead_service.entity.response;

public record AlbLeadRow(
        String prefijo,
        String lead,
        String usermeta,
        String documento,
        String direccion,
        String nombre
) {}
