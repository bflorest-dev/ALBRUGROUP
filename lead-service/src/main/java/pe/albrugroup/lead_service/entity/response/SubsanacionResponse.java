package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.ModoSubsanacion;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class SubsanacionResponse {
    private Long idSubsanacion;
    private UUID requestId;
    private Long idLead;
    private ModoSubsanacion modo;
    private Long idAdmin;
    private String nombreAdmin;
    private String rolAdmin;
    private Etapa etapaFinal;
    private LocalDate fechaGestion;
    private LocalDate fechaInstalacion;
    private Instant ejecutadoAt;
    private String motivo;
    private Integer eventosReemplazados;
    private Integer resumenesReemplazados;
    private Integer artefactosPostventaReemplazados;
    private Integer oportunidadesHermanasAfectadas;
    private String snapshotAnterior;
    private String snapshotResultado;
    private List<Hito> lineaTiempo;

    public record Hito(Accion accion, Etapa etapa, Instant fecha) { }
}
