package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

/**
 * Resumen liviano de una oportunidad (lead) del mismo contacto, para mostrar las gestiones
 * en paralelo de un teléfono (multi-titular) en el modal del asesor y en la lupa del GTR.
 */
public record OportunidadHermanaResponse(
        Long id,
        String usermeta,
        String numeroDocumentoTitular,
        EstadoSeguimiento estado,
        Etapa etapa,
        String nombreAsesorAsignado,
        String nombrePlanSnapshot,
        Instant lastEntryAt
) {
}
