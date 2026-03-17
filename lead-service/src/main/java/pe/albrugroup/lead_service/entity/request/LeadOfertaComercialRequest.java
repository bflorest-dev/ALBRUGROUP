package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LeadOfertaComercialRequest {

    private Long idPlan;
    private Long idPromocionInterna;
    private Long idPromocionProveedor;

    @Valid
    private List<LeadOfertaAdicionalRequest> adicionales;
}
