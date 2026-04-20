package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.Dia;

import java.time.LocalTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "horario_detalle")
public class HorarioDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "horario_id", nullable = false)
    private Horario horario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Dia dia;

    @Column(nullable = false)
    private LocalTime horaEntrada;

    @Column(nullable = false)
    private LocalTime horaSalida;

    @Column(nullable = false)
    private LocalTime inicioAlmuerzo;

    @Column(nullable = false)
    private LocalTime finAlmuerzo;

    @Builder.Default
    @Column(nullable = false)
    private Boolean laborable = Boolean.TRUE;
}
