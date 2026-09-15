package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.EnfoqueDia;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.EnfoqueGeneral;

/**
 * Cuadrante de MIS PREVENTAS: los mismos dos enfoques del Dashboard VENTA, acotados al asesor
 * autenticado (por idAsesorMerito en el resumen PREVENTA). Ver EnfoqueDia y EnfoqueGeneral.
 */
public record MisPreventasCuadranteResponse(
        long preventas,
        EnfoqueDia delMes,
        EnfoqueGeneral general
) {}
