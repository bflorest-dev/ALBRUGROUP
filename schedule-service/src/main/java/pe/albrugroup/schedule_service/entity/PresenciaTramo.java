package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.schedule_service.entity.enums.OrigenPresencia;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "presencia_tramo",
        indexes = @Index(name = "idx_presencia_tramo_empleado_fecha", columnList = "idEmpleado, fecha"))
public class PresenciaTramo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long idEmpleado;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private LocalDateTime inicio;

    private LocalDateTime fin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrigenPresencia origenInicio;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private OrigenPresencia origenFin;

    @Column(length = 30)
    private String estadoAlDesconectar;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
}
