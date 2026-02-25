package pe.albrugroup.rrhh_service.entity.request.postulante;

import jakarta.validation.constraints.NotNull;
import lombok.*;


@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class EstadoCapacitacionRequest {

    @NotNull
    private Long id;
    @NotNull
    private EventoPostulanteRequest evento;
}
