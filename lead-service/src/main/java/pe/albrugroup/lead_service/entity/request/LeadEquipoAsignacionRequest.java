package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeadEquipoAsignacionRequest {

    @NotNull(message = "El id del equipo es obligatorio")
    private Long idEquipo;
}
