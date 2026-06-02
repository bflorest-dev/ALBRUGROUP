package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;

import java.time.Instant;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class LeadPendienteResponse {

    private Long id;
    private String prefijo;
    private String lead;
    private EstadoSeguimiento estadoSeguimiento;
    private Instant lastEntryAt;
}
