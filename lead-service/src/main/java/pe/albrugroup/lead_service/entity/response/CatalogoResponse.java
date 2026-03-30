package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CatalogoResponse {

    private Etapa etapa;
    private List<TipificacionResponse> tipificaciones;
}
