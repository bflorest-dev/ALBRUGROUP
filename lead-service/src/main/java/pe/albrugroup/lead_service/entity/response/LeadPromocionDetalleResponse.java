package pe.albrugroup.lead_service.entity.response;

import lombok.*;

import java.util.List;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class LeadPromocionDetalleResponse {

    private Long id;
    private String reglaComercial;
    private String nombreProveedor;
    private List<String> nombresZonas;
}
