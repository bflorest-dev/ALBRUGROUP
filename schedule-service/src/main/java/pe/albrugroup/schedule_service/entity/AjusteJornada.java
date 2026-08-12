package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.schedule_service.entity.enums.EstadoAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.OrigenAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.RazonAjuste;

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

    /**
     * Intencion (ortogonal a {@code origen}). Decide status del dia, balance y autorizacion.
     * Nullable: filas previas al rediseno se rellenan en el backfill.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private RazonAjuste razon;

    /** Rol del autor del ajuste (auditoria + reglas de autorizacion en la capa service). */
    @Column(name = "rol_autor", length = 50)
    private String rolAutor;

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
