package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PlanUpdateRequest {

    @NotBlank
    private String nombre;

    @NotNull
    private BigDecimal precio;

    private LocalDate vigenciaDesde;
    private LocalDate vigenciaHasta;
}
