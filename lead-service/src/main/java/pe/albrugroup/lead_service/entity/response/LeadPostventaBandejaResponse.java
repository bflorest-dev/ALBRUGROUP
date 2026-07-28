package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoCredencialesPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPagoPeriodoPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPlataformaDigitalLead;
import pe.albrugroup.lead_service.entity.enums.EstadoServicioPostventa;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadPostventaBandejaResponse {

    private Long idLead;
    private LocalDate fechaInstalacion;
    private TipoDocumento tipoDocumento;
    private String numeroDocumento;
    private String lead;
    private String nombreCliente;
    private String telefonoRegistro;
    private String proveedor;
    private String plan;
    private LocalDate mesCorteBase;
    private Integer numeroCorteBase;
    private Boolean corteCorregido;
    private Instant fechaCorreccionCorte;
    private Long idPlataformaDigitalOfrecida;
    private String plataformaDigitalOfrecida;
    private EstadoClientePostventa estadoCliente;
    private EstadoCredencialesPostventa estadoCredenciales;
    private EstadoPagoPeriodoPostventa estadoPago;
    private EstadoServicioPostventa estadoServicio;
    private EstadoPlataformaDigitalLead estadoPlataformaDigital;
    private String ultimoGestor;
    private Instant ultimaGestion;
}
