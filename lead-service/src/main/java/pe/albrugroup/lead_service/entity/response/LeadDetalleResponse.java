package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.Parentesco;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;
import pe.albrugroup.lead_service.entity.enums.TipoDomicilio;
import pe.albrugroup.lead_service.entity.enums.TipoVia;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadDetalleResponse {

    private Long id;
    private Instant fechaAsignacion;
    private Instant lastEntryAt;
    private String prefijo;
    private String lead;
    private String numeroParaLlamar;
    private String usermeta;
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
    private LocalDate fechaNacimiento;
    private Parentesco parentesco;
    private String nombreMadre;
    private String nombrePadre;
    private String numeroDocumentoTitularCelularRegistro;
    private String nombreTitularCelularRegistro;
    private String ubigeoNacimiento;
    private String ubigeoDomicilio;
    private String departamentoDomicilio;
    private String provinciaDomicilio;
    private String distritoDomicilio;
    private TipoDomicilio tipoDomicilio;
    private TipoVia tipoVia;
    private String via;
    private String direccion;
    private String referencia;
    private String latitud;
    private String longitud;
    private String urbanizacion;
    private String numero;
    private String manzana;
    private String lote;
    private String nombreEdificio;
    private String nombreCondominio;
    private String plano;
    private String piso;
    private String interior;
    private String sec;
    private String sot;
    private String customerId;
    private Boolean requiereSecSotVenta;
    private Long idPlan;
    private String nombrePlan;
    private String nombreProveedorPlan;
    private BigDecimal precioPlan;
    private Long idPromocionInterna;
    private String nombrePromocionInterna;
    private BigDecimal precioAdicionales;
    private BigDecimal precioFinal;
    private Integer diaCorteFacturacion;
    private Integer mesesPermanenciaSnapshot;
    private LocalDate fechaProgramacion;
    private LocalTime horaProgramada;
    private LeadPlanDetalleResponse plan;
    private LeadPromocionDetalleResponse promocionInterna;
    private List<LeadAdicionalDetalleResponse> adicionales;
    private long totalAsignaciones;
    // Etapa real del lead y bandera de atención: si no está en PREVENTA, el frontend muestra los
    // campos en solo lectura y solo permite tipificar (informativo) o crear nuevas oportunidades.
    private Etapa etapa;
    private boolean atencionOtraEtapa;
    // Config de campos de captura resuelta preferentemente desde el proveedor del plan del lead;
    // si no tiene plan, cae al equipo del lead. Por cada campo configurable indica si se muestra
    // y si es obligatorio.
    private List<CampoConfigResponse> camposConfig;
    // Proveedor fallback del equipo del lead: origen a mostrar cuando el lead no tiene campaña.
    private String nombreProveedorEquipo;
}
