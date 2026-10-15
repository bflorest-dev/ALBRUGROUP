package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class CashbackPeriodoRequest {

    @NotNull @Min(1)
    private Integer numeroPeriodo;

    @NotNull @Min(0)
    private BigDecimal monto;
}
