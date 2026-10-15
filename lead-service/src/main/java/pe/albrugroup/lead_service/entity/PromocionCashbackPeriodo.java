package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class PromocionCashbackPeriodo {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_promocion_comercial", nullable = false)
    private PromocionComercial promocionComercial;

    @Column(nullable = false)
    private Integer numeroPeriodo;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;
}
