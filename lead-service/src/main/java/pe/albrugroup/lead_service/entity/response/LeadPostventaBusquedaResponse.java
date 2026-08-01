package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadPostventaBusquedaResponse {

    private boolean existe;
    private Etapa etapaActual;
    private LeadPostventaBandejaResponse lead;
    private String mensajeUsuario;
}
