package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.CriterioZona;
import pe.albrugroup.lead_service.entity.enums.NivelGeografico;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZonaReglaResponse {

    private Long id;
    private NivelGeografico nivelGeografico;
    private Long geoId;
    private CriterioZona criterio;
}
