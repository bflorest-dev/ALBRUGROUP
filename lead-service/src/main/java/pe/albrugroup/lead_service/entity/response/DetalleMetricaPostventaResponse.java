package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.Unidad;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetalleMetricaPostventaResponse {

    private Long idLead;
    private String numeroLead;
    private String numeroDocumento;
    private String nombreCliente;
    private LocalDate fechaInstalacion;
    private LocalDate mesCorteBase;
    private Integer numeroCorte;
    private Integer numeroRecibo;
    private EstadoPeriodoFacturacionPostventa estadoPeriodo;
    private EstadoClientePostventa estadoPostventa;
    private String tipificacion;
    private String subtipificacion;
    private Instant ultimaGestion;
    private String asesorPostventa;
    private String proveedor;
    private String plan;
    private BigDecimal cargoFijo;
    private Integer velocidadRegular;
    private Unidad unidadVelocidad;
}
