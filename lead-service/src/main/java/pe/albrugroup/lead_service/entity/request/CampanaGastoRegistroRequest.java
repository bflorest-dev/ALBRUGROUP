package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CampanaGastoRegistroRequest {

    @NotNull(message = "leads es obligatorio")
    @Min(value = 0, message = "leads debe ser mayor o igual a 0")
    private Integer leads;

    @NotNull(message = "costoTotal es obligatorio")
    @DecimalMin(value = "0.00", message = "costoTotal debe ser mayor o igual a 0")
    private BigDecimal costoTotal;
}
