package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.TipoExcepcionHorario;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "excepcion_horario")
public class ExcepcionHorario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "horario_id", nullable = false)
    private Horario horario;

    @Column(nullable = false)
    private LocalDate fecha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoExcepcionHorario tipo;

    private LocalTime horaEntrada;

    private LocalTime horaSalida;

    private LocalTime inicioAlmuerzo;

    private LocalTime finAlmuerzo;

    private Boolean laborable;

    @Column(nullable = false, length = 300)
    private String motivo;
}
