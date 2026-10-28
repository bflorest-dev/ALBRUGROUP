package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.Origen;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.enums.Modalidad;
import pe.albrugroup.recruitment_service.entity.enums.TurnoHorario;

import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostulacionRequest {

    @Positive private Long idOfertaLaboral;
    @NotNull private Origen origen;
    @NotNull private PuestoObjetivo puestoObjetivo;
    private Negocio negocio;
    private Modalidad modalidad;
    private TurnoHorario horario;
    @NotNull private LocalDate fechaPostulacion;
    @NotNull @Valid private PostulanteRequest postulante;
}
