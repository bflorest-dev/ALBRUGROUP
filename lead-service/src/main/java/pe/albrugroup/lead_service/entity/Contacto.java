package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Identidad de la persona/teléfono. Único por (prefijo + lead). Ancla de de-duplicación:
 * un Contacto puede tener varias Oportunidades (distintos titulares/servicios/equipos).
 * El teléfono se denormaliza también en Oportunidad (snapshot) para acelerar las consultas.
 */
@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(
        name = "contacto",
        uniqueConstraints = @UniqueConstraint(name = "uq_contacto_prefijo_lead", columnNames = {"prefijo", "lead"}),
        indexes = @Index(name = "idx_contacto_prefijo_lead", columnList = "prefijo, lead")
)
public class Contacto {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String prefijo;
    private String lead;
    private String usermeta;

    // Último nombre conocido (cache para bandejas/lupa sin cargar la oportunidad).
    private String nombreConocido;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
