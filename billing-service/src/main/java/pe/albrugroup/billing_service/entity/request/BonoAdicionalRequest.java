package pe.albrugroup.billing_service.entity.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BonoAdicionalRequest(
        @NotNull Long idEmpleado,
        @NotNull @Min(2000) Integer anio,
        @NotNull @Min(1) @Max(12) Integer mes,
        @NotNull @DecimalMin(value = "0.01") BigDecimal monto,
        @NotBlank String comentario
) {
}
