package pe.albrugroup.lead_service.entity.response;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class CashbackPeriodoResponse {
    private Integer numeroPeriodo;
    private BigDecimal monto;
}
