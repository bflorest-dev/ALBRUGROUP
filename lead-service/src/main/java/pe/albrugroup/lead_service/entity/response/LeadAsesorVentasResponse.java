package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadAsesorVentasResponse {

    private Long id;
    private Instant fechaAsignacion;
    private String prefijo;
    private String lead;
    private String nombreTitular;
    private String correo;
    private EstadoSeguimiento estadoSeguimiento;
    private long totalAsignaciones;
}
