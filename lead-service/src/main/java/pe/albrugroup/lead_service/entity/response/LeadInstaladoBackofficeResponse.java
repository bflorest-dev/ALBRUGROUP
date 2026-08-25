package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadInstaladoBackofficeResponse {

    private Long idLead;
    private String prefijo;
    private String lead;
    private String usermeta;
    private String numeroDocumento;
    private String nombreCliente;
    private String proveedor;
    private String plan;
    private LocalDate fechaInstalacion;
    private Instant fechaTipificacionInstalado;
    private Long idAsesorInstalador;
    private String nombreAsesorInstalador;
    private EstadoClientePostventa estadoClientePostventa;
    private Etapa etapaActual;
}
