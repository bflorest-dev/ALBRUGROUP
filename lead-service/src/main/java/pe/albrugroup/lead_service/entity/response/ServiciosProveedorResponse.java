package pe.albrugroup.lead_service.entity.response;

import java.util.List;

public record ServiciosProveedorResponse(
        Long idProveedor,
        String nombreProveedor,
        List<InternetResponse> internets,
        List<TelevisionResponse> televisiones,
        List<TelefonoResponse> telefonos
) {
}
