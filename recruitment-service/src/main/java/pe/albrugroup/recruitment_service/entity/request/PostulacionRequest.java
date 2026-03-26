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

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostulacionRequest {

    @NotNull @Positive private Long idOfertaLaboral;
    @NotNull private Origen origen;
    @NotNull @Valid private PostulanteRequest postulante;
}
