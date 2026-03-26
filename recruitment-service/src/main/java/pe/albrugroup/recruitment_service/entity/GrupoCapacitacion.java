package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.recruitment_service.entity.enums.EstadoGrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.enums.SalaCapacitacion;
import pe.albrugroup.recruitment_service.entity.enums.TurnoHorario;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(uniqueConstraints = {
        @UniqueConstraint(name = "uk_grupo_capacitacion_codigo", columnNames = "codigo")
})
public class GrupoCapacitacion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String codigo; // 23MAR28M // 30ABR04T
    private Long idCapacitador;

    @Enumerated(EnumType.STRING)
    private TurnoHorario turno;

    @Enumerated(EnumType.STRING)
    private SalaCapacitacion sala;

    private LocalDate fechaInicio;
    private LocalDate fechaFin;

    @Enumerated(EnumType.STRING)
    private EstadoGrupoCapacitacion estado;

    @OneToMany(mappedBy = "grupoCapacitacion", fetch = FetchType.LAZY)
    @Builder.Default
    private List<GrupoCapacitacionDetalle> detalles = new ArrayList<>();

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
