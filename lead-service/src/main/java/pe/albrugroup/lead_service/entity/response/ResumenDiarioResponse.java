package pe.albrugroup.lead_service.entity.response;

import java.util.List;

/**
 * RESUMEN DIARIO del DASHBOARD de PREVENTA: las 4 tablas del reporte diario en un solo payload
 * atómico (una foto de un mismo instante), filtrable por equipo/modo/campo/período.
 *
 * <ul>
 *   <li>{@code ingresosGestion} — tabla 1: preventas vs ingresados y vs gestionados.</li>
 *   <li>{@code ranking} — tabla 2: ranking acotado por asesor (OJT colapsado).</li>
 *   <li>{@code estadoLeads} — tabla 3: totales por tipificación.</li>
 *   <li>{@code gestionCampana} — tabla 4: subtipificación × campaña (celdas; el front pivota).</li>
 * </ul>
 */
public record ResumenDiarioResponse(
        ResumenIngresosGestionResponse ingresosGestion,
        ResumenRankingResponse ranking,
        List<GtrTipificacionRankingResponse> estadoLeads,
        List<ResumenSubtipCampanaCeldaResponse> gestionCampana
) {
}
