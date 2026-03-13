package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PlanRequest {

    @NotNull private Long idProveedor;
    @NotBlank private String nombre;
    @NotNull private BigDecimal precio;

    private LocalDate vigenciaDesde;
    private LocalDate vigenciaHasta;

    @Valid private InternetRequest internet;
    @Valid private TelevisionRequest television;
    @Valid private TelefonoRequest telefono;
    @Valid private List<PlanAdicionalRequest> adicionales;
}
