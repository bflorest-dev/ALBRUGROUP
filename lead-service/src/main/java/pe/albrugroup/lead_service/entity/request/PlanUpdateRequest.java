package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PlanUpdateRequest {

    @NotBlank
    private String nombre;

    @NotNull
    private BigDecimal precio;

    @DecimalMin(value = "0.01", message = "El precioPromocional debe ser mayor a 0")
    private BigDecimal precioPromocional;

    @Positive(message = "Los mesesPromocionPrecio deben ser mayores a 0")
    private Integer mesesPromocionPrecio;

    private LocalDate vigenciaDesde;
    private LocalDate vigenciaHasta;
    @Positive(message = "La velocidadPromocional debe ser mayor a 0")
    private Integer velocidadPromocional;
    @Positive(message = "Los mesesPromocionVelocidad deben ser mayores a 0")
    private Integer mesesPromocionVelocidad;
    private Long idZona;
}
