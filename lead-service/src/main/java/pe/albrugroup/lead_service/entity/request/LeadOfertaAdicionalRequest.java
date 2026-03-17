package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeadOfertaAdicionalRequest {

    @NotNull
    private Long idAdicional;

    @NotNull
    @Min(1)
    private Integer cantidad;
}
