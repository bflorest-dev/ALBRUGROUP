package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity @Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@Table(name = "asistencia",
        uniqueConstraints = @UniqueConstraint(name = "uk_asistencia_empleado_fecha", columnNames = {"idEmpleado", "fecha"}))
public class Asistencia {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long idEmpleado;
    @Column(nullable = false)
    private Long idHorario;
    @Column(nullable = false)
    private LocalDate fecha;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoAsistencia estadoActual;

    private LocalTime entradaProgramada;
    private LocalTime salidaProgramada;
    private LocalTime inicioAlmuerzoProgramado;
    private LocalTime finAlmuerzoProgramado;
    private LocalDateTime fechaHoraIngreso;
    private LocalDateTime fechaHoraSalida;
    private LocalDateTime fechaHoraInicioAlmuerzo;
    private LocalDateTime fechaHoraFinAlmuerzo;
    private LocalDateTime fechaHoraInicioServiciosActual;

    @Column(nullable = false)
    private Integer minutosObjetivoDia;
    @Column(nullable = false)
    private Integer minutosTrabajados;
    @Column(nullable = false)
    private Integer minutosBalance;
    @Column(nullable = false)
    private Integer minutosAlmuerzoTomados;
    @Column(nullable = false)
    private Integer minutosServiciosPermitidos;
    @Column(nullable = false)
    private Integer minutosServiciosAcumulados;
    @Column(nullable = false)
    private Boolean excedioServicios;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
