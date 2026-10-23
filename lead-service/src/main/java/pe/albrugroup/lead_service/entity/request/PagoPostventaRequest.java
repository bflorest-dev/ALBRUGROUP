package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.AportantePago;
import pe.albrugroup.lead_service.entity.enums.CondicionPagoPostventa;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter
public class PagoPostventaRequest {

    @NotNull(message = "idPeriodoFacturacion es obligatorio")
    private Long idPeriodoFacturacion;

    private AportantePago aportante;
    private CondicionPagoPostventa condicion;
    private BigDecimal monto;

    private LocalDate fechaPago;
    private LocalDate fechaCompromisoPago;
    private String numeroOperacion;
    private String observacion;
}
