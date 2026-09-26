package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampanaGastoResponse {

    private Long id;
    private Long idCampana;
    private String nombreCampana;
    private Integer leadsReportados;
    private Integer leadsReales;
    private Integer cantidadPreventas;
    private Integer cantidadVentas;
    private BigDecimal costoTotal;
    private LocalDateTime reportedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
