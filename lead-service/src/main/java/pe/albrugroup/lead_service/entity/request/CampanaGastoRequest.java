package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class CampanaGastoRequest {

    @NotNull(message = "leadsReportados es obligatorio")
    @Min(value = 0, message = "leadsReportados debe ser mayor o igual a 0")
    private Integer leadsReportados;

    @NotNull(message = "costoTotal es obligatorio")
    @DecimalMin(value = "0.00", message = "costoTotal debe ser mayor o igual a 0")
    private BigDecimal costoTotal;

    @NotNull(message = "reportedAt es obligatorio")
    private LocalDateTime reportedAt;
}
