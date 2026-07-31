package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.AportantePago;
import pe.albrugroup.lead_service.entity.enums.CondicionPagoPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPagoPostventa;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagoPostventaResponse {

    private Long id;
    private Long idLead;
    private Long idPeriodoFacturacion;
    private AportantePago aportante;
    private EstadoPagoPostventa estado;
    private CondicionPagoPostventa condicion;
    private BigDecimal monto;
    private LocalDate fechaPago;
    private LocalDate fechaCompromisoPago;
    private String numeroOperacion;
    private String observacion;
    private Instant createdAt;
    private Instant updatedAt;
}
