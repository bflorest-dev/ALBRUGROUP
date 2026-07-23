package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PeriodoFacturacionFacturaRequest {

    private LocalDate fechaEmisionConfirmada;
    private LocalDate fechaVencimientoConfirmado;

    @DecimalMin(value = "0.0", inclusive = false, message = "montoFacturado debe ser mayor a 0")
    private BigDecimal montoFacturado;

    private String observacion;
}
