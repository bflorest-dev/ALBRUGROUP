package pe.albrugroup.lead_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(indexes = {
        @Index(name = "idx_periodo_postventa_calendario", columnList = "id_calendario_facturacion"),
        @Index(name = "idx_periodo_postventa_lead_estado", columnList = "id_lead, estado"),
        @Index(name = "idx_periodo_postventa_vencimiento", columnList = "fechaVencimientoEstimado")
})
public class PeriodoFacturacionPostventa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_calendario_facturacion", nullable = false)
    private CalendarioFacturacionPostventa calendarioFacturacionPostventa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_lead", nullable = false)
    private Lead lead;

    private Integer numeroPeriodo;
    private LocalDate fechaInicioPeriodo;
    private LocalDate fechaFinPeriodo;
    private LocalDate fechaCorteEstimada;
    private LocalDate fechaEmisionEstimada;
    private LocalDate fechaEmisionConfirmada;
    private LocalDate fechaVencimientoEstimado;
    private LocalDate fechaVencimientoConfirmado;
    private BigDecimal montoEsperado;
    private BigDecimal montoProrrateo;
    private BigDecimal montoFacturado;

    @Enumerated(EnumType.STRING)
    private EstadoPeriodoFacturacionPostventa estado;

    private String observacion;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
