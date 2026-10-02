package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoCumplimientoSemana;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;
import pe.albrugroup.lead_service.entity.enums.TipoReglaFacturacion;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadPreventaInstalacionResponse {

    private Long idLead;
    private String prefijo;
    private String lead;
    private TipoDocumento tipoDocumento;
    private String numeroDocumento;
    private String nombreCliente;
    private String departamento;
    private Long idAsesorPreventa;
    private String nombreAsesorPreventa;
    private Long idProveedor;
    private String proveedor;
    private TipoReglaFacturacion reglaSemanaProveedor;
    private LocalDate fechaPreventa;
    private LocalDate fechaInstalacion;
    private EstadoClientePostventa estadoPostventa;
    private Etapa etapaActual;
    private Boolean cumpleMismaSemana;
    private EstadoCumplimientoSemana estadoCumplimientoSemana;
    private Long diasEntrePreventaEInstalacion;
    private LocalDate semanaPreventaInicio;
    private LocalDate semanaPreventaFin;
    private LocalDate semanaInstalacionInicio;
    private LocalDate semanaInstalacionFin;
}
