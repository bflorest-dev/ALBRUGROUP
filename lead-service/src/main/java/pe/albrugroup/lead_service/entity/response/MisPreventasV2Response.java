package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.EnfoqueDia;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.ProveedorRef;

import java.util.List;

/**
 * Payload de MIS PREVENTAS V2 (asesor autenticado). Devuelve dos cohort-views del mismo período
 * mensual: {@code delDia} (nacidas hoy) y {@code delMes} (nacidas en el mes hasta hoy). Ambas
 * usan la misma semántica de {@link EnfoqueDia}: cohorte por {@code fechaIngresoEtapa}, clasificada
 * por estado actual. {@code conversiones} toma el embudo mensual para que el frontend calcule tasas.
 */
public record MisPreventasV2Response(
        long preventas,
        EnfoqueDia delDia,
        EnfoqueDia delMes,
        Conversiones conversiones,
        List<ProveedorRef> proveedores
) {
    /**
     * Embudo del cohorte mensual (mayor rango / última): base = {@code preventas}. El frontend
     * divide: registradas% = registradasFunnel/preventas, instaladas% = instaladasFunnel/preventas, etc.
     */
    public record Conversiones(
            long registradasFunnel,
            long instaladasFunnel,
            long rechazadasFunnel,
            long programadasTotal,
            long programadasInstaladas,
            long programadasRechazadas
    ) {}
}
