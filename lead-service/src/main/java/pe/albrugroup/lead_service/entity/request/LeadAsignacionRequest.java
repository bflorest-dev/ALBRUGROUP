package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeadAsignacionRequest {

    @NotNull(message = "El id del asesor es obligatorio")
    private Long idAsesorAsignado;

    @NotBlank(message = "El nombre del asesor es obligatorio")
    private String nombreAsesorAsignado;
}
