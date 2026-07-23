package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PaquetePlataformaRequest {

    @NotNull(message = "idPlataforma es obligatorio")
    private Long idPlataforma;

    @NotBlank(message = "nombre es obligatorio")
    private String nombre;

    @NotNull(message = "cantidadMeses es obligatoria")
    @Min(value = 1, message = "cantidadMeses debe ser mayor o igual a 1")
    private Integer cantidadMeses;

    @NotNull(message = "cantidadUsuarios es obligatoria")
    @Min(value = 1, message = "cantidadUsuarios debe ser mayor o igual a 1")
    private Integer cantidadUsuarios;

    private Boolean consumeCreditos;

    @Min(value = 0, message = "cantidadCreditosConsumidos debe ser mayor o igual a 0")
    private Integer cantidadCreditosConsumidos;

    @DecimalMin(value = "0.00", message = "precioVenta debe ser mayor o igual a 0")
    private BigDecimal precioVenta;
}
