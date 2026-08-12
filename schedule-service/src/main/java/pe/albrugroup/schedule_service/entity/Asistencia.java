package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;
import pe.albrugroup.schedule_service.entity.enums.OrigenAlmuerzo;
import pe.albrugroup.schedule_service.entity.enums.OrigenTramo;

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

    // Split de almuerzo (rediseno): el ESTADO se separa de la MARCACION REAL (contador).
    /** Momento en que entro al estado ALMUERZO (marca manual o forzado). */
    private LocalDateTime almuerzoEstadoDesde;
    /** Inicio real del almuerzo (arranca al vaciar bandeja, para roles que gestionan leads). */
    private LocalDateTime almuerzoRealInicio;
    private LocalDateTime almuerzoRealFin;
    @Enumerated(EnumType.STRING)
    @Column(name = "origen_almuerzo", length = 20)
    private OrigenAlmuerzo origenAlmuerzo;

    /** Tiempo extra autorizado (minutos exactos), separado del balance. Nunca negativo. */
    @Builder.Default
    @Column(nullable = false)
    private Integer minutosExtra = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ajuste_jornada_actual_id")
    private AjusteJornada ajusteJornadaActual;

    @Enumerated(EnumType.STRING)
    @Column(name = "origen_tramo_actual", length = 30)
    private OrigenTramo origenTramoActual;

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
