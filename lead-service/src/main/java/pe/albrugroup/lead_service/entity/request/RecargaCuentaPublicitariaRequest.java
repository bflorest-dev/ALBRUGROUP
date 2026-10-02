package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
public class RecargaCuentaPublicitariaRequest {

    @NotNull(message = "idCuentaPublicitaria es obligatorio")
    private Long idCuentaPublicitaria;

    @NotNull(message = "monto es obligatorio")
    @DecimalMin(value = "0.01", message = "monto debe ser mayor a 0")
    private BigDecimal monto;

    @NotNull(message = "fecha es obligatorio")
    private LocalDateTime fecha;

    private String observacion;
}
