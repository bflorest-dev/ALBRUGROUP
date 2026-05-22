package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoPostventa;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadPostventaResponse {

    private Long idLead;
    private String proveedor;
    private String asesorPreventa;
    private String lead;
    private TipoDocumento tipoDocumento;
    private String numeroDocumento;
    private String nombreCompletoLead;
    private String departamento;
    private LocalDate fechaInstalacion;
    private Integer diaCorteFacturacion;
    private EstadoPostventa estadoPostventa;
    private long totalAsignaciones;
}
