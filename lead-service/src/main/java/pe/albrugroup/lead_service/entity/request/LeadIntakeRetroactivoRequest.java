package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
public class LeadIntakeRetroactivoRequest extends LeadIntakeRequest {

    @NotNull(message = "La hora del registro es obligatoria")
    private LocalTime horaRegistro;
}
