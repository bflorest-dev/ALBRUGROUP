package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LeadAsignacionMasivaRequest {

    @NotEmpty(message = "Debe enviar al menos un lead para asignar")
    private List<@NotNull(message = "Cada idLead es obligatorio") Long> idsLead;

    @NotNull(message = "El id del asesor es obligatorio")
    private Long idAsesorAsignado;

    @NotBlank(message = "El nombre del asesor es obligatorio")
    private String nombreAsesorAsignado;

    private Boolean confirmarReasignacion = false;
}
