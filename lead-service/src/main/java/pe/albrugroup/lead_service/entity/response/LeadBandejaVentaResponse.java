package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.OrigenFilaBandejaVenta;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;
import pe.albrugroup.lead_service.entity.enums.TipoFechaRelevanteVenta;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadBandejaVentaResponse {

    private Long idLead;
    private Long idEventoReferencia;
    private OrigenFilaBandejaVenta origenFila;
    private Etapa etapaActual;
    private EstadoSeguimiento estadoSeguimiento;
    private EstadoClientePostventa estadoClientePostventa;
    private String prefijo;
    private String lead;
    private String usermeta;
    private TipoDocumento tipoDocumento;
    private String numeroDocumento;
    private String nombreCliente;
    private Base base;
    private Long idTipificacionActual;
    private String codigoTipificacionActual;
    private Long idSubtipificacionActual;
    private String codigoSubtipificacionActual;
    private String codigoTipificacionBandeja;
    private String codigoSubtipificacionBandeja;
    private String proveedor;
    private String plan;
    private BigDecimal precioPlan;
    private String promocion;
    private BigDecimal precioAdicionales;
    private BigDecimal precioFinal;
    private Integer diaCorteFacturacion;
    private Integer mesesPermanencia;
    private Instant createdAt;
    private Instant lastEntryAt;
    private Instant fechaIngresoEtapa;
    private Instant updatedAt;
    private String sec;
    private String sot;
    private String customerId;
    private Boolean requiereSecSotVenta;
    private String nombreAsesorMeritoPreventa;
    private String nombreAsesorUltimaGestion;
    private Instant fechaUltimaGestion;
    private Long idAsesorEvento;
    private String nombreAsesorEvento;
    private LocalDate fechaProgramacion;
    private LocalTime horaProgramada;
    private LocalDate fechaRechazo;
    private LocalDate fechaInstalacion;
    private Instant fechaTipificacion;
    private String comentarioTipificacion;
    private String comentarioLead;
    private LocalDate fechaRelevante;
    private LocalTime horaRelevante;
    private Instant fechaRelevanteAt;
    private TipoFechaRelevanteVenta tipoFechaRelevante;
}
