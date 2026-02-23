package pe.albrugroup.rrhh_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.rrhh_service.entity.enums.EventoEmpleado;

import java.time.Instant;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class EmpleadoEvento {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "empleado_id", nullable = false)
    private Empleado empleado;
    @ManyToOne @JoinColumn(name = "responsable_id", nullable = false)
    private Empleado responsable;
    @Enumerated(EnumType.STRING)
    private EventoEmpleado evento;
    private String estado;
    private String subestado;
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private Instant fechaCreacion;
    @Column(name = "fecha_evento")
    private Instant fechaEvento;
}
