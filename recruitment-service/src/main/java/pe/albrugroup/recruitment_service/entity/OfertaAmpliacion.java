package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class OfertaAmpliacion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long idSolicitante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "oferta_laboral_id", nullable = false)
    private OfertaLaboral ofertaLaboral;

    private Integer cantidad;
    private LocalDate plazo;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
