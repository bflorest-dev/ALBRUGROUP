package pe.albrugroup.billing_service.entity.response;

import java.util.List;

public record PlanillaAjustesResponse(
        Long idPlanilla,
        Integer anio,
        Integer mes,
        List<AdelantoSueldoResponse> adelantos,
        List<BonoAdicionalResponse> bonosAdicionales
) {
}
