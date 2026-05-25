package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampanaGastoResumenDiarioResponse {

    private Long idCampana;
    private String nombreCampana;
    private LocalDate fecha;
    private Integer leads;
    private Integer leadsReales;
    private Integer ventasCerradas;
    private BigDecimal costoTotal;
    private Instant ultimoRegistroAt;
    private List<CampanaGastoCampanaResumenResponse> campanas;
}
