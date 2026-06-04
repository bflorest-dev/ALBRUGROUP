package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Getter
@AllArgsConstructor
public class LeadContextoLookupResponse {

    private boolean existe;
    private Long idLead;
    private String prefijo;
    private String lead;
    private Etapa etapaActual;
    private EstadoSeguimiento estadoActual;
    private boolean puedeGestionar;
    private boolean disponibleParaTomar;
    private boolean gestionadoPorOtroAsesor;
    private String nombreAsesorAsignado;
    private String mensajeUsuario;
}
