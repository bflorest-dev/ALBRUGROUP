package pe.albrugroup.rrhh_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.rrhh_service.entity.enums.EventoEmpleado;

import java.time.Instant;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Evento {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "empleado_id", nullable = false)
    private Empleado empleado;
    @ManyToOne @JoinColumn(name = "responsable_id", nullable = false)
    private Empleado responsable;
    @Enumerated(EnumType.STRING)
    private EventoEmpleado evento;
    @Column(name = "fecha_evento")
    private Instant fechaEvento;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
