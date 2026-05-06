package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadResponse {

    private Long id;
    private String prefijo;
    private String lead;
    private Etapa etapa;
    private EstadoSeguimiento estadoSeguimiento;
    private Long idAsesorAsignado;
    private String nombreAsesorAsignado;
    private Base base;
    private Long idTipificacion;
    private String codigoTipificacion;
    private Long idSubtipificacion;
    private String codigoSubtipificacion;
    private String nombrePlanSnapshot;
    private String nombreProveedorSnapshot;
    private BigDecimal precioPlanSnapshot;
    private String nombrePromocionInternaSnapshot;
    private BigDecimal precioAdicionalesSnapshot;
    private BigDecimal precioFinal;
    private Integer diaCorteFacturacion;
    private Integer mesesPermanenciaSnapshot;
    private Instant createdAt;
    private Instant lastEntryAt;
    private Instant updatedAt;
}
