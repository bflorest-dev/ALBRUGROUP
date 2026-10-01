package pe.albrugroup.billing_service.entity;

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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.billing_service.entity.enums.ModalidadTrabajo;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "tramo_planilla_empleado")
public class TramoPlanillaEmpleado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long idContrato;

    @Column(nullable = false)
    private LocalDate fechaInicioContrato;

    private LocalDate fechaFinContrato;

    @Column(nullable = false)
    private LocalDate fechaDesdeTramo;

    @Column(nullable = false)
    private LocalDate fechaHastaTramo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ModalidadTrabajo modalidadTrabajo;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal sueldoBasico;

    @Column(nullable = false)
    private Integer horasDia;

    @Column(nullable = false)
    private Integer diasValidos;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal pagoDiaHabil;

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

    @Column(nullable = false)
    private Integer minutosExtras;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal pagoExtras;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_planilla_empleado", nullable = false)
    private PlanillaEmpleado planillaEmpleado;

    @Column(updatable = false)
    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
