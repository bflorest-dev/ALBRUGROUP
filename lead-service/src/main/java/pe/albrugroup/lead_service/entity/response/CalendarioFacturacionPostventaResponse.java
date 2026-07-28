package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.BloqueFacturacion;
import pe.albrugroup.lead_service.entity.enums.TipoReglaFacturacion;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarioFacturacionPostventaResponse {

    private Long id;
    private Long idLead;
    private LocalDate fechaInstalacion;
    private String proveedorSnapshot;
    private String planSnapshot;
    private Integer mesesPermanenciaSnapshot;
    private BigDecimal montoPlanSnapshot;
    private TipoReglaFacturacion tipoReglaProveedor;
    private Integer diaCorte;
    private Integer diaEmisionEstimado;
    private Integer diaVencimiento;
    private LocalDate mesCorteBase;
    private Integer numeroCorteBase;
    private BloqueFacturacion bloqueFacturacion;
    private Boolean requiereProrrateoInicial;
    private Boolean activo;
    private Boolean corteCorregido;
    private Instant fechaCorreccionCorte;
    private Instant createdAt;
    private Instant updatedAt;
}
