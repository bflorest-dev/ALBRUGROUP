package pe.albrugroup.rrhh_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Pago {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // RELACIONES
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contrato_id", nullable = false)
    private Contrato contrato;
    // PERIODO
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    // ABONO
    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal sueldoBase;
    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal asignacionFamiliar;
    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal comision;
    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal sueldoTotal;
}
