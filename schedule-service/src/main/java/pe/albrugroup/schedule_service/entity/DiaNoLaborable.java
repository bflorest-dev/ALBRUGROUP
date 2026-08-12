package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.schedule_service.entity.enums.AlcanceDiaNoLaborable;
import pe.albrugroup.schedule_service.entity.enums.TipoDiaNoLaborable;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Override de calendario con alcance. Resolucion: el mas angosto que aplique
 * (EMPLEADO > EQUIPO > GLOBAL). laborable=false => libre (no cuenta FALTA ni afecta
 * balance); laborable=true => override "si trabaja" (p. ej. equipo que labora un feriado global).
 */
@Entity @Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@Table(
        name = "dia_no_laborable",
        indexes = @Index(name = "idx_dia_no_laborable_fecha", columnList = "fecha")
)
public class DiaNoLaborable {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AlcanceDiaNoLaborable alcance;

    /** idEquipo o idEmpleado segun el alcance; null cuando alcance = GLOBAL. */
    private Long refId;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private Boolean laborable;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoDiaNoLaborable tipo;

    @Column(length = 300)
    private String motivo;

    private Long creadoPor;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
}
