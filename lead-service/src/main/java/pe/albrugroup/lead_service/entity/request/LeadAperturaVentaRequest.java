package pe.albrugroup.lead_service.entity.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeadAperturaVentaRequest {

    private Boolean modoConsulta = false;
    private Boolean confirmarReasignacion = false;
    private Long idAsesorConfirmado;
}
