package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

@Entity
@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(
        name = "lead_merito_correccion",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_lead_merito_correccion_lead_etapa",
                columnNames = {"id_lead", "etapa_merito"}
        ),
        indexes = @Index(name = "idx_lead_merito_correccion_lead", columnList = "id_lead")
)
public class LeadMeritoCorreccion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_lead", nullable = false)
    private Long idLead;

    @Column(name = "lead_numero", nullable = false, length = 50)
    private String leadNumero;

    @Enumerated(EnumType.STRING)
    @Column(name = "etapa_merito", nullable = false, length = 50)
    private Etapa etapaMerito;

    @Column(nullable = false)
    private Long idAsesorAnterior;

    @Column(nullable = false)
    private String nombreAsesorAnterior;

    @Column(nullable = false)
    private Long idAsesorNuevo;

    @Column(nullable = false)
    private String nombreAsesorNuevo;

    @Column(nullable = false)
    private Long idActor;

    @Column(nullable = false)
    private String nombreActor;

    @Column(nullable = false, length = 100)
    private String rolActor;

    @Column(length = 500)
    private String motivo;

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private Instant createdAt;
}
