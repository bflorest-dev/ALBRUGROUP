package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.schedule_service.entity.enums.OrigenTramo;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Tramo de asistencia archivado dentro de un mismo dia operativo.
 *
 * Solo se crea cuando una jornada ya cerrada se REABRE por una ampliacion (caso 3):
 * el tramo cerrado se guarda aqui y la fila principal de {@link Asistencia} se reinicia
 * para el tramo nuevo. En dias normales esta tabla queda vacia y el comportamiento del
 * sistema es identico al previo (los minutos del dia siguen viviendo en la fila de asistencia).
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "asistencia_tramo",
        indexes = @Index(name = "idx_asistencia_tramo_asistencia", columnList = "asistencia_id")
)
public class AsistenciaTramo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asistencia_id", nullable = false)
    private Asistencia asistencia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrigenTramo origen;

    private LocalTime entradaProgramada;
    private LocalTime salidaProgramada;
    private LocalTime inicioAlmuerzoProgramado;
    private LocalTime finAlmuerzoProgramado;

    private LocalDateTime fechaHoraIngreso;
    private LocalDateTime fechaHoraSalida;

    @Column(nullable = false)
    private Integer minutosObjetivo;
    @Column(nullable = false)
    private Integer minutosTrabajados;
    @Column(nullable = false)
    private Integer minutosAlmuerzoTomados;
    @Column(nullable = false)
    private Integer minutosServiciosAcumulados;

    /** Motivo de la ampliacion que cerro este tramo (cuando aplica). */
    @Column(length = 300)
    private String motivo;

    /** Empleado que registro la ampliacion que archivo este tramo. */
    private Long creadoPor;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
}
