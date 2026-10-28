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
public class PostulanteHistorialResponse {

    private PostulanteResponse postulante;
    private List<PostulacionHistorialResponse> postulaciones;
}
