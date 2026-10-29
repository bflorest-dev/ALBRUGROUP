package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;

import java.time.Instant;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "horario_meet_reclutamiento", uniqueConstraints = {
        @UniqueConstraint(name = "uk_horario_meet_negocio_codigo", columnNames = {"negocio", "codigo"}),
        @UniqueConstraint(name = "uk_horario_meet_negocio_hora", columnNames = {"negocio", "hora_inicio"})
})
public class HorarioMeetReclutamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Negocio negocio;

    @Column(nullable = false, length = 40)
    private String codigo;

    @Column(nullable = false, length = 80)
    private String etiqueta;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(nullable = false)
    private Boolean activo;

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
