package pe.albrugroup.call_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.call_service.entity.enums.EstadoCampana;
import pe.albrugroup.call_service.entity.enums.EstrategiaDialer;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;

/**
 * Configuracion de una campaña de marcacion saliente.
 * En Fase 2 se vincula con Campana de lead-service via idCampanaLead.
 */
@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(name = "campanas_dialer", indexes = {
        @Index(name = "idx_outcampaign_estado", columnList = "estado"),
        @Index(name = "idx_outcampaign_lead", columnList = "id_campana_lead")
})
public class OutboundCampaign {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 128)
    private String nombre;

    /** FK logica a Campana de lead-service. */
    @Column(name = "id_campana_lead")
    private Long idCampanaLead;

    /** Nombre de la cola en queues.conf donde se enrutan las contestadas. */
    @Column(length = 64)
    private String queueName;

    @Enumerated(EnumType.STRING)
    private EstrategiaDialer estrategia;

    /** Llamadas por agente disponible (1.0 = progressive, >1 = predictive). */
    @Column(precision = 4, scale = 2)
    private BigDecimal ratioMarcacion;

    private Integer maxIntentos;
    /** Minutos entre reintentos al mismo numero. */
    private Integer intervaloReintentoMin;

    private LocalTime horarioInicio;
    private LocalTime horarioFin;
    /** Bitmask de dias permitidos (lun=1, mar=2, ... dom=64). Suma = mascara. */
    private Integer diasSemanaMask;

    @Enumerated(EnumType.STRING)
    private EstadoCampana estado;

    /** Tasa maxima de abandono permitida (politica/legal). */
    @Column(precision = 5, scale = 4)
    private BigDecimal abandonRateObjetivo;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
