package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

@Getter @Setter @Builder
public class LeadMeritoCorreccionResponse {

    private Long idLead;
    private String lead;
    private Etapa etapaActual;
    private EstadoSeguimiento estadoActual;
    private Long idAsesorAnterior;
    private String nombreAsesorAnterior;
    private Long idAsesorNuevo;
    private String nombreAsesorNuevo;
    private Instant fechaMeritoPreventa;
    private Long idActor;
    private String nombreActor;
    private String rolActor;
    private String motivo;
    private Instant fechaCorreccion;
}
