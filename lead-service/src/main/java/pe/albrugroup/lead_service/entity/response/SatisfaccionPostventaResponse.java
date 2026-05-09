package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.StatusSatisfaccion;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SatisfaccionPostventaResponse {

    private Long idLead;
    private BigDecimal satisfaccionAsesor;
    private BigDecimal satisfaccionServicio;
    private BigDecimal promedioSatisfaccion;
    private StatusSatisfaccion statusSatisfaccion;
}
