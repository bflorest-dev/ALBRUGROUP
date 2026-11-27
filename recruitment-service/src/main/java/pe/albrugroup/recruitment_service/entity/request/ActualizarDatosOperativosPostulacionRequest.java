package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.Modalidad;
import pe.albrugroup.recruitment_service.entity.enums.TurnoHorario;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ActualizarDatosOperativosPostulacionRequest {

    @NotNull
    private TurnoHorario horario;

    @NotNull
    private Modalidad modalidad;

    @Pattern(regexp = "^$|9\\d{8}$")
    private String numeroExclusivoLlamadas;
}
