package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class FreelanceVentaReenvioRequest {

    @NotNull
    private UUID requestId;

    @NotNull
    @Positive
    private Long idPlan;

    @Valid
    @NotNull
    private LeadDatosPreventaRequest datosPreventa;

    @Valid
    @NotNull
    private LeadDireccionRequest direccion;
}
