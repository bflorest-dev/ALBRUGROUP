package pe.albrugroup.lead_service.entity.response;

import java.time.Instant;
import java.time.LocalDate;

public record BaseLeadPreviewResponse(
        Long id,
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
        String nombreProveedorOrigen,
        Instant fechaIngresoEtapa,
        Instant fechaTipificacion,
        LocalDate fechaInstalacion
) {}
