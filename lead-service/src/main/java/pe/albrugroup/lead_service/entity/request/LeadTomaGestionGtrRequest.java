package pe.albrugroup.lead_service.entity.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeadTomaGestionGtrRequest {

    private Boolean confirmarReasignacion = false;

    private Boolean confirmarGestionPrevia = false;
}
