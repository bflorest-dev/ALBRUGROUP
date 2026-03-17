package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;

import java.time.Instant;

public record LeadGtrResponse(
        Long id,
        Instant createdAt,
        String nombreCampana,
        String nombreProveedorCampana,
        Base base,
        String nombreTitular,
        String codigoTipificacion,
        String codigoSubtipificacion,
        String nombreAsesorAsignado,
        EstadoSeguimiento estadoSeguimiento,
        long reasignaciones
) {
}
