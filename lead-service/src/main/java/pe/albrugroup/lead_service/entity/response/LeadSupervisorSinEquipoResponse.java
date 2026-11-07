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
public class LeadSupervisorSinEquipoResponse {

    private Long id;
    private Instant lastEntryAt;
    private String prefijo;
    private String lead;
    private String usermeta;
    private String nombreCampana;
    private String nombreProveedorCampana;
    private String origen;
    private EstadoSeguimiento estadoSeguimiento;
}
