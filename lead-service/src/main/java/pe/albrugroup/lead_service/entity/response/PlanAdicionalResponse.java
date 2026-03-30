package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanAdicionalResponse {

    private Long idAdicional;
    private String nombreAdicional;
    private Integer cantidadIncluida;
    private Boolean permiteCompraAdicional;
    private Integer cantidadMaximaAdicional;
    private BigDecimal precioUnitarioAdicional;
}
