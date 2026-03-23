package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.recruitment_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.Origen;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.enums.TurnoHorario;

import java.time.Instant;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Postulacion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private Origen origen;
    @Enumerated(EnumType.STRING)
    private PuestoObjetivo objetivo;
    @Enumerated(EnumType.STRING)
    private TurnoHorario horario;

    @Enumerated(EnumType.STRING)
    private EstadoPostulacion estado;
    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
