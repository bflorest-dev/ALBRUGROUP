package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;
import pe.albrugroup.lead_service.entity.enums.Unidad;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadResponse {

    private Long id;
    private String prefijo;
    private String lead;
    private String usermeta;
    private Etapa etapa;
    private EstadoSeguimiento estadoSeguimiento;
    private Long idAsesorAsignado;
    private String nombreAsesorAsignado;
    private TipoDocumento tipoDocumento;
    private String numeroDocumentoTitularServicio;
    private Base base;
    private Long idTipificacion;
    private String codigoTipificacion;
    private Long idSubtipificacion;
    private String codigoSubtipificacion;
    private String nombrePlanSnapshot;
    private String nombreProveedorSnapshot;
    private BigDecimal precioPlanSnapshot;
    private String nombrePromocionInternaSnapshot;
    private BigDecimal precioAdicionalesSnapshot;
    private BigDecimal precioFinal;
    private Integer diaCorteFacturacion;
    private Integer mesesPermanenciaSnapshot;
    private Instant createdAt;
    private Instant lastEntryAt;
    private Instant fechaIngresoEtapa;
    private Instant updatedAt;
    private String sec;
    private String sot;
    private Boolean requiereSecSotVenta;
    private String nombreAsesorUltimaGestion;
    private Instant fechaUltimaGestion;
    private long totalAsignaciones;
    private LocalDate fechaProgramacion;
    private LocalTime horaProgramada;
    private LocalDate fechaRechazo;
    // Enriquecimiento del plan ofrecido para la bandeja BackOffice: velocidad regular y promocional.
    private Integer internetVelocidad;
    private Unidad internetUnidad;
    private Integer velocidadPromocional;
    private Integer mesesPromocionVelocidad;
    // Ultima vez que el lead fue tipificado (max createdAt de eventos de accion TIPIFICACION).
    private Instant ultimaTipificacionAt;
    private String ultimoComentarioTipificacion;
}
