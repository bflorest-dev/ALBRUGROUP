package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.schedule_service.entity.enums.EstadoAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.OrigenAjusteJornada;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "ajuste_jornada",
        indexes = {
                @Index(name = "idx_ajuste_jornada_empleado_fecha_estado", columnList = "id_empleado, fecha_operativa, estado"),
                @Index(name = "idx_ajuste_jornada_horario", columnList = "horario_id")
        }
)
public class AjusteJornada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_empleado", nullable = false)
    private Long idEmpleado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "horario_id", nullable = false)
    private Horario horario;

    @Column(name = "fecha_operativa", nullable = false)
    private LocalDate fechaOperativa;

    @Column(nullable = false)
    private LocalDateTime inicio;

    @Column(nullable = false)
    private LocalDateTime fin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoAjusteJornada estado;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrigenAjusteJornada origen;

    @Column(nullable = false, length = 300)
    private String motivo;

    @Column(name = "creado_por", nullable = false)
    private Long creadoPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reemplazado_por_id")
    private AjusteJornada reemplazadoPor;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
