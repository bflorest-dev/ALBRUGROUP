package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.CriterioZona;
import pe.albrugroup.lead_service.entity.enums.NivelGeografico;

public record ZonaReglaResponse(
        Long id,
        NivelGeografico nivelGeografico,
        Long geoId,
        CriterioZona criterio) {
}
