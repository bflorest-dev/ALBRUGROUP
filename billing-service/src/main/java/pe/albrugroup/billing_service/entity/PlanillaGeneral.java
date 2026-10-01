package pe.albrugroup.billing_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.billing_service.entity.enums.Estado;
import pe.albrugroup.billing_service.entity.enums.TipoPlanilla;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(
        name = "planilla_general",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_planilla_general_periodo_tipo",
                columnNames = {"anio", "mes", "tipo_planilla"}
        )
)
public class PlanillaGeneral {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer anio;

    @Column(nullable = false)
    private Integer mes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoPlanilla tipoPlanilla;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Estado estado;

    @Column(nullable = false, length = 3)
    private String moneda;

    @Column(nullable = false)
    private Integer versionCalculo;

    private Instant approvedAt;
    private String approvedBy;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalGastoPlanilla;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalDescuentos;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalBonificaciones;

    @Column(nullable = false)
    private Integer cantidadEmpleados;

    @Builder.Default
    @OneToMany(mappedBy = "planillaGeneral", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlanillaEmpleado> empleados = new ArrayList<>();

    @Column(updatable = false)
    @CreationTimestamp
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
