package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LeadTipificacionPostventaRequest {

    @NotBlank(message = "La tipificacion es obligatoria")
    private String codigoTipificacion;
    @NotBlank(message = "La subtipificacion es obligatoria")
    private String codigoSubtipificacion;
    private String comentario;
}
