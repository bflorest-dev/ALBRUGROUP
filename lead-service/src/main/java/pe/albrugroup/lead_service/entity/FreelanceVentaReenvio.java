package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "freelance_venta_reenvio",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_freelance_reenvio_request", columnNames = "request_id"),
                @UniqueConstraint(name = "uk_freelance_reenvio_intento", columnNames = {"id_origen", "numero_intento"})
        }
)
public class FreelanceVentaReenvio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false, updatable = false)
    private UUID requestId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_origen", nullable = false, updatable = false)
    private FreelanceVentaOrigen origen;

    @Column(name = "numero_intento", nullable = false, updatable = false)
    private Integer numeroIntento;

    @CreationTimestamp
    @Column(name = "creado_at", nullable = false, updatable = false)
    private Instant creadoAt;
}
