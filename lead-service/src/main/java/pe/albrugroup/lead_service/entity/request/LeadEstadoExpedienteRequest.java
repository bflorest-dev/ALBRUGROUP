package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoExpediente;

@Getter
@Setter
public class LeadEstadoExpedienteRequest {

    @NotNull(message = "estadoExpediente es obligatorio")
    private EstadoExpediente estadoExpediente;
}
