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
    @Column(precision = 10, scale = 2)
    private BigDecimal sueldoBase;
    @Column(name = "asignacion_familiar", precision = 5, scale = 2)
    private BigDecimal asignacionFamiliar;
    @Column(name = "bono_puntualidad", precision = 5, scale = 2)
    private BigDecimal bonoPuntualidad;
    @Column(name = "comision_semanal", precision = 5, scale = 2)
    private BigDecimal comisionSemanal;
    @Column(name = "comision_mensual", precision = 5, scale = 2)
    private BigDecimal comisionMensual;
    @Column(name = "bono_extra", precision = 5, scale = 2)
    private BigDecimal bonoExtra;
    @Column(name = "sueldo_total", precision = 10, scale = 2)
    private BigDecimal sueldoTotal;
}
