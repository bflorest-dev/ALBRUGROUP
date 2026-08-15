package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LeadMeritoCorreccionRequest {

    @NotNull(message = "idAsesorMerito es obligatorio")
    @Positive(message = "idAsesorMerito debe ser positivo")
    private Long idAsesorMerito;

    @Size(max = 500, message = "motivo no debe superar 500 caracteres")
    private String motivo;
}
