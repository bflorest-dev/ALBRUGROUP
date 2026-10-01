package pe.albrugroup.billing_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pe.albrugroup.billing_service.entity.enums.ModalidadTrabajo;

import java.math.BigDecimal;
import java.util.List;

public record MatrizPlanillaRequest(
        @NotNull @DecimalMin(value = "0.00") BigDecimal bonoCapacitacion,
        @Size(max = 255) String comentario,
        @NotEmpty List<@Valid MatrizModalidadRequest> modalidades,
        @NotEmpty List<@Valid MatrizTardanzaRequest> tardanzas
) {
    public record MatrizModalidadRequest(
            @NotNull ModalidadTrabajo modalidad,
            @NotNull @Min(1) Integer horasDia,
            @NotNull @DecimalMin(value = "0.00") BigDecimal bonoPuntualidad,
            @NotNull @Min(0) Integer ventasMinimasProductividad,
            @NotNull @DecimalMin(value = "0.00") BigDecimal bonoProductividad
    ) {
    }

    public record MatrizTardanzaRequest(
            @NotNull @Min(0) Integer minutosDesde,
            @NotNull @Min(0) Integer minutosHasta,
            @NotNull @DecimalMin(value = "0.00") BigDecimal montoDescuento
    ) {
    }
}
