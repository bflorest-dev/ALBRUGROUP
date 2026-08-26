package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadInstalacionCorreccionCandidatoResponse {

    private Long idLead;
    private String lead;
    private String usermeta;
    private TipoDocumento tipoDocumento;
    private String numeroDocumento;
    private String nombreCliente;
    private String proveedor;
    private String plan;
    private Etapa etapa;
    private String sec;
    private String sot;
    private LocalDate fechaInstalacion;
    private Instant fechaTipificacionInstalado;
    private String nombreAsesorInstalador;
    private boolean faltaSec;
    private boolean faltaSot;
    private boolean faltaFechaInstalacion;
}
