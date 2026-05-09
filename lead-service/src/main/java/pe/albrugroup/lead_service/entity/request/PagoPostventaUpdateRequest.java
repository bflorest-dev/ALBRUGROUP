package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.AportantePago;
import pe.albrugroup.lead_service.entity.enums.EstadoPagoPostventa;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter
public class PagoPostventaUpdateRequest {

    private AportantePago aportante;
    private EstadoPagoPostventa estado;
    @DecimalMin(value = "0.01", message = "monto debe ser mayor a 0")
    private BigDecimal monto;
    private LocalDate fechaEmision;
    private LocalDate fechaVencimiento;
    private LocalDate fechaPago;
    private LocalDate fechaCompromisoPago;
}
