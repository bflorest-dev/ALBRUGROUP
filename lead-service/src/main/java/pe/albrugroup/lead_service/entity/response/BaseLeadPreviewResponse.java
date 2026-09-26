package pe.albrugroup.lead_service.entity.response;

import java.time.Instant;

public record BaseLeadPreviewResponse(
        String prefijo,
        String lead,
        String usermeta,
        String documento,
        String direccion,
        String nombre,
        String etapa,
        String codigoTipificacion,
        String codigoSubtipificacion,
        String nombreProveedor,
        Instant fechaTipificacion
) {}
