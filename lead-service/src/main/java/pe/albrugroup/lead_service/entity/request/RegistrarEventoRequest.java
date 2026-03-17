package pe.albrugroup.lead_service.entity.request;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Getter
@Builder
public class RegistrarEventoRequest {

    private Long idLead;
    private Long idCampana;
    private Accion accion;
    private Etapa etapa;
    private String tipificacion;
    private String subtipificacion;
}
