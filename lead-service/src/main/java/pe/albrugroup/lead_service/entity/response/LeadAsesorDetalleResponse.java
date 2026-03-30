package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;
import pe.albrugroup.lead_service.entity.enums.TipoDomicilio;
import pe.albrugroup.lead_service.entity.enums.TipoVia;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadAsesorDetalleResponse {

    private Long id;
    private Instant fechaAsignacion;
    private Instant lastEntryAt;
    private String prefijo;
    private String lead;
    private String nombreCampana;
    private String nombreProveedorCampana;
    private Base base;
    private EstadoSeguimiento estadoSeguimiento;
    private Long idAsesorAsignado;
    private String nombreAsesorAsignado;
    private TipoDocumento tipoDocumento;
    private String numeroDocumentoTitularServicio;
    private String nombreTitular;
    private String celularRegistro;
    private String celularReferencia;
    private String correo;
    private String numeroDocumentoTitularCelularRegistro;
    private String nombreTitularCelularRegistro;
    private String ubigeoNacimiento;
    private String ubigeoDomicilio;
    private TipoDomicilio tipoDomicilio;
    private TipoVia tipoVia;
    private String via;
    private String direccion;
    private String referencia;
    private BigDecimal latitud;
    private BigDecimal longitud;
    private String urbanizacion;
    private String numero;
    private String manzana;
    private String lote;
    private String nombreEdificio;
    private String nombreCondominio;
    private String piso;
    private String interior;
}
