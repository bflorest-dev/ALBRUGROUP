package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.ModoSubsanacion;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
public class SubsanacionActaResumenResponse {
    private Long idSubsanacion;
    private UUID requestId;
    private Long idLead;
    private ModoSubsanacion modo;
    private Long idAdmin;
    private String nombreAdmin;
    private String rolAdmin;
    private LocalDate fechaGestion;
    private LocalDate fechaInstalacion;
    private String motivo;
    private Instant ejecutadoAt;
}
