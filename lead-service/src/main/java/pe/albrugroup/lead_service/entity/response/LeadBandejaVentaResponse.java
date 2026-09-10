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
    private String departamentoGrupo;
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

    public LeadBandejaVentaResponse(
            Long idLead,
            Long idEventoReferencia,
            Object origenFila,
            Etapa etapaActual,
            EstadoSeguimiento estadoSeguimiento,
            EstadoClientePostventa estadoClientePostventa,
            String prefijo,
            String lead,
            String usermeta,
            TipoDocumento tipoDocumento,
            String numeroDocumento,
            String nombreCliente,
            String departamentoGrupo,
            Base base,
            Long idTipificacionActual,
            String codigoTipificacionActual,
            Long idSubtipificacionActual,
            String codigoSubtipificacionActual,
            String codigoTipificacionBandeja,
            String codigoSubtipificacionBandeja,
            String proveedor,
            String plan,
            BigDecimal precioPlan,
            String promocion,
            BigDecimal precioAdicionales,
            BigDecimal precioFinal,
            Integer diaCorteFacturacion,
            Integer mesesPermanencia,
            Instant createdAt,
            Instant lastEntryAt,
            Instant fechaIngresoEtapa,
            Instant updatedAt,
            String sec,
            String sot,
            String customerId,
            Boolean requiereSecSotVenta,
            String nombreAsesorMeritoPreventa,
            String nombreAsesorUltimaGestion,
            Instant fechaUltimaGestion,
            Long idAsesorEvento,
            String nombreAsesorEvento,
            LocalDate fechaProgramacion,
            LocalTime horaProgramada,
            LocalDate fechaRechazo,
            LocalDate fechaInstalacion,
            Instant fechaTipificacion,
            String comentarioTipificacion,
            String comentarioLead
    ) {
        this.idLead = idLead;
        this.idEventoReferencia = idEventoReferencia;
        this.origenFila = resolverOrigenFila(origenFila);
        this.etapaActual = etapaActual;
        this.estadoSeguimiento = estadoSeguimiento;
        this.estadoClientePostventa = estadoClientePostventa;
        this.prefijo = prefijo;
        this.lead = lead;
        this.usermeta = usermeta;
        this.tipoDocumento = tipoDocumento;
        this.numeroDocumento = numeroDocumento;
        this.nombreCliente = nombreCliente;
        this.departamentoGrupo = departamentoGrupo;
        this.base = base;
        this.idTipificacionActual = idTipificacionActual;
        this.codigoTipificacionActual = codigoTipificacionActual;
        this.idSubtipificacionActual = idSubtipificacionActual;
        this.codigoSubtipificacionActual = codigoSubtipificacionActual;
        this.codigoTipificacionBandeja = codigoTipificacionBandeja;
        this.codigoSubtipificacionBandeja = codigoSubtipificacionBandeja;
        this.proveedor = proveedor;
        this.plan = plan;
        this.precioPlan = precioPlan;
        this.promocion = promocion;
        this.precioAdicionales = precioAdicionales;
        this.precioFinal = precioFinal;
        this.diaCorteFacturacion = diaCorteFacturacion;
        this.mesesPermanencia = mesesPermanencia;
        this.createdAt = createdAt;
        this.lastEntryAt = lastEntryAt;
        this.fechaIngresoEtapa = fechaIngresoEtapa;
        this.updatedAt = updatedAt;
        this.sec = sec;
        this.sot = sot;
        this.customerId = customerId;
        this.requiereSecSotVenta = requiereSecSotVenta;
        this.nombreAsesorMeritoPreventa = nombreAsesorMeritoPreventa;
        this.nombreAsesorUltimaGestion = nombreAsesorUltimaGestion;
        this.fechaUltimaGestion = fechaUltimaGestion;
        this.idAsesorEvento = idAsesorEvento;
        this.nombreAsesorEvento = nombreAsesorEvento;
        this.fechaProgramacion = fechaProgramacion;
        this.horaProgramada = horaProgramada;
        this.fechaRechazo = fechaRechazo;
        this.fechaInstalacion = fechaInstalacion;
        this.fechaTipificacion = fechaTipificacion;
        this.comentarioTipificacion = comentarioTipificacion;
        this.comentarioLead = comentarioLead;
    }

    private OrigenFilaBandejaVenta resolverOrigenFila(Object origenFila) {
        if (origenFila instanceof OrigenFilaBandejaVenta origen) {
            return origen;
        }
        if (origenFila instanceof Number ordinal) {
            return OrigenFilaBandejaVenta.values()[ordinal.intValue()];
        }
        return origenFila == null ? null : OrigenFilaBandejaVenta.valueOf(origenFila.toString());
    }
}
