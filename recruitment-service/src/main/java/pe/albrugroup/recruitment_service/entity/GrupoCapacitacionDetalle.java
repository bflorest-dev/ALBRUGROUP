package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.recruitment_service.entity.enums.EstadoCapacitacionPostulante;

import java.time.Instant;
import java.time.LocalDate;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_grupo_capacitacion_detalle_postulacion",
                        columnNames = {"postulacion_id"}
                )
        }
)
public class GrupoCapacitacionDetalle {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grupo_capacitacion_id")
    private GrupoCapacitacion grupoCapacitacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "postulacion_id")
    private Postulacion postulacion;

    @Enumerated(EnumType.STRING)
    private EstadoCapacitacionPostulante estadoCapacitacion;

    private LocalDate fechaAsignacion;
    private LocalDate fechaResultado;
    private Long idEmpleadoContratado;
    private LocalDate fechaContratacion;
    private Boolean cumplioTresMeses;
    private LocalDate fechaCumplioTresMeses;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
