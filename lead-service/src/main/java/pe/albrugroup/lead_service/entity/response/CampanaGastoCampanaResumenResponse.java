package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampanaGastoCampanaResumenResponse {

    private Long idCampana;
    private String nombreCampana;
    private Integer leads;
    private Integer leadsReales;
    private Integer ventasCerradas;
    private BigDecimal costoTotal;
    private Instant ultimoRegistroAt;
}
