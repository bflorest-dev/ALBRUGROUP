package pe.albrugroup.recruitment_service.entity.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostulacionHistorialResponse {

    private PostulacionResponse postulacion;
    private List<EventoResponse> eventos;
}
