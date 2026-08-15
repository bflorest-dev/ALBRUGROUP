package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

@Getter @Setter @Builder
public class LeadMeritoCorreccionCandidatoResponse {

    private Long idLead;
    private String lead;
    private Etapa etapaActual;
    private EstadoSeguimiento estadoActual;
    private Long idEquipo;
    private String nombreCampana;
    private String nombreProveedorCampana;
    private String nombreProveedorEquipo;
    private Long idAsesorMeritoActualPreventa;
    private String asesorMeritoActualPreventa;
    private Instant fechaMeritoPreventa;
    private boolean yaCorregido;
    private boolean corregible;
    private String motivoNoCorregible;
}
