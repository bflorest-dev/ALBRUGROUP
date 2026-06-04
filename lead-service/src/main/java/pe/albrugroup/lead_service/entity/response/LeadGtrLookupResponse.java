package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Getter
@AllArgsConstructor
public class LeadGtrLookupResponse {

    private boolean existe;
    private Long idLead;
    private String prefijo;
    private String lead;
    private Etapa etapaActual;
    private EstadoSeguimiento estadoActual;
    private boolean puedeGestionarseEnGtr;
    private String mensajeUsuario;
}
