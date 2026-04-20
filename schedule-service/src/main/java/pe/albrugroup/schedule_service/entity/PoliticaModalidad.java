package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "politica_modalidad")
public class PoliticaModalidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private ModalidadContrato modalidad;

    @Column(nullable = false)
    private Integer horasObjetivoSemanal;

    @Column(nullable = false)
    private Integer horasObjetivoMensual;

    @Column(nullable = false)
    private Integer minutosAlmuerzo;

    @Column(nullable = false)
    private Integer minutosServicios;
}
