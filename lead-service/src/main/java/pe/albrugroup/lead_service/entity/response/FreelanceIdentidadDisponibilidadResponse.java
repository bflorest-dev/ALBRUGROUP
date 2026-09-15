package pe.albrugroup.lead_service.entity.response;

public record FreelanceIdentidadDisponibilidadResponse(
        boolean telefonoDisponible,
        boolean usermetaDisponible,
        String mensaje
) { }
