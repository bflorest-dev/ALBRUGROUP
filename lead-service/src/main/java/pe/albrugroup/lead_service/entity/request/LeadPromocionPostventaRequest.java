package pe.albrugroup.lead_service.entity.request;

import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Getter @Setter
public class LeadPromocionPostventaRequest {
    private Long idPromocion;
    private Etapa etapa;
}
