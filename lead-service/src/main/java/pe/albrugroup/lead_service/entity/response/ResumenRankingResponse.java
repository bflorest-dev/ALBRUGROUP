package pe.albrugroup.lead_service.entity.response;

import java.util.List;

/**
 * Tabla 2 del RESUMEN DIARIO: ranking acotado de asesores más el total de válidas del equipo.
 */
public record ResumenRankingResponse(
        long totalValidas,
        List<ResumenAsesorResponse> asesores
) {
}
