package pe.albrugroup.lead_service.entity;

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
import pe.albrugroup.lead_service.entity.enums.AportantePago;
import pe.albrugroup.lead_service.entity.enums.CondicionPagoPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPagoPostventa;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(indexes = {
        @Index(name = "idx_pago_postventa_lead_estado", columnList = "id_lead, estado")
})
public class PagoPostventa {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_lead", nullable = false)
    private Lead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_periodo_facturacion")
    private PeriodoFacturacionPostventa periodoFacturacionPostventa;

    @Enumerated(EnumType.STRING)
    private AportantePago aportante;
    @Enumerated(EnumType.STRING)
    private EstadoPagoPostventa estado;
    @Enumerated(EnumType.STRING)
    private CondicionPagoPostventa condicion = CondicionPagoPostventa.NORMAL;

    private BigDecimal monto;
    private LocalDate fechaPago;
    private LocalDate fechaCompromisoPago;
    private String numeroOperacion;
    private String canalPago;
    private String observacion;

    @CreationTimestamp
    @jakarta.persistence.Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
