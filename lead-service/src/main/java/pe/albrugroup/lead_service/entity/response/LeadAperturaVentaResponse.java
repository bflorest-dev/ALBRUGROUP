package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LeadAperturaVentaResponse {

    private String modo;
    private LeadDetalleResponse detalle;
}
