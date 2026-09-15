package pe.albrugroup.lead_service.entity.response;

public record ProyeccionVentasResponse(
        long instaladas,
        int diasTranscurridos,
        int diasTotales
) {}
