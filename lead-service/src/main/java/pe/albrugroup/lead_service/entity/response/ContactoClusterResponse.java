package pe.albrugroup.lead_service.entity.response;

import java.util.List;

/**
 * Contacto (identidad) con sus oportunidades (leads), para la Bitácora ADMIN: alimenta la
 * advertencia multi-lead al editar identidad y las vistas previas de intercambio/reubicación.
 */
public record ContactoClusterResponse(
        Long idContacto,
        String prefijo,
        String lead,
        String usermeta,
        String nombreConocido,
        List<OportunidadHermanaResponse> oportunidades
) {
}
