package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PlanAdicionalRequest {

    @NotNull private Long idAdicional;
    @NotNull private Integer cantidadIncluida;
    @NotNull private Boolean permiteCompraAdicional;
    private Integer cantidadMaximaAdicional;
}
