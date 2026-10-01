package pe.albrugroup.billing_service.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.billing_service.entity.enums.ModalidadTrabajo;
import pe.albrugroup.billing_service.entity.enums.TipoDocumento;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(
        name = "planilla_empleado",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_planilla_empleado",
                columnNames = {"id_planilla_general", "id_empleado"}
        )
)
public class PlanillaEmpleado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_empleado", nullable = false)
    private Long idEmpleado;

    @Column(nullable = false)
    private String nombres;

    @Column(nullable = false)
    private String apellidos;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoDocumento tipoDocumento;

    @Column(nullable = false)
    private String numeroDocumento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ModalidadTrabajo modalidadDominante;

    @Column(nullable = false)
    private boolean multipleTramos;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal sueldoBasico;

    @Column(nullable = false)
    private Integer diasMes;

    @Column(nullable = false)
    private Integer diasHabiles;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal pagoDiaHabil;

    @Column(nullable = false)
    private LocalDate fechaIngreso;

    private LocalDate fechaBaja;

    @Column(nullable = false)
    private Integer diasValidos;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal sueldoAfecto;

    @Column(nullable = false)
    private Integer tardanzas;

    @Column(nullable = false)
    private Integer faltasInjustificadas;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal descuentoTardanzas;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal descuentoFaltas;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal adelantoSueldo;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalDescuento;

    @Column(nullable = false)
    private Integer ventasValidas;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal bonoProductividad;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal bonoPuntualidad;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal bonoCapacitacion;

    @Column(nullable = false)
    private Integer minutosExtras;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal pagoExtras;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalBonificaciones;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal remuneracionNeta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_planilla_general", nullable = false)
    private PlanillaGeneral planillaGeneral;

    @Builder.Default
    @OneToMany(mappedBy = "planillaEmpleado", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TramoPlanillaEmpleado> tramos = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "planillaEmpleado", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetallePlanilla> detalles = new ArrayList<>();

    @Column(updatable = false)
    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
