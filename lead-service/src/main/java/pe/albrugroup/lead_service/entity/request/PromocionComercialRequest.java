package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PromocionComercialRequest {

    @NotBlank private String nombre;
    @NotNull private Boolean interno;
    private Long idProveedor;
    private Long idZona;
    @NotNull private Boolean descuento;
    @DecimalMin(value = "0.01", message = "El descuento porcentual debe ser mayor a 0")
    @DecimalMax(value = "100.00", message = "El descuento porcentual no puede ser mayor a 100")
    private BigDecimal descuentoPorcentual;
    @DecimalMin(value = "0.01", message = "El descuento monto debe ser mayor a 0")
    private BigDecimal descuentoMonto;
    @NotNull private Integer cantidadMeses;
    private LocalDate vigenciaDesde;
    private LocalDate vigenciaHasta;
}
