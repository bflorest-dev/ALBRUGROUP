package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.EstadoOferta;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class ActualizarEstadoOfertaLaboralRequest {

    @NotNull private EstadoOferta estado;
}
