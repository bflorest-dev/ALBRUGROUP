package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.List;

@Builder
@Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class PromocionComercialRequest {

    @NotBlank private String reglaComercial;
    @NotNull private Etapa etapa;
    private Long idProveedor;
    private List<Long> idsZonas;
    private List<Long> idsPlanes;
    @Valid private List<CashbackPeriodoRequest> cashbackPeriodos;
}
