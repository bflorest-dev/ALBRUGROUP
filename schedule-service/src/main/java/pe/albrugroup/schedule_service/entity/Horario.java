package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity @Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@Table(
        name = "horario",
        indexes = {
                @Index(name = "idx_horario_empleado", columnList = "idEmpleado"),
                @Index(name = "idx_horario_empleado_vigencia", columnList = "idEmpleado, fechaInicio, fechaFin")
        }
)
public class Horario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long idEmpleado;
    @Column(nullable = false)
    private Long idContrato;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ModalidadContrato modalidadContrato;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "politica_modalidad_id", nullable = false)
    private PoliticaModalidad politicaModalidad;
    @Column(nullable = false)
    private Integer horasObjetivoSemanal;
    @Column(nullable = false)
    private Integer horasObjetivoMensual;
    @Column(nullable = false)
    private Integer minutosAlmuerzo;
    @Column(nullable = false)
    private Integer minutosServicios;
    @Column(nullable = false)
    private LocalDate fechaInicio;
    private LocalDate fechaFin;

    @Builder.Default
    @Column(nullable = false)
    private Boolean compensable = Boolean.TRUE;
    @OneToMany(mappedBy = "horario", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<HorarioDetalle> detalles = new ArrayList<>();
    @OneToMany(mappedBy = "horario", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ExcepcionHorario> excepciones = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
