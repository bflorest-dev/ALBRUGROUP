package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

/**
 * Metadata histórica de un lead POR ETAPA (una fila por (idLead, etapa)).
 *
 * Separa los puntos históricos (primera/última/mayor rango de tipificación, mérito y último gestor
 * por etapa) del estado operativo vivo del {@link Lead}. Se crea al ENTRAR a una etapa y se actualiza
 * en cada asignación/tipificación/avance. La partición por equipo se resuelve joineando {@link Lead}
 * (no se denormaliza idEquipo/idCampana aquí).
 */
@Entity
@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(
        name = "lead_etapa_resumen",
        uniqueConstraints = @UniqueConstraint(name = "uk_lead_etapa", columnNames = {"id_lead", "etapa"}),
        indexes = {
                @Index(name = "idx_lead_etapa_resumen_lead", columnList = "id_lead"),
                @Index(name = "idx_lead_etapa_resumen_etapa", columnList = "etapa")
        }
)
public class LeadEtapaResumen {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_lead", nullable = false)
    private Long idLead;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Etapa etapa;

    // Contexto de la etapa
    private Instant fechaIngresoEtapa;
    private Instant fechaSalidaEtapa;
    @Builder.Default
    private Integer numeroPasadas = 1;
    @Builder.Default
    private Integer totalTipificaciones = 0;
    @Builder.Default
    private Integer totalAsignaciones = 0;

    // Primera tipificación de la etapa (set-once)
    private String primeraCodigoTipificacion;
    private String primeraCodigoSubtipificacion;
    private Integer primeraTipificacionOrden;
    private Instant primeraTipificacionAt;

    // Última tipificación de la etapa (se pisa siempre)
    private String ultimaCodigoTipificacion;
    private String ultimaCodigoSubtipificacion;
    private Integer ultimaTipificacionOrden;
    private Instant ultimaTipificacionAt;

    // Tipificación de mayor rango alcanzada (high-water mark por orden)
    private String mayorRangoCodigoTipificacion;
    private String mayorRangoCodigoSubtipificacion;
    private Integer mayorRangoOrden;
    private Instant mayorRangoAt;

    // Atribución: mérito (quien concreta/avanza la etapa) vs último que la gestionó
    private Long idAsesorMerito;
    private String nombreAsesorMerito;
    private Instant fechaMerito;
    private Long idAsesorUltimaGestion;
    private String nombreAsesorUltimaGestion;
    private Instant fechaUltimaGestion;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
