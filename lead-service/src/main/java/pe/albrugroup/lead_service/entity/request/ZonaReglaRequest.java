package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.CriterioZona;
import pe.albrugroup.lead_service.entity.enums.NivelGeografico;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class ZonaReglaRequest {

    @NotNull
    private NivelGeografico nivelGeografico;

    @NotNull
    private Long geoId;

    @NotNull
    private CriterioZona criterio;
}
