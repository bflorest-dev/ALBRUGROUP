package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class EntregaCredencialPlataformaRequest {

    @NotNull(message = "idCredencial es obligatorio")
    private Long idCredencial;

    @NotNull(message = "cantidadUsuariosAsignados es obligatoria")
    @Min(value = 1, message = "cantidadUsuariosAsignados debe ser mayor o igual a 1")
    private Integer cantidadUsuariosAsignados;

    private Boolean esObsequio;

    @DecimalMin(value = "0.00", message = "montoVenta debe ser mayor o igual a 0")
    private BigDecimal montoVenta;

    private LocalDate fechaEntrega;
    private LocalDate fechaInicioAcceso;
    private String observacion;

    @Valid
    private List<EntregaCredencialDispositivoRequest> dispositivos;
}
