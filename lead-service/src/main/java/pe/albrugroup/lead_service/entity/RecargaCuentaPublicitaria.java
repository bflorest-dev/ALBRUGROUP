package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(name = "recarga_cuenta_publicitaria", indexes = {
    @Index(name = "idx_recarga_cuenta_fecha", columnList = "id_cuenta_publicitaria, fecha")
})
public class RecargaCuentaPublicitaria {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_cuenta_publicitaria", nullable = false)
    private CuentaPublicitaria cuentaPublicitaria;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(length = 500)
    private String observacion;

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private Instant createdAt;
}
