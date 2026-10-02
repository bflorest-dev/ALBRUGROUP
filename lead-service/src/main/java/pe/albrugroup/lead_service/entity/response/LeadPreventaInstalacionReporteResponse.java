package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadPreventaInstalacionReporteResponse {

    private PageResponse<LeadPreventaInstalacionResponse> detalle;
    private List<LeadPreventaInstalacionAsesorResponse> porAsesor;
    private LeadPreventaInstalacionTotalesResponse totales;
}
