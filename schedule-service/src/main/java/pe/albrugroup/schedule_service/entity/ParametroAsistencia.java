package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Reglas de comportamiento editables, resueltas por precedencia:
 * (rol, idEquipo) > (rol) > global (null, null).
 * No incluye politica de descuentos (eso vive en el ms de calculo).
 */
@Entity @Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@Table(name = "parametro_asistencia")
public class ParametroAsistencia {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** null = aplica a todos los roles. */
    @Column(length = 50)
    private String rol;
    /** null = aplica a todos los equipos. */
    private Long idEquipo;

    private Integer margenAdelantoMin;
    private Integer toleranciaTardanzaMin;
    private Integer bloqueoTardanzaMin;
    private Integer maxMinutosPausaActiva;
    private Integer maxUsosPausaActivaDia;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
