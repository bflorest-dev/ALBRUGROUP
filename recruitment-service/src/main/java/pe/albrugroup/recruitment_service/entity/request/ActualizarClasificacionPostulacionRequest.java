package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.Modalidad;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.enums.TurnoHorario;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ActualizarClasificacionPostulacionRequest {

    @NotNull
    private PuestoObjetivo puestoObjetivo;

    private Negocio negocio;
    private Modalidad modalidad;
    private TurnoHorario horario;
}
