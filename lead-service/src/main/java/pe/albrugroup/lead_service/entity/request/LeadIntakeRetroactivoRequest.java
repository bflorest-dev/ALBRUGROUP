package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class LeadIntakeRetroactivoRequest extends LeadIntakeRequest {

    /**
     * Fecha operativa atribuida al registro. Se mantiene opcional para conservar compatibilidad con
     * consumidores antiguos; cuando no llega, el servicio utiliza el dia anterior.
     */
    private LocalDate fechaRegistro;

    @NotNull(message = "La hora del registro es obligatoria")
    private LocalTime horaRegistro;
}
