package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.schedule_service.entity.enums.TipoSesionEstado;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Sub-estado repetible cronometrado (SERVICIOS, PAUSA_ACTIVA, CAPACITACION). Una fila por uso;
 * los totales y topes se DERIVAN por suma (no acumulador). Sesion en curso = {@code fin == null}.
 */
@Entity @Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@Table(
        name = "sesion_estado",
        indexes = @Index(name = "idx_sesion_estado_asistencia", columnList = "asistencia_id")
)
public class SesionEstado {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asistencia_id", nullable = false)
    private Asistencia asistencia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoSesionEstado tipo;

    @Column(nullable = false)
    private LocalDateTime inicio;
    /** null mientras la sesion sigue en curso. */
    private LocalDateTime fin;

    /** Quien activo la sesion (usado en CAPACITACION, que activa un rol externo). */
    private Long creadoPor;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
}
