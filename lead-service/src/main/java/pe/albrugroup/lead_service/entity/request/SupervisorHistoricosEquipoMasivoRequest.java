package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SupervisorHistoricosEquipoMasivoRequest {

    @NotEmpty(message = "Debe enviar al menos un lead para mover")
    private List<@NotNull(message = "Cada idLead es obligatorio") @Positive(message = "Cada idLead debe ser válido") Long> idsLead;

    @NotNull(message = "El id del equipo destino es obligatorio")
    @Positive(message = "El id del equipo destino debe ser válido")
    private Long idEquipo;
}
