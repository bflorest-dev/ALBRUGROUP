package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;

import java.time.Instant;

public record LeadAsesorVentasResponse(
        Long id,
        Instant fechaAsignacion,
        String prefijo,
        String lead,
        String nombreTitular,
        String correo,
        EstadoSeguimiento estadoSeguimiento
) {
}
