package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter
public class GastoRequest {

    @NotNull(message = "idTipoGasto es obligatorio")
    private Long idTipoGasto;

    @NotNull(message = "monto es obligatorio")
    @DecimalMin(value = "0.01", message = "monto debe ser mayor a 0")
    private BigDecimal monto;

    private String documento;

    private String descripcion;

    @NotNull(message = "fecha es obligatorio")
    private LocalDate fecha;
}
