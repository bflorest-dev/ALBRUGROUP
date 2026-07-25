package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

@Getter
@Builder
public class LeadRealtimeEvent {

    private String tipo;
    private Long idLead;
    private Etapa etapa;
    private Etapa etapaAnterior;
    private EstadoSeguimiento estado;
    private Long idAsesorAsignado;
    private Long idAsesorAnterior;
    private String codigoTipificacion;
    private String codigoSubtipificacion;
    private Long idCampanaAnterior;
    private Long idCampanaNueva;
    private String nombreCampanaAnterior;
    private String nombreCampanaNueva;
    private Integer eventosActualizados;
    private Integer totalProcesados;
    private Integer totalRegistrados;
    private Integer totalFallidos;
    private Instant occurredAt;
    // Atención GTR: el lead vive en otra etapa pero también es visible en la bandeja diaria del GTR.
    // Cuando es true, el notificador publica además en el topic de PREVENTA para que el GTR refresque.
    @Builder.Default
    private boolean tambienBandejaGtr = false;
}
