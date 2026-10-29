package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "sesion_meet_reclutamiento")
public class SesionMeetReclutamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "horario_id")
    private HorarioMeetReclutamiento horario;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Negocio negocio;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private LocalDateTime fechaHoraInicio;

    @Column(length = 500)
    private String enlace;

    @Column(nullable = false, length = 30)
    private String estado;

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
