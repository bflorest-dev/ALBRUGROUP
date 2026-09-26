package pe.albrugroup.lead_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(name = "gasto_campana", indexes = {
    @Index(name = "idx_gasto_campana_reported", columnList = "id_campana, reported_at, id"),
    @Index(name = "idx_gasto_campana_reported_at", columnList = "reported_at")
})
public class GastoCampana {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_campana", nullable = false)
    private Campana campana;
    @Column(nullable = false)
    private Integer leadsReportados;
    @Column(nullable = false)
    private Integer leadsReales;
    @Column(nullable = false)
    private Integer cantidadPreventas;
    @Column
    private Integer cantidadVentas;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal costoTotal;
    @Column(name = "reported_at", nullable = false)
    private LocalDateTime reportedAt;
    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
