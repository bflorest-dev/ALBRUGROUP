package pe.albrugroup.lead_service.entity.response;

import lombok.*;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.List;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class LeadPromocionDetalleResponse {

    private Long id;
    private String reglaComercial;
    private Etapa etapa;
    private String nombreProveedor;
    private List<String> nombresZonas;
    private List<CashbackPeriodoResponse> cashbackPeriodos;
}
