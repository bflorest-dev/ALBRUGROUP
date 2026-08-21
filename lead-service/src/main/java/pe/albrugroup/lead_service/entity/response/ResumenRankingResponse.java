package pe.albrugroup.lead_service.entity.response;

import java.util.List;

/**
 * Tabla 2 del RESUMEN DIARIO: ranking acotado de asesores más el total de preventas del equipo
 * (encabezado "TOTAL PREVENTAS: N").
 */
public record ResumenRankingResponse(
        long totalPreventas,
        List<ResumenAsesorResponse> asesores
) {
}
