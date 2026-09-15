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
        name = "freelance_venta_origen",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_freelance_venta_request", columnNames = "request_id"),
                @UniqueConstraint(name = "uk_freelance_venta_lead", columnNames = "id_lead")
        },
        indexes = @Index(name = "idx_freelance_venta_usuario_fecha", columnList = "id_freelance, creado_at")
)
public class FreelanceVentaOrigen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false, updatable = false)
    private UUID requestId;

    @Column(name = "id_lead", nullable = false, updatable = false)
    private Long idLead;

    @Column(name = "id_freelance", nullable = false, updatable = false)
    private Long idFreelance;

    @Column(name = "nombre_freelance", nullable = false, updatable = false)
    private String nombreFreelance;

    @Column(name = "id_equipo_origen", nullable = false, updatable = false)
    private Long idEquipoOrigen;

    @CreationTimestamp
    @Column(name = "creado_at", nullable = false, updatable = false)
    private Instant creadoAt;
}
