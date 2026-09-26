package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampanaGastoResumenPeriodoResponse {

    private LocalDate fechaDesde;
    private LocalDate fechaHasta;
    private Integer leadsReportados;
    private Integer leadsReales;
    private Integer cantidadPreventas;
    private Integer cantidadVentas;
    private BigDecimal costoTotal;
    private LocalDateTime ultimoReportedAt;
    private List<CampanaGastoCampanaResumenResponse> campanas;
}
