package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LeadEquipoAsignacionMasivaRequest {

    @NotEmpty(message = "Debe enviar al menos un lead para asignar")
    private List<@NotNull(message = "Cada idLead es obligatorio") Long> idsLead;

    @NotNull(message = "El id del equipo es obligatorio")
    private Long idEquipo;
}
